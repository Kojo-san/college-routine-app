import { describe, it, expect } from 'vitest'
import { parsePdfText, buildDeadlineInputs } from '../syllabus'
import type { SyllabusParsed } from '../syllabus'
import type { ScheduleSlot } from '../schedule'

// ─── parsePdfText ─────────────────────────────────────────────────────────────

describe('parsePdfText', () => {
  it('tracer: returns SyllabusParsed with topics and evaluations arrays', () => {
    const result = parsePdfText('')
    expect(result).toHaveProperty('topics')
    expect(result).toHaveProperty('evaluations')
    expect(Array.isArray(result.topics)).toBe(true)
    expect(Array.isArray(result.evaluations)).toBe(true)
  })

  it('extracts numbered topics', () => {
    const text = `
      Plan de cours

      1. Introduction au calcul différentiel
      2. Dérivées et règles de dérivation
      3. Intégration et primitives
      4. Suites et séries
    `
    const result = parsePdfText(text)
    expect(result.topics).toHaveLength(4)
    expect(result.topics[0]).toBe('Introduction au calcul différentiel')
    expect(result.topics[2]).toBe('Intégration et primitives')
  })

  it('extracts evaluations with percentage weights', () => {
    const text = `
      Évaluation:
      Devoir 1 : 15%
      Examen intra : 35%
      Projet final : 50%
    `
    const result = parsePdfText(text)
    expect(result.evaluations).toHaveLength(3)
    expect(result.evaluations[0].title).toBe('Devoir 1')
    expect(result.evaluations[0].weight).toBe(15)
    expect(result.evaluations[1].title).toBe('Examen intra')
    expect(result.evaluations[1].weight).toBe(35)
    expect(result.evaluations[2].title).toBe('Projet final')
    expect(result.evaluations[2].weight).toBe(50)
  })

  it('extracts a date from an evaluation line when present', () => {
    const text = `
      Examen final : 40% - 2026-12-15
      Devoir 2 : 20%
    `
    const result = parsePdfText(text)
    const exam = result.evaluations.find(e => e.title.includes('Examen final'))
    expect(exam).toBeDefined()
    expect(exam!.date).toBe('2026-12-15')
    const devoir = result.evaluations.find(e => e.title.includes('Devoir 2'))
    expect(devoir!.date).toBeUndefined()
  })

  it('returns empty arrays for text with no recognizable structure', () => {
    const result = parsePdfText('Lorem ipsum dolor sit amet, consectetur adipiscing elit.')
    expect(result.topics).toEqual([])
    expect(result.evaluations).toEqual([])
  })

  it('ignores percentage values outside 1–100 range', () => {
    const text = `
      Test: 150%
      Examen: 0%
      Travail: 30%
    `
    const result = parsePdfText(text)
    expect(result.evaluations).toHaveLength(1)
    expect(result.evaluations[0].title).toBe('Travail')
    expect(result.evaluations[0].weight).toBe(30)
  })

  it('trims whitespace from extracted topics and titles', () => {
    const text = `
      1.    Algèbre linéaire
      2. Espaces vectoriels
    `
    const result = parsePdfText(text)
    expect(result.topics[0]).toBe('Algèbre linéaire')
    expect(result.topics[1]).toBe('Espaces vectoriels')
  })
})

// ─── buildDeadlineInputs ──────────────────────────────────────────────────────

describe('buildDeadlineInputs', () => {
  const courseId = 'course-123'
  const today = new Date('2026-06-04T00:00:00Z')

  it('tracer: returns an array', () => {
    expect(Array.isArray(buildDeadlineInputs(courseId, [], today))).toBe(true)
  })

  it('creates a deadline for each evaluation that has a date', () => {
    const evaluations: SyllabusParsed['evaluations'] = [
      { title: 'Examen final', weight: 40, date: '2026-12-15' },
      { title: 'Participation', weight: 10 },
    ]
    const inputs = buildDeadlineInputs(courseId, evaluations, today)
    expect(inputs).toHaveLength(1)
    expect(inputs[0].title).toBe('Examen final')
  })

  it('maps weight correctly', () => {
    const evaluations: SyllabusParsed['evaluations'] = [
      { title: 'Midterm', weight: 35, date: '2026-10-20' },
    ]
    const inputs = buildDeadlineInputs(courseId, evaluations, today)
    expect(inputs[0].weight).toBe(35)
  })

  it('assigns CRITICAL priority for weight >= 40', () => {
    const evaluations: SyllabusParsed['evaluations'] = [
      { title: 'Final', weight: 50, date: '2026-12-15' },
    ]
    expect(buildDeadlineInputs(courseId, evaluations, today)[0].priority).toBe('CRITICAL')
  })

  it('assigns HIGH priority for weight in [25, 40)', () => {
    const evaluations: SyllabusParsed['evaluations'] = [
      { title: 'Midterm', weight: 35, date: '2026-10-15' },
    ]
    expect(buildDeadlineInputs(courseId, evaluations, today)[0].priority).toBe('HIGH')
  })

  it('assigns MEDIUM priority for weight in [10, 25)', () => {
    const evaluations: SyllabusParsed['evaluations'] = [
      { title: 'Quiz', weight: 15, date: '2026-09-20' },
    ]
    expect(buildDeadlineInputs(courseId, evaluations, today)[0].priority).toBe('MEDIUM')
  })

  it('assigns LOW priority for weight < 10', () => {
    const evaluations: SyllabusParsed['evaluations'] = [
      { title: 'Participation', weight: 5, date: '2026-12-01' },
    ]
    expect(buildDeadlineInputs(courseId, evaluations, today)[0].priority).toBe('LOW')
  })

  it('sets dueDate from the evaluation date string', () => {
    const evaluations: SyllabusParsed['evaluations'] = [
      { title: 'Devoir', weight: 20, date: '2026-11-10' },
    ]
    const input = buildDeadlineInputs(courseId, evaluations, today)[0]
    expect(input.dueDate.toISOString().slice(0, 10)).toBe('2026-11-10')
  })

  it('returns empty array when no evaluations have dates', () => {
    const evaluations: SyllabusParsed['evaluations'] = [
      { title: 'Participation', weight: 10 },
      { title: 'Présence', weight: 5 },
    ]
    expect(buildDeadlineInputs(courseId, evaluations, today)).toHaveLength(0)
  })
})

// ─── parsePdfText — schedules ─────────────────────────────────────────────────

describe('parsePdfText — schedules field', () => {
  it('tracer: result includes a schedules array', () => {
    const result = parsePdfText('')
    expect(result).toHaveProperty('schedules')
    expect(Array.isArray(result.schedules)).toBe(true)
  })

  it('populates schedules with detected recurring slots', () => {
    const text = `
      Plan de cours INF1010

      1. Introduction
      2. Structures de données

      Examen intra : 35% - 2026-10-20

      Horaire hebdomadaire :
      Lundi 08:30 - 10:20 Cours magistral
      Mercredi 13:00-14:50 Lab
    `
    const result = parsePdfText(text)
    expect(result.schedules).toHaveLength(2)
    expect(result.schedules[0]).toMatchObject<ScheduleSlot>({
      dayOfWeek: 1,
      startTime: '08:30',
      endTime: '10:20',
      type: 'COURS',
    })
    expect(result.schedules[1]).toMatchObject<ScheduleSlot>({
      dayOfWeek: 3,
      startTime: '13:00',
      endTime: '14:50',
      type: 'LAB',
    })
  })

  it('returns empty schedules when text has no schedule patterns', () => {
    const text = '1. Introduction\nExamen final : 40%'
    expect(parsePdfText(text).schedules).toEqual([])
  })
})
