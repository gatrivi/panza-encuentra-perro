import { ROCA_VIAS_FIELD_BOUNDS } from './posterRoutes'

export const LOCAL_RASTER_TILE_COUNT = 5
export const LOCAL_MAP_PREVIEW_URL = '/map/florida-martelli-preview.svg'

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

function loadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    // jsdom never fires Image load for /map/* — don't hang mapReady in tests.
    if (import.meta.env.MODE === 'test') {
      resolve()
      return
    }
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve() // ponytail: still open map if one strip fails
    img.src = url
  })
}

let preloadOnce: Promise<void> | null = null

/** Warm preview + 5 strips before MapContainer mounts — no empty gray. */
export function preloadLocalMap(): Promise<void> {
  if (!preloadOnce) {
    preloadOnce = Promise.all([
      loadImage(LOCAL_MAP_PREVIEW_URL),
      ...getLocalRasterTiles().map((t) => loadImage(t.url)),
    ]).then(() => undefined)
  }
  return preloadOnce
}
