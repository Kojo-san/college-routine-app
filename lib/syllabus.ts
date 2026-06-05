import { detectRecurringSlots } from './schedule'
import type { ScheduleSlot } from './schedule'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SyllabusEvaluation {
  title: string
  weight: number      // 1–100
  date?: string       // 'YYYY-MM-DD' when found in text
}

export interface SyllabusParsed {
  topics: string[]
  evaluations: SyllabusEvaluation[]
  schedules: ScheduleSlot[]
}

export interface CreateDeadlineInput {
  title: string
  dueDate: Date
  weight: number
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

// ─── Pure functions ───────────────────────────────────────────────────────────

// Matches:  "1. Topic" or "1) Topic" or "1 - Topic"
const NUMBERED_TOPIC = /^\s*\d+[.)]\s+(.+)$/

// Matches:  "Title : 30%"  or  "Title - 30%"  or  "Title: 30%"
// Optionally followed by a date: " - 2026-12-15" or " 2026-12-15"
const EVALUATION_LINE = /^\s*(.+?)\s*[:\-–]\s*(\d+)\s*%(.*)$/

const DATE_PATTERN = /(\d{4}-\d{2}-\d{2})/

export function parsePdfText(text: string): SyllabusParsed {
  const topics: string[] = []
  const evaluations: SyllabusEvaluation[] = []
  const schedules = detectRecurringSlots(text)

  for (const raw of text.split('\n')) {
    const line = raw.trimEnd()

    const topicMatch = line.match(NUMBERED_TOPIC)
    if (topicMatch) {
      const title = topicMatch[1].trim()
      if (title) topics.push(title)
      continue
    }

    const evalMatch = line.match(EVALUATION_LINE)
    if (evalMatch) {
      const title  = evalMatch[1].trim()
      const weight = parseInt(evalMatch[2], 10)
      const rest   = evalMatch[3] ?? ''

      if (!title || weight < 1 || weight > 100) continue

      const dateMatch = rest.match(DATE_PATTERN)
      const entry: SyllabusEvaluation = { title, weight }
      if (dateMatch) entry.date = dateMatch[1]
      evaluations.push(entry)
    }
  }

  return { topics, evaluations, schedules }
}

function weightToPriority(weight: number): CreateDeadlineInput['priority'] {
  if (weight >= 40) return 'CRITICAL'
  if (weight >= 25) return 'HIGH'
  if (weight >= 10) return 'MEDIUM'
  return 'LOW'
}

export function buildDeadlineInputs(
  _courseId: string,
  evaluations: SyllabusParsed['evaluations'],
  _today: Date,
): CreateDeadlineInput[] {
  const results: CreateDeadlineInput[] = []

  for (const ev of evaluations) {
    if (!ev.date) continue
    const dueDate = new Date(ev.date)
    if (isNaN(dueDate.getTime())) continue

    results.push({
      title:    ev.title,
      dueDate,
      weight:   ev.weight,
      priority: weightToPriority(ev.weight),
    })
  }

  return results
}
