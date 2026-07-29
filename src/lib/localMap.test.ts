import { describe, expect, it } from 'vitest'
import { ROCA_VIAS_FIELD_BOUNDS } from './posterRoutes'
import { getLocalRasterTiles, LOCAL_RASTER_TILE_COUNT } from './localMap'

describe('local raster map', () => {
  it('covers the complete field area with five contiguous images', () => {
    const tiles = getLocalRasterTiles()
    expect(tiles).toHaveLength(LOCAL_RASTER_TILE_COUNT)
    expect(tiles[0]!.bounds[0][1]).toBe(ROCA_VIAS_FIELD_BOUNDS.west)
    expect(tiles.at(-1)!.bounds[1][1]).toBe(ROCA_VIAS_FIELD_BOUNDS.east)

    for (let index = 1; index < tiles.length; index += 1) {
      expect(tiles[index - 1]!.bounds[1][1]).toBe(
        tiles[index]!.bounds[0][1],
      )
    }
  })
})
