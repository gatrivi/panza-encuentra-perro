import { describe, expect, it } from 'vitest'
import { VOICE_NAV, voiceMeters } from './voiceNav'

describe('voiceNav', () => {
  it('keeps a small phrase set', () => {
    expect(Object.keys(VOICE_NAV).length).toBeLessThanOrEqual(15)
  })

  it('builds meter prompts', () => {
    expect(voiceMeters(47, 'left')).toBe('En 50 metros, girá a la izquierda')
    expect(voiceMeters(20, 'straight')).toBe('En 20 metros, seguí derecho')
  })
})
