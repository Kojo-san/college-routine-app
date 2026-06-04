import { describe, it, expect } from 'vitest'
import {
  buildSystemPrompt,
  buildStudentContextBlock,
  buildUserPrompt,
  extractMessageText,
  interpolateTemplate,
} from '../ai'
import type { SeedRule, AIRecommendationContext } from '../ai'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const sleepRule: SeedRule = {
  id: 'rule-sleep-debt',
  name: 'SLEEP_DEBT_RULE',
  condition: 'sleepDebt > 1h',
  recommendationTemplate:
    "Tu as accumulé {sleepDebt}h de dette de sommeil. Priorise une nuit de 7h30.",
  evidenceTitle: "La Science du sommeil et de l'éveil",
  evidenceAuthors: 'Tricou',
  evidenceYear: 2024,
  evidenceSummary: 'Atelier Polytechnique Montréal sur 40+ études.',
}

const focusRule: SeedRule = {
  ...sleepRule,
  id: 'rule-low-focus',
  name: 'LOW_FOCUS_RULE',
  condition: 'focusLevel < 40',
  recommendationTemplate: "Ton focus est à {focusLevel}/100. Réduis à 25 min.",
  evidenceTitle: 'Study Skills and Academic Performance',
  evidenceAuthors: 'Hassanbeigi et al.',
  evidenceYear: 2011,
  evidenceSummary: null,
}

// ─── buildSystemPrompt ────────────────────────────────────────────────────────

describe('buildSystemPrompt', () => {
  it('contains the rule name', () => {
    const prompt = buildSystemPrompt([sleepRule])
    expect(prompt).toContain('SLEEP_DEBT_RULE')
  })

  it('contains the evidence authors', () => {
    const prompt = buildSystemPrompt([sleepRule])
    expect(prompt).toContain('Tricou')
  })

  it('contains the evidence title', () => {
    const prompt = buildSystemPrompt([sleepRule])
    expect(prompt).toContain("La Science du sommeil")
  })

  it('contains the condition', () => {
    const prompt = buildSystemPrompt([sleepRule])
    expect(prompt).toContain('sleepDebt > 1h')
  })

  it('includes all rules when multiple are passed', () => {
    const prompt = buildSystemPrompt([sleepRule, focusRule])
    expect(prompt).toContain('SLEEP_DEBT_RULE')
    expect(prompt).toContain('LOW_FOCUS_RULE')
    expect(prompt).toContain('Hassanbeigi et al.')
  })

  it('includes the summary when present', () => {
    const prompt = buildSystemPrompt([sleepRule])
    expect(prompt).toContain('Atelier Polytechnique')
  })

  it('omits summary section when null', () => {
    const prompt = buildSystemPrompt([focusRule])
    expect(prompt).not.toContain('null')
  })

  it('returns a substantive string (> 100 chars)', () => {
    expect(buildSystemPrompt([sleepRule]).length).toBeGreaterThan(100)
  })
})

// ─── buildStudentContextBlock ─────────────────────────────────────────────────

describe('buildStudentContextBlock', () => {
  it('formats sleepDebt with one decimal and "h"', () => {
    const ctx: AIRecommendationContext = { ruleName: 'SLEEP_DEBT_RULE', sleepDebt: 1.5 }
    expect(buildStudentContextBlock(ctx)).toContain('1.5h')
  })

  it('formats focusLevel with "/100"', () => {
    const ctx: AIRecommendationContext = { ruleName: 'LOW_FOCUS_RULE', focusLevel: 32 }
    expect(buildStudentContextBlock(ctx)).toContain('32/100')
  })

  it('formats physicalFatigue with "%"', () => {
    const ctx: AIRecommendationContext = { ruleName: 'HIGH_FATIGUE_RULE', physicalFatigue: 72 }
    expect(buildStudentContextBlock(ctx)).toContain('72%')
  })

  it('formats stressLevel with "%"', () => {
    const ctx: AIRecommendationContext = { ruleName: 'HIGH_STRESS_RULE', stressLevel: 85 }
    expect(buildStudentContextBlock(ctx)).toContain('85%')
  })

  it('formats recoveryValue with "/100"', () => {
    const ctx: AIRecommendationContext = { ruleName: 'SLEEP_DEBT_RULE', recoveryValue: 45 }
    expect(buildStudentContextBlock(ctx)).toContain('45/100')
  })

  it('omits undefined fields', () => {
    const ctx: AIRecommendationContext = { ruleName: 'SLEEP_DEBT_RULE', sleepDebt: 2.0 }
    const result = buildStudentContextBlock(ctx)
    expect(result).not.toContain('Focus')
    expect(result).not.toContain('Fatigue physique')
    expect(result).not.toContain('Stress')
  })

  it('returns empty string when only ruleName is provided', () => {
    const ctx: AIRecommendationContext = { ruleName: 'SLEEP_DEBT_RULE' }
    expect(buildStudentContextBlock(ctx)).toBe('')
  })

  it('includes all provided metrics in the same block', () => {
    const ctx: AIRecommendationContext = {
      ruleName: 'SLEEP_DEBT_RULE',
      sleepDebt: 2.0,
      focusLevel: 35,
      stressLevel: 80,
    }
    const result = buildStudentContextBlock(ctx)
    expect(result).toContain('2.0h')
    expect(result).toContain('35/100')
    expect(result).toContain('80%')
  })
})

