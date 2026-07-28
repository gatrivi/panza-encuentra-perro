import { describe, expect, it } from 'vitest'
import { calcLeadDecay, calcTipDecay } from './leadDecay'

describe('leadDecay (Sonnet)', () => {
  const now = Date.parse('2026-07-27T21:00:00-03:00')

  it('fresh = red full opacity', () => {
    expect(calcLeadDecay(now - 5 * 60_000, now)).toEqual({
      opacity: 1,
      color: '#e63946',
    })
  })

  it('ages down to gray', () => {
    expect(calcLeadDecay(now - 8 * 3600_000, now).opacity).toBe(0.35)
    expect(calcLeadDecay(now - 48 * 3600_000, now).opacity).toBe(0.2)
  })

  it('tips stay capped / muted', () => {
    const tip = calcTipDecay(now - 5 * 60_000, now)
    expect(tip.opacity).toBeLessThanOrEqual(0.55)
    expect(tip.color).toBe('#e63946')
  })
})
