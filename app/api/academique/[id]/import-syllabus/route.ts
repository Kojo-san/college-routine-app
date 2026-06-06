import { parsePdfText, buildDeadlineInputs } from '@/lib/syllabus'
import type { SyllabusEvaluation } from '@/lib/syllabus'
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

const EXTRACTION_PROMPT = `Extract the following from this university course syllabus (Quebec, Polytechnique Montréal):

1. Weekly recurring schedule slots
2. The credit/hour triplet notation (e.g. "3-1-4.5" or "4-2-6")
3. All evaluations/assessments with their weights and dates

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
  "tripletText": "<X-Y-Z triplet string, e.g. 3-1-4.5, or empty string if not found>",
  "evaluations": [
    {
      "title": "<evaluation name>",
      "weight": <integer 1-100>,
      "date": "<YYYY-MM-DD, or null if not specified>"
    }
  ]
}`

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

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

  // ── Step 1: receive file ──────────────────────────────────────────────────
  let fileBuffer: Buffer
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return Response.json({ error: 'Fichier PDF manquant', step: 'upload' }, { status: 400 })
    }
    fileBuffer = Buffer.from(await (file as File).arrayBuffer())
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return Response.json({ error: `Réception du fichier échouée : ${msg}`, step: 'upload' }, { status: 400 })
  }

  // ── Step 2: Claude API — PDF sent directly ────────────────────────────────
  const syllabus = parsePdfText('')  // regex fallback — returns empty without pdf-parse
  const today = new Date()

  let extractedSlots = syllabus.schedules
  let tripletText = ''
  let claudeEvaluations: SyllabusEvaluation[] = []

  const client = getClient()
  if (client) {
    try {
      const resp = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document' as const,
              source: {
                type: 'base64' as const,
                media_type: 'application/pdf' as const,
                data: fileBuffer.toString('base64'),
              },
            },
            { type: 'text' as const, text: EXTRACTION_PROMPT },
          ],
        }],
      })
      const raw = resp.content
        .filter(b => b.type === 'text')
        .map(b => (b as { type: string; text?: string }).text ?? '')
        .join('')

      const claudeResult = parseClaudeScheduleJson(raw)
      if (claudeResult.schedules.length > 0) extractedSlots = claudeResult.schedules
      tripletText = claudeResult.tripletText

      // Parse evaluations from same JSON response
      try {
        const stripped = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
        const parsed = JSON.parse(stripped) as Record<string, unknown>
        if (Array.isArray(parsed.evaluations)) {
          claudeEvaluations = (parsed.evaluations as unknown[])
            .filter((e): e is Record<string, unknown> => e !== null && typeof e === 'object')
            .filter(e => typeof e.title === 'string' && typeof e.weight === 'number')
            .map(e => ({
              title:  (e.title as string).trim(),
              weight: Math.round(e.weight as number),
              ...(typeof e.date === 'string' && DATE_RE.test(e.date as string)
                ? { date: e.date as string }
                : {}),
            }))
            .filter(e => e.title.length > 0 && e.weight >= 1 && e.weight <= 100)
        }
      } catch { /* ignore — evaluations are best-effort */ }

    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.warn(`[import-syllabus] Claude extraction failed for course ${courseId}: ${msg}`)
    }
  }

  const finalEvaluations = claudeEvaluations.length > 0 ? claudeEvaluations : syllabus.evaluations
  const deadlineInputs = buildDeadlineInputs(courseId, finalEvaluations, today)

  // ── Step 3: persist ───────────────────────────────────────────────────────
  try {
    await prisma.$transaction(async (tx) => {
      await tx.coursePlan.upsert({
        where: { courseId },
        create: {
          courseId,
          sourceFileName: 'syllabus.pdf',
          topics: syllabus.topics,
          evaluationRules: finalEvaluations.map(e =>
            `${e.title} — ${e.weight}%${e.date ? ` (${e.date})` : ''}`,
          ),
        },
        update: {
          topics: syllabus.topics,
          evaluationRules: finalEvaluations.map(e =>
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return Response.json({ error: `Sauvegarde échouée : ${msg}`, step: 'db' }, { status: 500 })
  }

  return Response.json({
    scheduleText: tripletText ? `Triplet extrait : ${tripletText}` : '',
    schedules: extractedSlots,
    data: {
      topicsExtracted:      syllabus.topics.length,
      evaluationsExtracted: finalEvaluations.length,
      deadlinesCreated:     deadlineInputs.length,
      schedulesExtracted:   extractedSlots.length,
    },
  }, { status: 201 })
}
