import { describe, expect, it } from 'vitest'
import {
  canDeactivateAvoidAreas,
  canEditAvoidAreas,
  canManageMembers,
  canManageZones,
  canPromoteSightings,
} from './schemas'

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

  it('searchers may edit avoidAreas geometry but not deactivate', () => {
    expect(canEditAvoidAreas('searcher')).toBe(true)
    expect(canDeactivateAvoidAreas('searcher')).toBe(false)
    expect(canDeactivateAvoidAreas('coordinator')).toBe(true)
  })
})
