import { describe, expect, it } from 'vitest'
import {
  CANONICAL_CASE_SLUG,
  caseSlugCandidates,
  normalizeCaseSlug,
  publicCasePath,
} from './caseIdentity'

describe('case identity', () => {
  it.each(['pancita', 'Pancite', ' panza '])(
    'normalizes %s to the canonical slug',
    (value) => {
      expect(normalizeCaseSlug(value)).toBe(CANONICAL_CASE_SLUG)
    },
  )

  it('preserves unrelated reusable case slugs', () => {
    expect(normalizeCaseSlug('firulais')).toBe('firulais')
  })

  it('looks through canonical and legacy documents', () => {
    expect(caseSlugCandidates('pancite')).toEqual(['pancita', 'pancite', 'panza'])
    expect(publicCasePath('panza')).toBe('/c/pancita')
  })
})
