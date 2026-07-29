import { ROCA_VIAS_FIELD_BOUNDS } from './posterRoutes'

export const LOCAL_RASTER_TILE_COUNT = 5

export type LocalRasterTile = {
  id: number
  url: string
  bounds: [[number, number], [number, number]]
}

export function getLocalRasterTiles(): LocalRasterTile[] {
  const { south, west, north, east } = ROCA_VIAS_FIELD_BOUNDS
  const longitudeStep = (east - west) / LOCAL_RASTER_TILE_COUNT
  return Array.from({ length: LOCAL_RASTER_TILE_COUNT }, (_, index) => ({
    id: index + 1,
    url: `/map/florida-martelli-${String(index + 1).padStart(2, '0')}-v1.jpg`,
    bounds: [
      [south, west + longitudeStep * index],
      [north, west + longitudeStep * (index + 1)],
    ],
  }))
}
