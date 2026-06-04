import { deleteCourse } from '@/lib/courses'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    await deleteCourse(id)
    return Response.json({ data: { deleted: true } })
  } catch {
    return Response.json({ error: 'Cours introuvable' }, { status: 404 })
  }
}
