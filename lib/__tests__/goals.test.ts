import { describe, it, expect } from 'vitest'
import { validateGoalInput } from '../goals'

// ─── Valid inputs ─────────────────────────────────────────────────────────────

describe('validateGoalInput — valid inputs', () => {
  it('accepts a minimal ACADEMIC goal', () => {
    const r = validateGoalInput({ type: 'ACADEMIC', title: 'Atteindre 3.5 GPA' })
    expect(r.valid).toBe(true)
    expect(r.errors).toHaveLength(0)
  })

  it('accepts a minimal FITNESS goal', () => {
    const r = validateGoalInput({ type: 'FITNESS', title: 'Perdre 5 kg' })
    expect(r.valid).toBe(true)
    expect(r.errors).toHaveLength(0)
  })

  it('accepts all optional fields correctly filled', () => {
    const r = validateGoalInput({
      type: 'ACADEMIC',
      title: 'GPA cible',
      description: 'Fin de session',
      priority: 'HIGH',
      targetDate: '2026-12-15',
      targetGpa: 3.5,
    })
    expect(r.valid).toBe(true)
  })

  it('accepts targetGpa = 0 (boundary)', () => {
    expect(validateGoalInput({ type: 'ACADEMIC', title: 'T', targetGpa: 0 }).valid).toBe(true)
  })

  it('accepts targetGpa = 4.0 (boundary)', () => {
    expect(validateGoalInput({ type: 'ACADEMIC', title: 'T', targetGpa: 4.0 }).valid).toBe(true)
  })

  it('accepts targetBodyFat = 0 (boundary)', () => {
    expect(validateGoalInput({ type: 'FITNESS', title: 'T', targetBodyFat: 0 }).valid).toBe(true)
  })

  it('accepts targetBodyFat = 100 (boundary)', () => {
    expect(validateGoalInput({ type: 'FITNESS', title: 'T', targetBodyFat: 100 }).valid).toBe(true)
  })
})

// ─── Invalid inputs ───────────────────────────────────────────────────────────

describe('validateGoalInput — invalid inputs', () => {
  it('rejects null', () => {
    const r = validateGoalInput(null)
    expect(r.valid).toBe(false)
    expect(r.errors.length).toBeGreaterThan(0)
  })

  it('rejects a non-object', () => {
    expect(validateGoalInput('string').valid).toBe(false)
    expect(validateGoalInput(42).valid).toBe(false)
  })

  it('rejects an empty title', () => {
    const r = validateGoalInput({ type: 'ACADEMIC', title: '' })
    expect(r.valid).toBe(false)
    expect(r.errors.some(e => e.toLowerCase().includes('titre'))).toBe(true)
  })

  it('rejects a whitespace-only title', () => {
    const r = validateGoalInput({ type: 'ACADEMIC', title: '   ' })
    expect(r.valid).toBe(false)
  })

  it('rejects a missing type', () => {
    const r = validateGoalInput({ title: 'Objectif sans type' })
    expect(r.valid).toBe(false)
  })

  it('rejects an invalid type', () => {
    const r = validateGoalInput({ type: 'SPORT', title: 'foo' })
    expect(r.valid).toBe(false)
  })

  it('rejects an invalid priority', () => {
    const r = validateGoalInput({ type: 'ACADEMIC', title: 'foo', priority: 'EXTREME' })
    expect(r.valid).toBe(false)
  })

  it('rejects targetGpa < 0', () => {
    const r = validateGoalInput({ type: 'ACADEMIC', title: 'foo', targetGpa: -0.1 })
    expect(r.valid).toBe(false)
  })

  it('rejects targetGpa > 4.0', () => {
    const r = validateGoalInput({ type: 'ACADEMIC', title: 'foo', targetGpa: 4.1 })
    expect(r.valid).toBe(false)
  })

  it('rejects negative targetWeight', () => {
    const r = validateGoalInput({ type: 'FITNESS', title: 'foo', targetWeight: -5 })
    expect(r.valid).toBe(false)
  })

  it('rejects targetBodyFat < 0', () => {
    const r = validateGoalInput({ type: 'FITNESS', title: 'foo', targetBodyFat: -1 })
    expect(r.valid).toBe(false)
  })

  it('rejects targetBodyFat > 100', () => {
    const r = validateGoalInput({ type: 'FITNESS', title: 'foo', targetBodyFat: 101 })
    expect(r.valid).toBe(false)
  })

  it('collects multiple errors at once', () => {
    const r = validateGoalInput({ type: 'INVALID', title: '', targetGpa: -1 })
    expect(r.valid).toBe(false)
    expect(r.errors.length).toBeGreaterThanOrEqual(3)
  })
})
