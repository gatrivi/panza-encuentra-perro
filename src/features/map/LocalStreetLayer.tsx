import { useEffect, useState } from 'react'
import { GeoJSON, ImageOverlay, useMap, useMapEvents } from 'react-leaflet'
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson'
import type { PathOptions } from 'leaflet'
import { ROCA_VIAS_FIELD_BOUNDS } from '@/lib/posterRoutes'

const BOUNDS: [[number, number], [number, number]] = [
  [ROCA_VIAS_FIELD_BOUNDS.south, ROCA_VIAS_FIELD_BOUNDS.west],
  [ROCA_VIAS_FIELD_BOUNDS.north, ROCA_VIAS_FIELD_BOUNDS.east],
]

type DetailLevel = 'overview' | 'streets' | 'detail'

function levelForZoom(zoom: number): DetailLevel {
  if (zoom >= 17) return 'detail'
  if (zoom >= 15) return 'streets'
  return 'overview'
}

function roadStyle(feature?: {
  properties: GeoJsonProperties
}): PathOptions {
  const properties = feature?.properties ?? {}
  if (properties.kind === 'rail') {
    return {
      color: '#414943',
      weight: 2.5,
      opacity: 0.9,
      dashArray: '6 5',
    }
  }
  const roadClass = String(properties.class ?? '')
  const main =
    roadClass.startsWith('motorway') ||
    roadClass.startsWith('trunk') ||
    roadClass.startsWith('primary') ||
    roadClass.startsWith('secondary')
  return {
    color: main ? '#d6cdbd' : '#f7f4ed',
    weight: main ? 3.2 : 1.4,
    opacity: main ? 0.95 : 0.75,
  }
}

/** Fixed Florida–Martelli street extract: preview first, vector detail on zoom. */
export function LocalStreetLayer({ onReady }: { onReady: () => void }) {
  const map = useMap()
  const [level, setLevel] = useState<DetailLevel>(() =>
    levelForZoom(map.getZoom()),
  )
  const [data, setData] = useState<
    FeatureCollection<Geometry, GeoJsonProperties> | null
  >(null)

  useMapEvents({
    zoomend: () => setLevel(levelForZoom(map.getZoom())),
  })

  useEffect(() => {
    const attribution =
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    map.attributionControl.addAttribution(attribution)
    return () => {
      map.attributionControl.removeAttribution(attribution)
    }
  }, [map])

  useEffect(() => {
    const controller = new AbortController()
    void fetch(`/map/florida-martelli-${level}.geojson`, {
      signal: controller.signal,
      cache: 'force-cache',
    })
      .then((response) => {
        if (!response.ok) throw new Error(`map ${response.status}`)
        return response.json()
      })
      .then((next) => setData(next))
      .catch(() => undefined)
    return () => controller.abort()
  }, [level])

  return (
    <>
      <ImageOverlay
        url="/map/florida-martelli-preview.svg"
        bounds={BOUNDS}
        opacity={data ? 0.72 : 1}
        eventHandlers={{ load: onReady }}
      />
      {data ? (
        <GeoJSON
          key={level}
          data={data}
          style={roadStyle}
          interactive={false}
        />
      ) : null}
    </>
  )
}
