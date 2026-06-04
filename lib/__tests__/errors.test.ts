import { describe, it, expect } from 'vitest'
import { parseApiError } from '../errors'

describe('parseApiError — uses body.error when present', () => {
  it('returns body.error string', () => {
    expect(parseApiError({ error: 'Aucun étudiant trouvé' }, 404)).toBe('Aucun étudiant trouvé')
  })

  it('returns body.error over status fallback even for 500', () => {
    expect(parseApiError({ error: 'Prisma: unique constraint' }, 500)).toBe('Prisma: unique constraint')
  })
})

describe('parseApiError — status-based fallbacks', () => {
  it('returns 404 message when no body.error', () => {
    const msg = parseApiError(null, 404)
    expect(msg).toMatch(/étudiant|trouvé/i)
  })

  it('returns API key message for 503', () => {
    const msg = parseApiError({}, 503)
    expect(msg).toMatch(/ANTHROPIC_API_KEY|IA|indisponible/i)
  })

  it('returns generic 500 server message for 500', () => {
    const msg = parseApiError(null, 500)
    expect(msg).toMatch(/500|serveur/i)
  })

  it('returns generic 502 server message for 502', () => {
    const msg = parseApiError(null, 502)
    expect(msg).toMatch(/50[0-9]|serveur/i)
  })

  it('returns fallback for unrecognised status', () => {
    const msg = parseApiError(null, 418)
    expect(msg).toContain('418')
  })
})

describe('parseApiError — defensive handling', () => {
  it('handles non-object body gracefully', () => {
    expect(() => parseApiError('raw string', 500)).not.toThrow()
  })

  it('handles body with non-string error field', () => {
    const msg = parseApiError({ error: 42 }, 500)
    expect(msg).toMatch(/500|serveur/i)
  })

  it('handles undefined body', () => {
    expect(() => parseApiError(undefined, 500)).not.toThrow()
  })
})