// ─── buildUserPrompt ──────────────────────────────────────────────────────────

describe('buildUserPrompt', () => {
  const ctx: AIRecommendationContext = { ruleName: 'SLEEP_DEBT_RULE', sleepDebt: 2.5 }

  it('contains the rule name', () => {
    const prompt = buildUserPrompt(sleepRule, ctx)
    expect(prompt).toContain('SLEEP_DEBT_RULE')
  })

  it('contains the numeric value from context', () => {
    const prompt = buildUserPrompt(sleepRule, ctx)
    expect(prompt).toContain('2.5h')
  })

  it('contains the recommendation template', () => {
    const prompt = buildUserPrompt(sleepRule, ctx)
    expect(prompt).toContain(sleepRule.recommendationTemplate)
  })

  it('returns a non-empty string when context is minimal', () => {
    const minimal: AIRecommendationContext = { ruleName: 'SLEEP_DEBT_RULE' }
    expect(buildUserPrompt(sleepRule, minimal).length).toBeGreaterThan(20)
  })
})

// ─── interpolateTemplate ─────────────────────────────────────────────────────

describe('interpolateTemplate', () => {
  it('substitutes {sleepDebt} with toFixed(1)', () => {
    const result = interpolateTemplate('Dette : {sleepDebt}h', { ruleName: 'R', sleepDebt: 2 })
    expect(result).toBe('Dette : 2.0h')
  })

  it('substitutes {focusLevel} as integer', () => {
    const result = interpolateTemplate('Focus {focusLevel}/100', { ruleName: 'R', focusLevel: 34 })
    expect(result).toBe('Focus 34/100')
  })

  it('substitutes {physicalFatigue} with %', () => {
    const result = interpolateTemplate('Fatigue {physicalFatigue}%', { ruleName: 'R', physicalFatigue: 72 })
    expect(result).toBe('Fatigue 72%')
  })

  it('substitutes {stressLevel} with %', () => {
    const result = interpolateTemplate('Stress {stressLevel}%', { ruleName: 'R', stressLevel: 85 })
    expect(result).toBe('Stress 85%')
  })

  it('leaves unknown placeholders intact when value is undefined', () => {
    const result = interpolateTemplate('Dette : {sleepDebt}h', { ruleName: 'R' })
    expect(result).toContain('{sleepDebt}')
  })

  it('handles a template with no placeholders', () => {
    const result = interpolateTemplate('No placeholders here.', { ruleName: 'R', sleepDebt: 1 })
    expect(result).toBe('No placeholders here.')
  })
})

// ─── extractMessageText ───────────────────────────────────────────────────────

describe('extractMessageText', () => {
  it('extracts text from a single text block', () => {
    const content = [{ type: 'text' as const, text: 'Hello world' }]
    expect(extractMessageText(content)).toBe('Hello world')
  })

  it('joins multiple text blocks without extra space', () => {
    const content = [
      { type: 'text' as const, text: 'Hello' },
      { type: 'text' as const, text: ' world' },
    ]
    expect(extractMessageText(content)).toBe('Hello world')
  })

  it('filters out non-text blocks', () => {
    const content = [
      { type: 'text' as const, text: 'Valid' },
      { type: 'tool_use' as const, id: 'x', name: 'foo', input: {} },
    ]
    expect(extractMessageText(content as any[])).toBe('Valid')
  })

  it('trims surrounding whitespace', () => {
    const content = [{ type: 'text' as const, text: '  trimmed  ' }]
    expect(extractMessageText(content)).toBe('trimmed')
  })

  it('returns empty string for empty array', () => {
    expect(extractMessageText([])).toBe('')
  })
})
