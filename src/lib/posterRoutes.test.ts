import { describe, expect, it } from 'vitest'
import { buildPosterAwareRoute, POSTER_MODE_DEFAULT } from './posterRoutes'

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
})
