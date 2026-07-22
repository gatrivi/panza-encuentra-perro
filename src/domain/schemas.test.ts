import { describe, expect, it } from 'vitest'
import { canManageMembers, canManageZones, canPromoteSightings } from './schemas'

describe('role helpers', () => {
  it('searchers cannot promote sightings', () => {
    expect(canPromoteSightings('searcher')).toBe(false)
    expect(canPromoteSightings('coordinator')).toBe(true)
    expect(canPromoteSightings('owner')).toBe(true)
  })

  it('only owner manages members', () => {
    expect(canManageMembers('owner')).toBe(true)
    expect(canManageMembers('coordinator')).toBe(false)
  })

  it('coordinators manage zones', () => {
    expect(canManageZones('coordinator')).toBe(true)
    expect(canManageZones('searcher')).toBe(false)
  })
})
