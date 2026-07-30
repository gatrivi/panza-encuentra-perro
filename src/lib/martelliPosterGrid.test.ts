import { describe, expect, it } from 'vitest'
import {
  coveredMartelliSlotIds,
  getMartelliPosterGrid,
  MARTELLI_BOUNDS,
  MARTELLI_POSTER_TARGET,
  martelliGridProgress,
  nearestOpenMartelliSlots,
} from './martelliPosterGrid'

describe('martelliPosterGrid', () => {
  it('builds exactly 1200 slots inside Villa Martelli bbox', () => {
    const grid = getMartelliPosterGrid()
    expect(grid).toHaveLength(MARTELLI_POSTER_TARGET)
    expect(grid[0]!.id).toBe('vm-0001')
    expect(grid.at(-1)!.id).toBe('vm-1200')
    for (const s of grid) {
      expect(s.lat).toBeGreaterThanOrEqual(MARTELLI_BOUNDS.south)
      expect(s.lat).toBeLessThanOrEqual(MARTELLI_BOUNDS.north)
      expect(s.lng).toBeGreaterThanOrEqual(MARTELLI_BOUNDS.west)
      expect(s.lng).toBeLessThanOrEqual(MARTELLI_BOUNDS.east)
    }
  })

  it('splits into four sectors and tracks coverage', () => {
    const grid = getMartelliPosterGrid()
    const sectors = new Set(grid.map((s) => s.sector))
    expect(sectors).toEqual(new Set(['NO', 'NE', 'SO', 'SE']))

    const hit = grid[100]!
    const prog = martelliGridProgress([{ lat: hit.lat, lng: hit.lng }])
    expect(prog.covered).toBe(1)
    expect(prog.total).toBe(1200)
    expect(coveredMartelliSlotIds([{ lat: hit.lat, lng: hit.lng }]).has(hit.id)).toBe(
      true,
    )
  })

  it('nearestOpen skips covered', () => {
    const grid = getMartelliPosterGrid()
    const a = grid[0]!
    const covered = new Set([a.id])
    const open = nearestOpenMartelliSlots(a, covered, 5)
    expect(open).toHaveLength(5)
    expect(open.every((s) => s.id !== a.id)).toBe(true)
  })
})
