import prisma from '@/lib/prisma'
import type { ExerciseType } from '@/app/generated/prisma/client'

const VALID_TYPES: ExerciseType[] = [
  'PUSH', 'PULL', 'LEGS', 'ABS', 'FULL_BODY', 'CARDIO', 'STRETCHING',
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const typeParam = searchParams.get('type')

  if (!typeParam) {
    return Response.json({ error: 'Paramètre type requis' }, { status: 400 })
  }

  const types = typeParam.split(',').map(t => t.trim()) as ExerciseType[]
  const invalid = types.filter(t => !VALID_TYPES.includes(t))
  if (invalid.length > 0) {
    return Response.json({ error: `Type(s) invalide(s): ${invalid.join(', ')}` }, { status: 400 })
  }

  const exercises = await prisma.exercise.findMany({
    where: { type: { in: types } },
    orderBy: [{ type: 'asc' }, { level: 'asc' }, { name: 'asc' }],
  })

  return Response.json({ data: exercises })
}
