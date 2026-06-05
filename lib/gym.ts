// ─── Types ────────────────────────────────────────────────────────────────────

export interface WgerExercise {
  id: number
  name: string
  category: string
  muscles: string[]
  sets: number
  reps: number
  durationMinutes: number
}

export type GymSessionType = 'Push Day' | 'Pull Day' | 'Leg Day' | 'Full Body' | 'Cardio' | 'Stretching'

// Core rotation: Push/Pull/Legs/Full Body. Cardio and Stretching are extra categories.
const ROTATION: GymSessionType[] = ['Push Day', 'Pull Day', 'Leg Day', 'Full Body']

// wger category IDs (from https://wger.de/api/v2/exercisecategory/)
// 8=Arms, 9=Legs, 10=Abs, 11=Chest, 12=Back, 13=Shoulders, 14=Calves
const WGER_CATEGORY: Record<GymSessionType, number> = {
  'Push Day':   11,   // Chest (chest + shoulders + triceps)
  'Pull Day':   12,   // Back
  'Leg Day':    9,    // Legs
  'Full Body':  11,   // default to chest for full body
  'Cardio':     10,   // Abs (no pure cardio category in wger)
  'Stretching': 14,   // Calves (closest to flexibility)
}

// ─── Pure functions ───────────────────────────────────────────────────────────

export function getGymRotationType(sessionIndex: number): GymSessionType {
  const i = ((sessionIndex % ROTATION.length) + ROTATION.length) % ROTATION.length
  return ROTATION[i]
}

export function mapWgerCategory(gymType: string): number {
  return WGER_CATEGORY[gymType as GymSessionType] ?? 11
}

export function buildWgerUrl(params: {
  language?: number
  category?: number
  limit?: number
  offset?: number
}): string {
  const base = 'https://wger.de/api/v2/exercise/'
  const p = new URLSearchParams()
  p.set('format', 'json')
  if (params.language !== undefined) p.set('language', String(params.language))
  if (params.category  !== undefined) p.set('category',  String(params.category))
  if (params.limit     !== undefined) p.set('limit',     String(params.limit))
  if (params.offset    !== undefined) p.set('offset',    String(params.offset))
  return `${base}?${p.toString()}`
}

export function filterExercisesForDuration(
  exercises: WgerExercise[],
  durationMinutes: number,
): WgerExercise[] {
  if (durationMinutes <= 0) return []
  const result: WgerExercise[] = []
  let remaining = durationMinutes
  for (const ex of exercises) {
    if (ex.durationMinutes > remaining) continue
    result.push(ex)
    remaining -= ex.durationMinutes
    if (remaining <= 0) break
  }
  return result
}

// ─── wger API client ──────────────────────────────────────────────────────────

interface WgerApiExercise {
  id: number
  name: string
  muscles: Array<{ name_en: string }>
  muscles_secondary: Array<{ name_en: string }>
  category: { name: string }
  description: string
}

interface WgerApiResponse {
  results: WgerApiExercise[]
  count: number
}

function estimateDuration(sets: number, reps: number): number {
  // ~40s per set including rest
  return Math.round((sets * 40 + sets * (reps / 2)) / 60) + 1
}

export async function fetchWgerExercises(
  gymType: GymSessionType,
  durationMinutes: number,
): Promise<WgerExercise[]> {
  const category = mapWgerCategory(gymType)
  const url = buildWgerUrl({ language: 2, category, limit: 30 })

  const res = await fetch(url, { next: { revalidate: 86400 } })
  if (!res.ok) return []

  const data: WgerApiResponse = await res.json()

  const defaultSets = 3
  const defaultReps = gymType === 'Cardio' ? 0 : 10

  const exercises: WgerExercise[] = data.results
    .filter(e => e.name && e.name.length > 2)
    .map(e => {
      const muscles = [
        ...e.muscles.map(m => m.name_en),
        ...e.muscles_secondary.map(m => m.name_en),
      ].filter(Boolean)

      return {
        id: e.id,
        name: e.name,
        category: e.category?.name ?? gymType,
        muscles: muscles.length > 0 ? muscles : ['Muscles généraux'],
        sets: defaultSets,
        reps: defaultReps,
        durationMinutes: estimateDuration(defaultSets, defaultReps),
      }
    })

  return filterExercisesForDuration(exercises, durationMinutes)
}
