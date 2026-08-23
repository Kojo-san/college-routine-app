import { describe, it, expect } from 'vitest'
import { expandOccurrences } from '../events'
import type { EventType } from '@/app/generated/prisma/client'

// ─── Fixtures ────────────────────────────────────────────────────────────────
// rrule interprets DTSTART through its UTC getters, so BYDAY must be derived
// from getUTCDay() of the stored instant, not the local wall-clock day.
// See EventModal.tsx buildRrule() for the client-side equivalent.

const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

function weeklyRrule(startTime: Date): string {
  return `FREQ=WEEKLY;BYDAY=${DAY_CODES[startTime.getUTCDay()]}`
}

function baseEvent(startTime: Date, endTime: Date, rrule: string | null) {
  return {
    id: 'evt-1',
    title: 'Test',
    startTime,
    endTime,
    type: 'PERSO' as EventType,
    color: '#4E2A84',
    location: null,
    rrule,
  }
}

// Local-time boundaries pre-converted to their UTC instants, matching how
// the client sends [weekStart, weekEnd) for a Montreal (UTC-4, EDT) user.
function montrealLocalMidnightUTC(y: number, mZeroBased: number, d: number): Date {
  return new Date(Date.UTC(y, mZeroBased, d, 4, 0, 0))
}

describe('expandOccurrences — weekly recurrence day-of-week stability', () => {
  it('keeps a Monday 20:00 local event on Monday every week (regression: no shift to Sunday)', () => {
    // Monday 2026-08-24 20:00 Montreal (EDT, UTC-4) -> 2026-08-25T00:00:00Z
    const start = new Date(Date.UTC(2026, 7, 25, 0, 0, 0))
    const end = new Date(Date.UTC(2026, 7, 25, 2, 0, 0))
    const rrule = weeklyRrule(start)
    const event = baseEvent(start, end, rrule)

    const week1Start = montrealLocalMidnightUTC(2026, 7, 24) // Mon Aug 24
    const week1End = montrealLocalMidnightUTC(2026, 7, 31) // Mon Aug 31
    const occ1 = expandOccurrences(event, week1Start, week1End)
    expect(occ1).toHaveLength(1)
    expect(occ1[0].startTime).toBe(start.toISOString()) // no shift — same instant the user picked

    const week2Start = montrealLocalMidnightUTC(2026, 7, 31) // Mon Aug 31
    const week2End = montrealLocalMidnightUTC(2026, 8, 7) // Mon Sep 7
    const occ2 = expandOccurrences(event, week2Start, week2End)
    expect(occ2).toHaveLength(1)

    // The two occurrences must be exactly 7 days apart (no forward-search shift).
    const deltaMs = new Date(occ2[0].startTime).getTime() - new Date(occ1[0].startTime).getTime()
    expect(deltaMs).toBe(7 * 24 * 60 * 60 * 1000)
  })

  it('keeps a Sunday 20:00 local event on Sunday every week', () => {
    // Sunday 2026-08-30 20:00 Montreal (EDT, UTC-4) -> 2026-08-31T00:00:00Z
    const start = new Date(Date.UTC(2026, 7, 31, 0, 0, 0))
    const end = new Date(Date.UTC(2026, 7, 31, 2, 0, 0))
    const rrule = weeklyRrule(start)
    const event = baseEvent(start, end, rrule)

    const weekStart = montrealLocalMidnightUTC(2026, 7, 24) // Mon Aug 24
    const weekEnd = montrealLocalMidnightUTC(2026, 7, 31) // Mon Aug 31 (Sunday Aug 30 falls in this week)
    const occ = expandOccurrences(event, weekStart, weekEnd)

    expect(occ).toHaveLength(1)
    expect(occ[0].startTime).toBe(start.toISOString())
  })

  it('does not shift a non-recurring event', () => {
    const start = new Date(Date.UTC(2026, 7, 28, 21, 0, 0)) // Friday
    const end = new Date(Date.UTC(2026, 7, 28, 23, 0, 0))
    const event = baseEvent(start, end, null)

    const weekStart = montrealLocalMidnightUTC(2026, 7, 24)
    const weekEnd = montrealLocalMidnightUTC(2026, 7, 31)
    const occ = expandOccurrences(event, weekStart, weekEnd)

    expect(occ).toHaveLength(1)
    expect(occ[0].startTime).toBe(start.toISOString())
    expect(occ[0].isRecurring).toBe(false)
  })
})
