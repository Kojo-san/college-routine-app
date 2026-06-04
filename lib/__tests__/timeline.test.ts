import { describe, it, expect } from 'vitest'
import { calcNowLinePercent } from '../timeline'

describe('calcNowLinePercent', () => {
  it('returns 0 when nowMinutes equals startMinutes', () => {
    expect(calcNowLinePercent(480, 480, 1320)).toBe(0)
  })

  it('returns 100 when nowMinutes equals endMinutes', () => {
    expect(calcNowLinePercent(1320, 480, 1320)).toBe(100)
  })

  it('returns correct percentage for midpoint (12h30 in 8h–22h range)', () => {
    // 12h30 = 750min; range 8h–22h = 480–1320min (840min total)
    // (750-480)/840 * 100 = 270/840 * 100 ≈ 32.14
    const result = calcNowLinePercent(750, 480, 1320)
    expect(result).toBeCloseTo(32.14, 1)
  })

  it('clamps to 0 when nowMinutes is before range', () => {
    expect(calcNowLinePercent(400, 480, 1320)).toBe(0)
  })

  it('clamps to 100 when nowMinutes is after range', () => {
    expect(calcNowLinePercent(1400, 480, 1320)).toBe(100)
  })
})
