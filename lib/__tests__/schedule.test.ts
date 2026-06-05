import { describe, it, expect } from 'vitest'
import { detectRecurringSlots } from '../schedule'
import type { ScheduleSlot } from '../schedule'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const LUNDI_COURS    = 'Lundi 08:30 - 10:20 Cours magistral'
const MERCREDI_LAB   = 'Mercredi 13:00-14:50 Lab'
const VENDREDI_COURS = 'Vendredi 10:30 à 12:20 Cours'
const JEUDI_TP       = 'Jeudi 14:00 to 15:50 TP'

// ─── detectRecurringSlots ─────────────────────────────────────────────────────

describe('detectRecurringSlots', () => {
  it('tracer: returns an array for any input', () => {
    const result = detectRecurringSlots('')
    expect(Array.isArray(result)).toBe(true)
  })

  it('detects "Lundi 08:30 - 10:20 Cours magistral" as COURS on day 1', () => {
    const slots = detectRecurringSlots(LUNDI_COURS)
    expect(slots).toHaveLength(1)
    expect(slots[0]).toMatchObject<ScheduleSlot>({
      dayOfWeek: 1,
      startTime: '08:30',
      endTime: '10:20',
      type: 'COURS',
    })
  })

  it('detects "Mercredi 13:00-14:50 Lab" as LAB on day 3', () => {
    const slots = detectRecurringSlots(MERCREDI_LAB)
    expect(slots).toHaveLength(1)
    expect(slots[0]).toMatchObject<ScheduleSlot>({
      dayOfWeek: 3,
      startTime: '13:00',
      endTime: '14:50',
      type: 'LAB',
    })
  })

  it('detects "Vendredi 10:30 à 12:20 Cours" (séparateur à)', () => {
    const slots = detectRecurringSlots(VENDREDI_COURS)
    expect(slots).toHaveLength(1)
    expect(slots[0]).toMatchObject<ScheduleSlot>({
      dayOfWeek: 5,
      startTime: '10:30',
      endTime: '12:20',
      type: 'COURS',
    })
  })

  it('detects "Jeudi 14:00 to 15:50 TP" (séparateur to) as LAB', () => {
    const slots = detectRecurringSlots(JEUDI_TP)
    expect(slots).toHaveLength(1)
    expect(slots[0]).toMatchObject<ScheduleSlot>({
      dayOfWeek: 4,
      startTime: '14:00',
      endTime: '15:50',
      type: 'LAB',
    })
  })

  it('handles all day abbreviations', () => {
    const cases: [string, number][] = [
      ['Lun 09:00-10:30 Cours', 1],
      ['Mar 09:00-10:30 Cours', 2],
      ['Mer 09:00-10:30 Cours', 3],
      ['Jeu 09:00-10:30 Cours', 4],
      ['Ven 09:00-10:30 Cours', 5],
      ['Sam 09:00-10:30 Cours', 6],
      ['Dim 09:00-10:30 Cours', 0],
    ]
    for (const [line, expectedDay] of cases) {
      const slots = detectRecurringSlots(line)
      expect(slots).toHaveLength(1)
      expect(slots[0].dayOfWeek).toBe(expectedDay)
    }
  })

  it('maps all type keywords correctly', () => {
    const coursKeywords = ['Cours', 'Cours magistral', 'Théorie']
    const labKeywords   = ['Lab', 'Laboratoire', 'TP', 'Travaux pratiques']

    for (const kw of coursKeywords) {
      const slots = detectRecurringSlots(`Lundi 08:00-09:30 ${kw}`)
      expect(slots[0]?.type).toBe('COURS')
    }
    for (const kw of labKeywords) {
      const slots = detectRecurringSlots(`Lundi 08:00-09:30 ${kw}`)
      expect(slots[0]?.type).toBe('LAB')
    }
  })

  it('is case-insensitive', () => {
    const slots = detectRecurringSlots('LUNDI 08:30-10:20 COURS MAGISTRAL')
    expect(slots).toHaveLength(1)
    expect(slots[0].type).toBe('COURS')
    expect(slots[0].dayOfWeek).toBe(1)
  })

  it('detects multiple slots in one text', () => {
    const text = [
      'Lundi 08:30 - 10:20 Cours magistral',
      'Mercredi 13:00-14:50 Lab',
      'Vendredi 10:30 à 12:20 Cours',
    ].join('\n')
    const slots = detectRecurringSlots(text)
    expect(slots).toHaveLength(3)
    expect(slots.map(s => s.dayOfWeek)).toEqual([1, 3, 5])
  })

  it('returns [] when no schedule patterns found', () => {
    const text = 'Lorem ipsum dolor sit amet. Évaluation finale : 40% - 2026-12-15'
    expect(detectRecurringSlots(text)).toEqual([])
  })
})
