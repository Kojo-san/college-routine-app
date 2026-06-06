// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScheduleSlot {
  dayOfWeek: number      // 0=Dim, 1=Lun … 6=Sam
  startTime: string      // "HH:MM"
  endTime: string        // "HH:MM"
  type: 'COURS' | 'LAB'
  code?: string          // course code, e.g. "INF2610"
  room?: string          // room, e.g. "A416"
  group?: string         // group, e.g. "02"
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_MAP: Record<string, number> = {
  dim: 0, dimanche: 0,
  lun: 1, lundi: 1,
  mar: 2, mardi: 2,
  mer: 3, mercredi: 3,
  jeu: 4, jeudi: 4,
  ven: 5, vendredi: 5,
  sam: 6, samedi: 6,
}

const COURS_KEYWORDS = ['cours magistral', 'cours', 'théorie', 'theorie']
const LAB_KEYWORDS   = ['travaux pratiques', 'laboratoire', 'lab', 'tp']

// Day names (longest first to avoid partial matches)
const DAY_PATTERN = Object.keys(DAY_MAP)
  .sort((a, b) => b.length - a.length)
  .join('|')

// HH:MM separator HH:MM [type keyword]
const SLOT_RE = new RegExp(
  `(${DAY_PATTERN})\\s+(\\d{2}:\\d{2})\\s*(?:-|à|to)\\s*(\\d{2}:\\d{2})\\s+(.+)`,
  'gi',
)

// ─── Pure functions ───────────────────────────────────────────────────────────

function resolveType(keyword: string): 'COURS' | 'LAB' | null {
  const k = keyword.trim().toLowerCase()
  for (const lk of LAB_KEYWORDS) {
    if (k === lk || k.startsWith(lk)) return 'LAB'
  }
  for (const ck of COURS_KEYWORDS) {
    if (k === ck || k.startsWith(ck)) return 'COURS'
  }
  return null
}

export function detectRecurringSlots(text: string): ScheduleSlot[] {
  const slots: ScheduleSlot[] = []
  SLOT_RE.lastIndex = 0

  let match: RegExpExecArray | null
  while ((match = SLOT_RE.exec(text)) !== null) {
    const dayKey   = match[1].toLowerCase()
    const start    = match[2]
    const end      = match[3]
    const typeRaw  = match[4]

    const dayOfWeek = DAY_MAP[dayKey]
    if (dayOfWeek === undefined) continue

    const type = resolveType(typeRaw)
    if (!type) continue

    slots.push({ dayOfWeek, startTime: start, endTime: end, type })
  }

  return slots
}
