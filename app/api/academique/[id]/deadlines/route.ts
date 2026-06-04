import { createDeadline, validateDeadlineInput } from '@/lib/courses'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: courseId } = await params
  const body = await request.json()

  const validation = validateDeadlineInput(body)
  if (!validation.valid) {
    return Response.json({ error: validation.errors.join(' — ') }, { status: 400 })
  }

  const deadline = await createDeadline(courseId, body)
  return Response.json({ data: deadline }, { status: 201 })
}
