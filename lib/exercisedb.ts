import type { GymTabType } from './gym'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExerciseDbExercise {
  id: string
  name: string
  bodyPart: string
  target: string
  equipment: string
  gifUrl: string
  secondaryMuscles: string[]
  instructions: string[]
}

// ─── bodyPart mapping ─────────────────────────────────────────────────────────
// ExerciseDB bodyParts: back | cardio | chest | lower arms | lower legs |
//   neck | shoulders | upper arms | upper legs | waist

const BODY_PARTS_FOR_TAB: Record<GymTabType, string[]> = {
  'Push Day':   ['chest', 'shoulders', 'upper arms'],
  'Pull Day':   ['back', 'upper arms'],
  'Legs & Abs': ['upper legs', 'lower legs', 'waist'],
  'Full Body':  ['back', 'chest', 'upper legs', 'upper arms'],
  'Cardio':     ['cardio'],
  'Stretching': ['back', 'upper legs', 'lower legs', 'neck'],
}

// ─── API key helper ───────────────────────────────────────────────────────────

export function readExerciseDbKey(): string | null {
  const raw = process.env.RAPIDAPI_KEY ?? ''
  const cleaned = raw.trim().replace(/^["']|["']$/g, '')
  return cleaned || null
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchBodyPart(
  bodyPart: string,
  apiKey: string,
  limit: number,
): Promise<ExerciseDbExercise[]> {
  const url =
    `https://exercisedb.p.rapidapi.com/exercises/bodyPart/${encodeURIComponent(bodyPart)}` +
    `?limit=${limit}&offset=0`

  const res = await fetch(url, {
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
    },
    next: { revalidate: 86400 }, // 24 h cache per bodyPart URL
  })

  if (!res.ok) {
    console.error(`ExerciseDB bodyPart=${bodyPart} → ${res.status} ${res.statusText}`)
    return []
  }

  const data: unknown = await res.json()
  return Array.isArray(data) ? (data as ExerciseDbExercise[]) : []
}

/**
 * Fetch exercises for a gym tab from ExerciseDB.
 * Results are cached 24h by Next.js Data Cache (deduped by URL).
 * Returns empty array if RAPIDAPI_KEY is absent or all fetches fail.
 */
export async function fetchExercisesForTab(
  tab: GymTabType,
  limitPerBodyPart = 8,
): Promise<ExerciseDbExercise[]> {
  const apiKey = readExerciseDbKey()
  if (!apiKey) {
    console.log('RAPIDAPI_KEY missing — ExerciseDB skipped, using Prisma fallback')
    return []
  }

  const bodyParts = BODY_PARTS_FOR_TAB[tab] ?? []

  const results = await Promise.allSettled(
    bodyParts.map(bp => fetchBodyPart(bp, apiKey, limitPerBodyPart)),
  )

  // Merge, deduplicate by exercise id
  const seen = new Set<string>()
  const exercises: ExerciseDbExercise[] = []

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const ex of result.value) {
        if (ex?.id && !seen.has(ex.id)) {
          seen.add(ex.id)
          exercises.push(ex)
        }
      }
    }
  }

  return exercises
}
