import { parsePdfText, buildDeadlineInputs } from '@/lib/syllabus'
import { parseClaudeScheduleJson } from '@/lib/semester'
import { getOptionalSession } from '@/lib/session'
import prisma from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

// ─── Anthropic client (lazy singleton) ───────────────────────────────────────

let _client: Anthropic | null = null
function getClient(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return null
  if (!_client) _client = new Anthropic({ apiKey: key })
  return _client
}

function buildExtractionPrompt(pdfText: string): string {
  return `Extract the weekly recurring schedule slots from this university course syllabus (Quebec). Also extract the credit/hour triplet notation (e.g. "3-1-4.5" means 3h lecture, 1h lab, 4.5h personal work per week).

Return ONLY a valid JSON object — no explanation, no markdown, no other text:
{
  "schedules": [
    {
      "dayOfWeek": <integer: 0=Sunday 1=Monday 2=Tuesday 3=Wednesday 4=Thursday 5=Friday 6=Saturday>,
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "type": "COURS" or "LAB"
    }
  ],
  "tripletText": "<X-Y-Z triplet string, e.g. 3-1-4.5, or empty string if not found>"
}

SYLLABUS TEXT:
${pdfText.slice(0, 4000)}`
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const { id: courseId } = await params

  const course = await prisma.course.findUnique({ where: { id: courseId, userId: session.userId } })
  if (!course) {
    return Response.json({ error: 'Cours introuvable' }, { status: 404 })
  }

  let pdfText: string
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return Response.json({ error: 'Fichier PDF requis' }, { status: 400 })
    }

    const buffer = Buffer.from(await (file as File).arrayBuffer())
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>
    const parsed = await pdfParse(buffer)
    pdfText = parsed.text
  } catch {
    return Response.json({ error: 'Impossible de lire le fichier PDF' }, { status: 422 })
  }

  const syllabus = parsePdfText(pdfText)
  const today = new Date()
  const deadlineInputs = buildDeadlineInputs(courseId, syllabus.evaluations, today)

  // Claude API for schedule extraction — falls back to regex result if unavailable
  let extractedSlots = syllabus.schedules
  let tripletText = ''
  const client = getClient()
  if (client) {
    try {
      const resp = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: buildExtractionPrompt(pdfText) }],
      })
      const raw = resp.content
        .filter(b => b.type === 'text')
        .map(b => (b as { type: string; text?: string }).text ?? '')
        .join('')
      const claudeResult = parseClaudeScheduleJson(raw)
      if (claudeResult.schedules.length > 0) extractedSlots = claudeResult.schedules
      tripletText = claudeResult.tripletText
    } catch {
      // fallback to regex
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.coursePlan.upsert({
      where: { courseId },
      create: {
        courseId,
        sourceFileName: 'syllabus.pdf',
        topics: syllabus.topics,
        evaluationRules: syllabus.evaluations.map(e =>
          `${e.title} — ${e.weight}%${e.date ? ` (${e.date})` : ''}`,
        ),
      },
      update: {
        topics: syllabus.topics,
        evaluationRules: syllabus.evaluations.map(e =>
          `${e.title} — ${e.weight}%${e.date ? ` (${e.date})` : ''}`,
        ),
      },
    })

    if (deadlineInputs.length > 0) {
      await tx.deadline.createMany({
        data: deadlineInputs.map(d => ({
          courseId,
          title: d.title,
          dueDate: d.dueDate,
          weight: d.weight,
          priority: d.priority,
        })),
        skipDuplicates: true,
      })
    }

    if (extractedSlots.length > 0) {
      await tx.courseSchedule.deleteMany({ where: { courseId } })
      await tx.courseSchedule.createMany({
        data: extractedSlots.map(s => ({
          courseId,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          type: s.type,
        })),
      })
    }
  })

  // Embed triplet in scheduleText if Claude found it but the raw PDF text doesn't contain it
  const scheduleText = tripletText
    ? `${pdfText}\n\nTriplet extrait : ${tripletText}`
    : pdfText

  return Response.json({
    scheduleText,
    schedules: extractedSlots,
    data: {
      topicsExtracted:      syllabus.topics.length,
      evaluationsExtracted: syllabus.evaluations.length,
      deadlinesCreated:     deadlineInputs.length,
      schedulesExtracted:   extractedSlots.length,
    },
  }, { status: 201 })
}
