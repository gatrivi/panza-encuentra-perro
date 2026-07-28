import { describe, expect, it } from 'vitest'
import { formatTimeLeft, sunTimes } from './solar'

describe('solar', () => {
  it('computes sunset after sunrise for BA July', () => {
    const t = sunTimes(new Date('2026-07-28T15:00:00-03:00'))
    expect(t.sunset.getTime()).toBeGreaterThan(t.sunrise.getTime())
    expect(t.afterSunset).toBe(false)
    expect(t.minutesLeft).toBeGreaterThan(0)
  })

  it('formats time left', () => {
    expect(formatTimeLeft(95)).toMatch(/1h/)
    expect(formatTimeLeft(-20)).toMatch(/anocheció/)
  })
})
