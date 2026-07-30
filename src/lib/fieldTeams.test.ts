import { describe, expect, it } from 'vitest'
import { getMartelliPosterGrid } from './martelliPosterGrid'
import {
  teamForUsername,
  worthStoppingNear,
  WORTH_DETOUR_M,
} from './fieldTeams'

describe('fieldTeams', () => {
  it('maps operators to A/B labels only', () => {
    expect(teamForUsername('paula')).toBe('A')
    expect(teamForUsername('rodrigo')).toBe('A')
    expect(teamForUsername('gaston')).toBe('B')
  })

  it('suggests nearby open slots, skips covered, ignores team territory', () => {
    const slot = getMartelliPosterGrid()[200]!
    const open = worthStoppingNear(slot, [], 3)
    expect(open.length).toBeGreaterThan(0)
    expect(open[0]!.meters).toBeLessThanOrEqual(WORTH_DETOUR_M)

    const covered = worthStoppingNear(slot, [{ lat: slot.lat, lng: slot.lng }], 5)
    expect(covered.every((s) => s.id !== slot.id)).toBe(true)
  })
})
