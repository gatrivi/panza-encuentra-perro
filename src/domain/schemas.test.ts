import { describe, expect, it } from 'vitest'
import {
  SearchTaskSchema,
  SignSchema,
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

  it('validates coordination records', () => {
    expect(
      SearchTaskSchema.safeParse({
        id: 'task-1',
        caseId: 'case-1',
        title: 'Recorrer Maipú',
        kind: 'search',
        status: 'open',
        priority: 'high',
        createdByUid: 'owner-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).success,
    ).toBe(true)
    expect(
      SignSchema.safeParse({
        id: 'sign-1',
        caseId: 'case-1',
        point: [-58.49, -34.51],
        tier: 'A',
        placeType: 'service_station',
        status: 'placed',
        staffPersonallyAlerted: true,
        createdByUid: 'owner-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).success,
    ).toBe(true)
  })
})
