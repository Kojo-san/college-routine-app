import { createCourse, validateCourseInput } from '@/lib/courses'
import { getOptionalSession } from '@/lib/session'

export async function POST(request: Request) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { userId } = session

  const body = await request.json()

  const validation = validateCourseInput(body)
  if (!validation.valid) {
    return Response.json({ error: validation.errors.join(' — ') }, { status: 400 })
  }

  const course = await createCourse(userId, body)
  return Response.json({ data: course }, { status: 201 })
}
