import { describe, expect, it } from 'vitest'
import {
  buildPosterAwareRoute,
  getRocaViasFieldOrigin,
  getRocaViasStops,
  normalizeRouteMinutes,
  PANZA_HOME_BASE,
  POSTER_MODE_DEFAULT,
  ROCA_VIAS_EPICENTER,
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

  it('keeps remote GPS positions out of the operational route', () => {
    expect(getRocaViasFieldOrigin(PANZA_HOME_BASE)).toBeNull()
    expect(getRocaViasFieldOrigin(ROCA_VIAS_EPICENTER)).toEqual(
      ROCA_VIAS_EPICENTER,
    )

    const route = buildPosterAwareRoute(POSTER_MODE_DEFAULT, {
      plan: 'roca-vias',
      minutes: 60,
      origin: PANZA_HOME_BASE,
    })
    const points = route.flatMap((leg) => leg.points)
    expect(points).not.toContainEqual([
      PANZA_HOME_BASE.lat,
      PANZA_HOME_BASE.lng,
    ])
    expect(points[0]).toEqual([
      ROCA_VIAS_EPICENTER.lat,
      ROCA_VIAS_EPICENTER.lng,
    ])
  })
})
