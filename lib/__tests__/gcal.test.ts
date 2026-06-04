import { describe, it, expect } from 'vitest'
import { parseGCalEvent, planBlockToGCalEvent } from '../gcal'
import type { GCalEvent } from '../gcal'

// ─── parseGCalEvent ───────────────────────────────────────────────────────────

const makeEvent = (
  summary: string,
  start: string,
  end: string,
): GCalEvent => ({
  id: 'evt-1',
  summary,
  start: { dateTime: start },
  end: { dateTime: end },
})

describe('parseGCalEvent', () => {
  it('tracer: returns an ImportedBlock for a valid timed event', () => {
    const ev = makeEvent('Réunion', '2026-06-04T09:00:00', '2026-06-04T10:00:00')
    const block = parseGCalEvent(ev)
    expect(block).not.toBeNull()
    expect(block).toHaveProperty('label')
    expect(block).toHaveProperty('startTime')
    expect(block).toHaveProperty('endTime')
    expect(block).toHaveProperty('typeActivite')
  })

  it('returns null for an all-day event (date only, no dateTime)', () => {
    const ev: GCalEvent = {
      id: 'evt-2',
      summary: 'Congé',
      start: { date: '2026-06-04' },
      end: { date: '2026-06-05' },
    }
    expect(parseGCalEvent(ev)).toBeNull()
  })

  it('returns null when summary is missing', () => {
    const ev: GCalEvent = {
      id: 'evt-3',
      summary: '',
      start: { dateTime: '2026-06-04T09:00:00' },
      end: { dateTime: '2026-06-04T10:00:00' },
    }
    expect(parseGCalEvent(ev)).toBeNull()
  })

  it('maps the summary as the label', () => {
    const ev = makeEvent('Cours MTH1102', '2026-06-04T08:30:00', '2026-06-04T10:00:00')
    expect(parseGCalEvent(ev)!.label).toBe('Cours MTH1102')
  })

  it('parses startTime and endTime as Date objects', () => {
    const ev = makeEvent('Test', '2026-06-04T09:00:00', '2026-06-04T10:30:00')
    const block = parseGCalEvent(ev)!
    expect(block.startTime).toBeInstanceOf(Date)
    expect(block.endTime).toBeInstanceOf(Date)
    expect(block.startTime.getHours()).toBe(9)
    expect(block.endTime.getHours()).toBe(10)
    expect(block.endTime.getMinutes()).toBe(30)
  })

  it('classifies study events by keyword "étude"', () => {
    const ev = makeEvent('Étude MTH1102', '2026-06-04T09:00:00', '2026-06-04T10:00:00')
    expect(parseGCalEvent(ev)!.typeActivite).toBe('STUDY')
  })

  it('classifies study events by keyword "révision"', () => {
    const ev = makeEvent('Révision examen final', '2026-06-04T14:00:00', '2026-06-04T16:00:00')
    expect(parseGCalEvent(ev)!.typeActivite).toBe('STUDY')
  })

  it('classifies study events by keyword "cours"', () => {
    const ev = makeEvent('Cours de physique', '2026-06-04T08:00:00', '2026-06-04T10:00:00')
    expect(parseGCalEvent(ev)!.typeActivite).toBe('STUDY')
  })

  it('classifies fitness events by keyword "gym"', () => {
    const ev = makeEvent('Gym — Push day', '2026-06-04T17:00:00', '2026-06-04T18:00:00')
    expect(parseGCalEvent(ev)!.typeActivite).toBe('FITNESS')
  })

  it('classifies fitness events by keyword "sport"', () => {
    const ev = makeEvent('Sport du matin', '2026-06-04T07:00:00', '2026-06-04T08:00:00')
    expect(parseGCalEvent(ev)!.typeActivite).toBe('FITNESS')
  })

  it('classifies fitness events by keyword "entraînement"', () => {
    const ev = makeEvent('Entraînement cardio', '2026-06-04T06:00:00', '2026-06-04T07:00:00')
    expect(parseGCalEvent(ev)!.typeActivite).toBe('FITNESS')
  })

  it('classifies recovery events by keyword "récupération"', () => {
    const ev = makeEvent('Récupération active', '2026-06-04T17:30:00', '2026-06-04T18:00:00')
    expect(parseGCalEvent(ev)!.typeActivite).toBe('RECOVERY')
  })

  it('classifies recovery events by keyword "repos"', () => {
    const ev = makeEvent('Repos & méditation', '2026-06-04T20:00:00', '2026-06-04T20:30:00')
    expect(parseGCalEvent(ev)!.typeActivite).toBe('RECOVERY')
  })

  it('classifies meal events by keyword "déjeuner"', () => {
    const ev = makeEvent('Déjeuner avec famille', '2026-06-04T12:00:00', '2026-06-04T13:00:00')
    expect(parseGCalEvent(ev)!.typeActivite).toBe('MEAL')
  })

  it('classifies meal events by keyword "dîner"', () => {
    const ev = makeEvent('Dîner', '2026-06-04T18:00:00', '2026-06-04T19:00:00')
    expect(parseGCalEvent(ev)!.typeActivite).toBe('MEAL')
  })

  it('defaults to FREE for unrecognized keywords', () => {
    const ev = makeEvent('Rendez-vous médecin', '2026-06-04T11:00:00', '2026-06-04T12:00:00')
    expect(parseGCalEvent(ev)!.typeActivite).toBe('FREE')
  })
})

// ─── planBlockToGCalEvent ─────────────────────────────────────────────────────

import type { TimeBlockSummary } from '../planning'

const makeBlock = (overrides: Partial<TimeBlockSummary> = {}): TimeBlockSummary => ({
  id: 'blk-1',
  startTime: new Date('2026-06-04T09:00:00'),
  endTime: new Date('2026-06-04T10:00:00'),
  label: 'Étude — MTH1102',
  priority: 'HIGH',
  typeActivite: 'STUDY',
  ...overrides,
})

describe('planBlockToGCalEvent', () => {
  it('tracer: returns an object with summary, start, end', () => {
    const event = planBlockToGCalEvent(makeBlock(), new Date('2026-06-04'))
    expect(event).toHaveProperty('summary')
    expect(event).toHaveProperty('start')
    expect(event).toHaveProperty('end')
    expect(event.start).toHaveProperty('dateTime')
    expect(event.end).toHaveProperty('dateTime')
  })

  it('uses the block label as the event summary', () => {
    const event = planBlockToGCalEvent(makeBlock(), new Date('2026-06-04'))
    expect(event.summary).toBe('Étude — MTH1102')
  })

  it('encodes start and end as ISO datetime strings', () => {
    const block = makeBlock({
      startTime: new Date('2026-06-04T09:00:00'),
      endTime: new Date('2026-06-04T10:00:00'),
    })
    const event = planBlockToGCalEvent(block, new Date('2026-06-04'))
    expect(typeof event.start.dateTime).toBe('string')
    expect(typeof event.end.dateTime).toBe('string')
    expect(event.start.dateTime).toContain('2026-06-04')
    expect(event.end.dateTime).toContain('2026-06-04')
  })

  it('includes a description with priority and type', () => {
    const event = planBlockToGCalEvent(makeBlock(), new Date('2026-06-04'))
    expect(event.description).toBeDefined()
    expect(event.description!.toLowerCase()).toMatch(/high|study/i)
  })
})
