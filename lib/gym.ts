// ─── Types ────────────────────────────────────────────────────────────────────

/** Tab display types used in the /gym UI */
export type GymTabType =
  | 'Push Day'
  | 'Pull Day'
  | 'Legs & Abs'
  | 'Full Body'
  | 'Cardio'
  | 'Stretching'

/** Raw exercise types stored in Prisma */
export type ExerciseDbType =
  | 'PUSH'
  | 'PULL'
  | 'LEGS'
  | 'ABS'
  | 'FULL_BODY'
  | 'CARDIO'
  | 'STRETCHING'

/** Maps each UI tab to the DB exercise types it displays */
export const TAB_TO_DB_TYPES: Record<GymTabType, ExerciseDbType[]> = {
  'Push Day':   ['PUSH'],
  'Pull Day':   ['PULL'],
  'Legs & Abs': ['LEGS', 'ABS'],
  'Full Body':  ['FULL_BODY'],
  'Cardio':     ['CARDIO'],
  'Stretching': ['STRETCHING'],
}

export const ALL_GYM_TABS: GymTabType[] = [
  'Push Day',
  'Pull Day',
  'Legs & Abs',
  'Full Body',
  'Cardio',
  'Stretching',
]

/**
 * Day-of-week rotation for automatic tab selection.
 * 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
 */
const DAY_ROTATION: Record<number, GymTabType> = {
  0: 'Full Body',
  1: 'Push Day',
  2: 'Pull Day',
  3: 'Legs & Abs',
  4: 'Full Body',
  5: 'Cardio',
  6: 'Stretching',
}

export function getRotationTypeForDayOfWeek(dayOfWeek: number): GymTabType {
  return DAY_ROTATION[dayOfWeek] ?? 'Full Body'
}

export function getTodayGymTab(): GymTabType {
  return getRotationTypeForDayOfWeek(new Date().getDay())
}

export const SESSION_TYPE_COLORS: Record<
  GymTabType,
  { bg: string; border: string; text: string; glow: string }
> = {
  'Push Day':   { bg: 'rgba(255,209,102,0.10)', border: 'rgba(255,209,102,0.3)', text: '#FFD166', glow: 'rgba(255,209,102,0.35)' },
  'Pull Day':   { bg: 'rgba(74,158,255,0.10)',  border: 'rgba(74,158,255,0.3)',  text: '#4A9EFF', glow: 'rgba(74,158,255,0.35)'  },
  'Legs & Abs': { bg: 'rgba(168,255,120,0.10)', border: 'rgba(168,255,120,0.3)', text: '#A8FF78', glow: 'rgba(168,255,120,0.35)' },
  'Full Body':  { bg: 'rgba(155,143,255,0.10)', border: 'rgba(155,143,255,0.3)', text: '#9B8FFF', glow: 'rgba(155,143,255,0.35)' },
  'Cardio':     { bg: 'rgba(255,107,157,0.10)', border: 'rgba(255,107,157,0.3)', text: '#FF6B9D', glow: 'rgba(255,107,157,0.35)' },
  'Stretching': { bg: 'rgba(255,179,71,0.10)',  border: 'rgba(255,179,71,0.3)',  text: '#FFB347', glow: 'rgba(255,179,71,0.35)'  },
}

/** Estimate session duration from exercise count (~5 min/exercise + warmup) */
export function estimateSessionMinutes(exerciseCount: number): number {
  return Math.round(exerciseCount * 5 + 10)
}
