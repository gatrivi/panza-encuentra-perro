import { describe, expect, it } from 'vitest'
import {
  buildPosterAwareRoute,
  getRocaViasStops,
  normalizeRouteMinutes,
  POSTER_MODE_DEFAULT,
} from './posterRoutes'

describe('posterRoutes', () => {
  it('default marks dest + return posters, not outbound', () => {
    const legs = buildPosterAwareRoute(POSTER_MODE_DEFAULT)
    expect(legs.find((l) => l.id === 'outbound')!.posterStops).toHaveLength(0)
    expect(legs.find((l) => l.id === 'destination')!.posterStops.length).toBeGreaterThan(0)
    expect(legs.find((l) => l.id === 'inbound')!.posterStops.length).toBeGreaterThan(0)
  })

  it('full marks all three legs', () => {
    const legs = buildPosterAwareRoute('full')
    expect(legs.every((l) => l.posterStops.length > 0)).toBe(true)
  })

  it('dest_only only destination', () => {
    const legs = buildPosterAwareRoute('dest_only')
    expect(legs.find((l) => l.id === 'outbound')!.posterStops).toHaveLength(0)
    expect(legs.find((l) => l.id === 'inbound')!.posterStops).toHaveLength(0)
    expect(legs.find((l) => l.id === 'destination')!.posterStops.length).toBeGreaterThan(0)
  })

  it('grows the Roca route with the field time budget', () => {
    expect(getRocaViasStops(15)).toHaveLength(3)
    expect(getRocaViasStops(30)).toHaveLength(6)
    expect(getRocaViasStops(45)).toHaveLength(10)
    expect(getRocaViasStops(60)).toHaveLength(13)
    expect(getRocaViasStops(75).length).toBeGreaterThan(13)
    expect(getRocaViasStops(120).length).toBeGreaterThan(
      getRocaViasStops(90).length,
    )
  })

  it('keeps skipped field stops out after recalculation', () => {
    const stops = getRocaViasStops(60, [
      'estacion-florida',
      'maternidad-santa-rosa',
    ])
    expect(stops).toHaveLength(11)
    expect(stops.some((stop) => stop.id === 'estacion-florida')).toBe(false)
  })

  it('clamps and rounds field minutes in 15-minute steps', () => {
    expect(normalizeRouteMinutes('52')).toBe(45)
    expect(normalizeRouteMinutes(999)).toBe(120)
    expect(normalizeRouteMinutes('nope')).toBe(60)
  })
})
