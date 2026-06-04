import { createTask, validateTaskInput } from '@/lib/courses'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: courseId } = await params
  const body = await request.json()

  const validation = validateTaskInput(body)
  if (!validation.valid) {
    return Response.json({ error: validation.errors.join(' — ') }, { status: 400 })
  }

  const task = await createTask(courseId, body)
  return Response.json({ data: task }, { status: 201 })
}
