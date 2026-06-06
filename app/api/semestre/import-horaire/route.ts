import { parsePolyHoraireJson } from '@/lib/semester'
import { getOptionalSession } from '@/lib/session'
import prisma from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

// ─── Anthropic client ─────────────────────────────────────────────────────────

let _client: Anthropic | null = null
function getClient(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return null
  if (!_client) _client = new Anthropic({ apiKey: key })
  return _client
}

const EXTRACTION_PROMPT = `Extract all weekly course schedule entries from this Polytechnique Montréal student schedule PDF.

Each entry has a course code (e.g. INF2610, LOG2995, CHM2210), a day, start time, end time, and type (lecture or lab).

Return ONLY a valid JSON object — no explanation, no markdown, no other text:
{
  "slots": [
    {
      "code": "<COURSE CODE e.g. INF2610>",
      "dayOfWeek": <integer: 0=Sunday 1=Monday 2=Tuesday 3=Wednesday 4=Thursday 5=Friday 6=Saturday>,
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "type": "COURS" or "LAB"
    }
  ]
}

Rules:
- Use "LAB" only when the entry is explicitly a lab, tutorial, or practical session
- Default to "COURS" for lectures and anything ambiguous
- Include ALL course entries found
- Course codes are typically 3 letters + 4 digits (INF2610, LOG2995, MTH1115, etc.)
- Times must be in HH:MM 24-hour format`

// ─── Route ────────────────────────────────────────────────────────────────────

export interface ImportHoraireResult {
  slots: Array<{
    dayOfWeek: number
    startTime: string
    endTime: string
    type: 'COURS' | 'LAB'
  }>
  matched: number
  total: number
  unmatched: string[]
}

export async function POST(request: Request) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

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

  // ── Step 2: send PDF directly to Claude ───────────────────────────────────
  const client = getClient()
  if (!client) {
    return Response.json({ error: 'ANTHROPIC_API_KEY manquante — extraction impossible', step: 'claude' }, { status: 503 })
  }

  let extracted: ReturnType<typeof parsePolyHoraireJson> = []
  try {
    const resp = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
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
    extracted = parsePolyHoraireJson(raw)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return Response.json({ error: `Extraction Claude échouée : ${msg}`, step: 'claude' }, { status: 502 })
  }

  if (extracted.length === 0) {
    return Response.json({ error: 'Aucun créneau détecté dans le PDF — vérifiez que c\'est bien un horaire de session Polytechnique', step: 'parse' }, { status: 422 })
  }

  // ── Step 4: match extracted codes to Course records ───────────────────────
  const userCourses = await prisma.course.findMany({
    where: { userId: session.userId },
    select: { id: true, code: true },
  })

  const courseByCode = new Map(userCourses.map(c => [c.code.toUpperCase().trim(), c.id]))

  const matched: string[] = []
  const unmatched: string[] = []

  for (const slot of extracted) {
    const courseId = courseByCode.get(slot.code)
    if (courseId) {
      if (!matched.includes(slot.code)) matched.push(slot.code)
    } else {
      if (!unmatched.includes(slot.code)) unmatched.push(slot.code)
    }
  }

  // ── Step 5: persist matched CourseSchedule records ────────────────────────
  try {
    await prisma.$transaction(async (tx) => {
      for (const code of matched) {
        const courseId = courseByCode.get(code)!
        const slots = extracted.filter(s => s.code === code)

        await tx.courseSchedule.deleteMany({ where: { courseId } })
        await tx.courseSchedule.createMany({
          data: slots.map(s => ({
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

  // Return all extracted slots (regardless of match) for the visual grid
  const slots = extracted.map(s => ({
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    type: s.type,
  }))

  return Response.json({
    slots,
    matched: matched.length,
    total: [...new Set(extracted.map(s => s.code))].length,
    unmatched,
  } satisfies ImportHoraireResult, { status: 201 })
}
