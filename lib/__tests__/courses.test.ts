import { describe, it, expect } from 'vitest'
import { validateCourseInput, validateTaskInput, validateDeadlineInput } from '../courses'

// ── validateCourseInput ────────────────────────────────────────────────────────

describe('validateCourseInput — valid', () => {
  it('accepts minimal input (code + name)', () => {
    const r = validateCourseInput({ code: 'MTH1102', name: 'Algèbre Linéaire' })
    expect(r.valid).toBe(true)
    expect(r.errors).toHaveLength(0)
  })

  it('accepts all optional fields', () => {
    const r = validateCourseInput({
      code: 'INF1600',
      name: 'Architecture des ordinateurs',
      difficultyLevel: 3,
      estimatedWeeklyWorkload: 4.5,
    })
    expect(r.valid).toBe(true)
  })

  it('accepts difficultyLevel = 1 (boundary)', () => {
    expect(validateCourseInput({ code: 'X', name: 'Y', difficultyLevel: 1 }).valid).toBe(true)
  })

  it('accepts difficultyLevel = 5 (boundary)', () => {
    expect(validateCourseInput({ code: 'X', name: 'Y', difficultyLevel: 5 }).valid).toBe(true)
  })

  it('accepts estimatedWeeklyWorkload = 0', () => {
    expect(validateCourseInput({ code: 'X', name: 'Y', estimatedWeeklyWorkload: 0 }).valid).toBe(true)
  })
})

describe('validateCourseInput — invalid', () => {
  it('rejects null', () => {
    expect(validateCourseInput(null).valid).toBe(false)
  })

  it('rejects a non-object', () => {
    expect(validateCourseInput('MTH1102').valid).toBe(false)
  })

  it('rejects missing code', () => {
    const r = validateCourseInput({ name: 'Algèbre' })
    expect(r.valid).toBe(false)
    expect(r.errors.some(e => e.toLowerCase().includes('code'))).toBe(true)
  })

  it('rejects empty code', () => {
    expect(validateCourseInput({ code: '   ', name: 'Algèbre' }).valid).toBe(false)
  })

  it('rejects missing name', () => {
    const r = validateCourseInput({ code: 'MTH1102' })
    expect(r.valid).toBe(false)
    expect(r.errors.some(e => e.toLowerCase().includes('nom'))).toBe(true)
  })

  it('rejects empty name', () => {
    expect(validateCourseInput({ code: 'MTH1102', name: '' }).valid).toBe(false)
  })

  it('rejects difficultyLevel = 0', () => {
    expect(validateCourseInput({ code: 'X', name: 'Y', difficultyLevel: 0 }).valid).toBe(false)
  })

  it('rejects difficultyLevel = 6', () => {
    expect(validateCourseInput({ code: 'X', name: 'Y', difficultyLevel: 6 }).valid).toBe(false)
  })

  it('rejects non-integer difficultyLevel', () => {
    expect(validateCourseInput({ code: 'X', name: 'Y', difficultyLevel: 2.5 }).valid).toBe(false)
  })

  it('rejects negative estimatedWeeklyWorkload', () => {
    expect(validateCourseInput({ code: 'X', name: 'Y', estimatedWeeklyWorkload: -1 }).valid).toBe(false)
  })

  it('collects multiple errors at once', () => {
    const r = validateCourseInput({ code: '', name: '', difficultyLevel: 10 })
    expect(r.valid).toBe(false)
    expect(r.errors.length).toBeGreaterThanOrEqual(3)
  })
})

// ── validateTaskInput ──────────────────────────────────────────────────────────

describe('validateTaskInput — valid', () => {
  it('accepts minimal input (title only)', () => {
    const r = validateTaskInput({ title: 'Faire les exercices 1–10' })
    expect(r.valid).toBe(true)
    expect(r.errors).toHaveLength(0)
  })

  it('accepts all optional fields', () => {
    const r = validateTaskInput({
      title: 'Relire notes',
      estimatedDurationMinutes: 30,
      priority: 'HIGH',
      description: 'Chapitres 3 et 4',
    })
    expect(r.valid).toBe(true)
  })

  it('accepts priority CRITICAL', () => {
    expect(validateTaskInput({ title: 'T', priority: 'CRITICAL' }).valid).toBe(true)
  })

  it('accepts priority LOW', () => {
    expect(validateTaskInput({ title: 'T', priority: 'LOW' }).valid).toBe(true)
  })
})

