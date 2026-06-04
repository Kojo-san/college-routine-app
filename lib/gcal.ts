import type { TimeBlockSummary } from './planning'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GCalEvent {
  id: string
  summary: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
}

export interface ImportedBlock {
  label: string
  startTime: Date
  endTime: Date
  typeActivite: 'STUDY' | 'FITNESS' | 'RECOVERY' | 'MEAL' | 'FREE'
}

export interface GCalEventInput {
  summary: string
  start: { dateTime: string }
  end: { dateTime: string }
  description?: string
}

// ─── Keyword classification ───────────────────────────────────────────────────

type BlockActivite = ImportedBlock['typeActivite']

const KEYWORDS: Array<{ type: BlockActivite; words: string[] }> = [
  {
    type: 'STUDY',
    words: ['étude', 'etude', 'révision', 'revision', 'cours', 'devoir', 'tp ', 'examen', 'labo'],
  },
  {
    type: 'FITNESS',
    words: ['gym', 'sport', 'entraînement', 'entrainement', 'fitness', 'musculation', 'cardio', 'yoga', 'natation', 'course à pied'],
  },
  {
    type: 'RECOVERY',
    words: ['récupération', 'recuperation', 'repos', 'méditation', 'meditation', 'sieste', 'nsdr', 'cohérence'],
  },
  {
    type: 'MEAL',
    words: ['déjeuner', 'dejeuner', 'dîner', 'diner', 'petit-déjeuner', 'repas', 'brunch', 'souper'],
  },
]

function classifyByKeywords(summary: string): BlockActivite {
  const lower = summary.toLowerCase()
  for (const { type, words } of KEYWORDS) {
    if (words.some(w => lower.includes(w))) return type
  }
  return 'FREE'
}

// ─── Pure functions ───────────────────────────────────────────────────────────

export function parseGCalEvent(event: GCalEvent): ImportedBlock | null {
  if (!event.summary) return null
  if (!event.start.dateTime || !event.end.dateTime) return null

  const startTime = new Date(event.start.dateTime)
  const endTime   = new Date(event.end.dateTime)
  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return null

  return {
    label: event.summary,
    startTime,
    endTime,
    typeActivite: classifyByKeywords(event.summary),
  }
}

export function planBlockToGCalEvent(
  block: TimeBlockSummary,
  _date: Date,
): GCalEventInput {
  return {
    summary: block.label,
    start: { dateTime: block.startTime.toISOString() },
    end: { dateTime: block.endTime.toISOString() },
    description: `Priorité: ${block.priority} | Type: ${block.typeActivite ?? 'TASK'} | Généré par College Routine`,
  }
}
