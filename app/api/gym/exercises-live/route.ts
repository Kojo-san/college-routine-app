import { fetchExercisesForTab } from '@/lib/exercisedb'
import { ALL_GYM_TABS } from '@/lib/gym'
import type { GymTabType } from '@/lib/gym'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tab = searchParams.get('tab') as GymTabType | null

  if (!tab || !ALL_GYM_TABS.includes(tab as GymTabType)) {
    return Response.json(
      { error: `Paramètre tab invalide. Valeurs: ${ALL_GYM_TABS.join(', ')}` },
      { status: 400 },
    )
  }

  const exercises = await fetchExercisesForTab(tab)

  return Response.json(
    { data: exercises, source: exercises.length > 0 ? 'exercisedb' : 'unavailable' },
    {
      headers: {
        // allow CDN/edge to cache this response for 24h too
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
      },
    },
  )
}
