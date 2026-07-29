import { useEffect, useMemo, useRef } from 'react'
import { ImageOverlay, useMap } from 'react-leaflet'
import { ROCA_VIAS_FIELD_BOUNDS } from '@/lib/posterRoutes'
import {
  getLocalRasterTiles,
  LOCAL_RASTER_TILE_COUNT,
} from '@/lib/localMap'

const BOUNDS: [[number, number], [number, number]] = [
  [ROCA_VIAS_FIELD_BOUNDS.south, ROCA_VIAS_FIELD_BOUNDS.west],
  [ROCA_VIAS_FIELD_BOUNDS.north, ROCA_VIAS_FIELD_BOUNDS.east],
]

/** Immediate preview, then five local raster strips in parallel. */
export function LocalStreetLayer({ onReady }: { onReady: () => void }) {
  const map = useMap()
  const settledTiles = useRef(new Set<number>())
  const tiles = useMemo(() => getLocalRasterTiles(), [])

  useEffect(() => {
    const attribution =
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    map.attributionControl.addAttribution(attribution)
    return () => {
      map.attributionControl.removeAttribution(attribution)
    }
  }, [map])

  const markSettled = (id: number) => {
    settledTiles.current.add(id)
    if (settledTiles.current.size === LOCAL_RASTER_TILE_COUNT) onReady()
  }

  return (
    <>
      <ImageOverlay
        url="/map/florida-martelli-preview.svg"
        bounds={BOUNDS}
        opacity={1}
        zIndex={1}
      />
      {tiles.map((tile) => (
        <ImageOverlay
          key={tile.id}
          url={tile.url}
          bounds={tile.bounds}
          opacity={1}
          zIndex={2}
          eventHandlers={{
            load: () => markSettled(tile.id),
            error: () => markSettled(tile.id),
          }}
        />
      ))}
    </>
  )
}
