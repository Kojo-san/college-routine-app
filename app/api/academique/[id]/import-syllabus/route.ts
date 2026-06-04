import { parsePdfText, buildDeadlineInputs } from '@/lib/syllabus'
import prisma from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: courseId } = await params

  const course = await prisma.course.findUnique({ where: { id: courseId } })
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
  })

  return Response.json({
    data: {
      topicsExtracted: syllabus.topics.length,
      evaluationsExtracted: syllabus.evaluations.length,
      deadlinesCreated: deadlineInputs.length,
    },
  }, { status: 201 })
}