describe('validateTaskInput — invalid', () => {
  it('rejects null', () => {
    expect(validateTaskInput(null).valid).toBe(false)
  })

  it('rejects a non-object', () => {
    expect(validateTaskInput(42).valid).toBe(false)
  })

  it('rejects empty title', () => {
    const r = validateTaskInput({ title: '' })
    expect(r.valid).toBe(false)
    expect(r.errors.some(e => e.toLowerCase().includes('titre'))).toBe(true)
  })

  it('rejects whitespace-only title', () => {
    expect(validateTaskInput({ title: '   ' }).valid).toBe(false)
  })

  it('rejects estimatedDurationMinutes = 0', () => {
    expect(validateTaskInput({ title: 'T', estimatedDurationMinutes: 0 }).valid).toBe(false)
  })

  it('rejects negative estimatedDurationMinutes', () => {
    expect(validateTaskInput({ title: 'T', estimatedDurationMinutes: -10 }).valid).toBe(false)
  })

  it('rejects invalid priority', () => {
    expect(validateTaskInput({ title: 'T', priority: 'EXTREME' }).valid).toBe(false)
  })
})

// ── validateDeadlineInput ──────────────────────────────────────────────────────

describe('validateDeadlineInput — valid', () => {
  it('accepts minimal input', () => {
    const r = validateDeadlineInput({ title: 'Examen final', dueDate: '2026-12-15', weight: 40 })
    expect(r.valid).toBe(true)
    expect(r.errors).toHaveLength(0)
  })

  it('accepts weight = 0 (boundary)', () => {
    expect(validateDeadlineInput({ title: 'T', dueDate: '2026-12-01', weight: 0 }).valid).toBe(true)
  })

  it('accepts weight = 100 (boundary)', () => {
    expect(validateDeadlineInput({ title: 'T', dueDate: '2026-12-01', weight: 100 }).valid).toBe(true)
  })

  it('accepts optional priority HIGH', () => {
    const r = validateDeadlineInput({ title: 'T', dueDate: '2026-12-01', weight: 30, priority: 'HIGH' })
    expect(r.valid).toBe(true)
  })
})

describe('validateDeadlineInput — invalid', () => {
  it('rejects null', () => {
    expect(validateDeadlineInput(null).valid).toBe(false)
  })

  it('rejects a non-object', () => {
    expect(validateDeadlineInput('deadline').valid).toBe(false)
  })

  it('rejects missing title', () => {
    const r = validateDeadlineInput({ dueDate: '2026-12-01', weight: 30 })
    expect(r.valid).toBe(false)
    expect(r.errors.some(e => e.toLowerCase().includes('titre'))).toBe(true)
  })

  it('rejects empty title', () => {
    expect(validateDeadlineInput({ title: '', dueDate: '2026-12-01', weight: 30 }).valid).toBe(false)
  })

  it('rejects missing dueDate', () => {
    const r = validateDeadlineInput({ title: 'T', weight: 30 })
    expect(r.valid).toBe(false)
    expect(r.errors.some(e => e.toLowerCase().includes('date'))).toBe(true)
  })

  it('rejects invalid date string', () => {
    expect(validateDeadlineInput({ title: 'T', dueDate: 'not-a-date', weight: 30 }).valid).toBe(false)
  })

  it('accepts missing weight (optional)', () => {
    const r = validateDeadlineInput({ title: 'T', dueDate: '2026-12-01' })
    expect(r.valid).toBe(true)
  })

  it('rejects weight < 0', () => {
    expect(validateDeadlineInput({ title: 'T', dueDate: '2026-12-01', weight: -1 }).valid).toBe(false)
  })

  it('rejects weight > 100', () => {
    expect(validateDeadlineInput({ title: 'T', dueDate: '2026-12-01', weight: 101 }).valid).toBe(false)
  })

  it('rejects invalid priority', () => {
    expect(validateDeadlineInput({ title: 'T', dueDate: '2026-12-01', weight: 30, priority: 'URGENT' }).valid).toBe(false)
  })

  it('collects multiple errors at once', () => {
    const r = validateDeadlineInput({ title: '', weight: 150 })
    expect(r.valid).toBe(false)
    expect(r.errors.length).toBeGreaterThanOrEqual(3)
  })
})
