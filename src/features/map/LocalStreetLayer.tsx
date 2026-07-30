import { useEffect, useMemo, useRef } from 'react'
import { ImageOverlay, useMap } from 'react-leaflet'
import { ROCA_VIAS_FIELD_BOUNDS } from '@/lib/posterRoutes'
import {
  getLocalRasterTiles,
  LOCAL_MAP_PREVIEW_URL,
  LOCAL_RASTER_TILE_COUNT,
} from '@/lib/localMap'

const BOUNDS: [[number, number], [number, number]] = [
  [ROCA_VIAS_FIELD_BOUNDS.south, ROCA_VIAS_FIELD_BOUNDS.west],
  [ROCA_VIAS_FIELD_BOUNDS.north, ROCA_VIAS_FIELD_BOUNDS.east],
]

/** Preview + five local raster strips (preloaded before mount). */
export function LocalStreetLayer({ onReady }: { onReady: () => void }) {
  const map = useMap()
  const settledTiles = useRef(new Set<number>())
  const tiles = useMemo(() => getLocalRasterTiles(), [])
  const readyOnce = useRef(false)

  useEffect(() => {
    const attribution =
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    map.attributionControl.addAttribution(attribution)
    return () => {
      map.attributionControl.removeAttribution(attribution)
    }
  }, [map])

  useEffect(() => {
    // Cache hit → ImageOverlay may not fire load; settle after paint.
    const t = window.setTimeout(() => {
      if (readyOnce.current) return
      readyOnce.current = true
      onReady()
    }, 120)
    return () => window.clearTimeout(t)
  }, [onReady])

  const markSettled = (id: number) => {
    settledTiles.current.add(id)
    if (
      settledTiles.current.size === LOCAL_RASTER_TILE_COUNT &&
      !readyOnce.current
    ) {
      readyOnce.current = true
      onReady()
    }
  }

  return (
    <>
      <ImageOverlay
        url={LOCAL_MAP_PREVIEW_URL}
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
