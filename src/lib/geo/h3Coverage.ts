import {
  latLngToCell,
  cellToBoundary,
  cellsToMultiPolygon,
  gridDisk,
} from 'h3-js'
import { booleanIntersects } from '@turf/boolean-intersects'
import {
  polygon as turfPolygon,
  multiPolygon as turfMultiPolygon,
  featureCollection,
} from '@turf/helpers'
import { union } from '@turf/union'
import type { Feature, MultiPolygon, Polygon } from 'geojson'
import type { AvoidArea, GeoJsonPolygon, GeoPoint } from '@/domain/schemas'
import { DEFAULT_H3_RES } from '@/domain/schemas'

export type HexState = {
  status: 'assigned' | 'walked' | 'signed' | 'revisit'
  updatedAt: Date
  posterAt?: boolean
}

/** Lon/lat → H3 cell id. */
export function pointToCell(point: GeoPoint, res = DEFAULT_H3_RES): string {
  return latLngToCell(point[1], point[0], res)
}

/** Leaflet-ready ring: [lat, lng][] from cell boundary. */
export function cellToLatLngRing(cellId: string): [number, number][] {
  return cellToBoundary(cellId).map(([lat, lng]) => [lat, lng])
}

export function cellsToGeoJson(
  cellIds: string[],
): Feature<Polygon | MultiPolygon> | null {
  if (cellIds.length === 0) return null
  const rings = cellsToMultiPolygon(cellIds, true)
  if (rings.length === 0) return null
  if (rings.length === 1) return turfPolygon(rings[0])
  return turfMultiPolygon(rings)
}

export function sweptToPolygon(cellIds: string[]): GeoJsonPolygon | null {
  const feat = cellsToGeoJson([...new Set(cellIds)])
  if (!feat) return null
  if (feat.geometry.type === 'Polygon') {
    return feat.geometry as GeoJsonPolygon
  }
  // MultiPolygon → take exterior of first + note: merge path prefers union later
  const first = feat.geometry.coordinates[0]
  if (!first) return null
  return { type: 'Polygon', coordinates: first as GeoJsonPolygon['coordinates'] }
}

export function tocaRiesgo(
  hexId: string,
  avoidAreas: AvoidArea[],
  cache?: Map<string, boolean>,
): boolean {
  if (cache?.has(hexId)) return cache.get(hexId)!
  const rings = cellsToMultiPolygon([hexId], true)
  if (!rings[0]) {
    cache?.set(hexId, false)
    return false
  }
  const hexPoly = turfPolygon(rings[0])
  const hit = avoidAreas.some(
    (a) => a.active && booleanIntersects(hexPoly, { type: 'Feature', properties: {}, geometry: a.geometry }),
  )
  cache?.set(hexId, hit)
  return hit
}

export function buildTocaRiesgoCache(avoidAreas: AvoidArea[], hexIds: string[]): Set<string> {
  const cache = new Map<string, boolean>()
  const touching = new Set<string>()
  for (const id of hexIds) {
    if (tocaRiesgo(id, avoidAreas, cache)) touching.add(id)
  }
  return touching
}

/**
 * Sonnet: ¿este punto (o anillo 1) ya está peinado?
 * Avisa antes de mandar a repetir la misma cuadra.
 */
export function zonaYaPeinada(
  point: GeoPoint,
  hexesPeinados: Set<string>,
  anillos = 1,
): boolean {
  const hex = pointToCell(point)
  return gridDisk(hex, anillos).some((h) => hexesPeinados.has(h))
}

export function sugerirCarteles(
  hexIds: string[],
  touching: Set<string>,
  hexes: Map<string, HexState>,
): string[] {
  const perimetro: string[] = []
  const resto: string[] = []
  for (const id of hexIds) {
    if (touching.has(id) || hexes.get(id)?.posterAt) continue
    const nearRisk = gridDisk(id, 1).some((v) => touching.has(v))
    ;(nearRisk ? perimetro : resto).push(id)
  }
  return [...perimetro, ...resto]
}

/** Age fade 0..1 — fresh=1, week+=~0.15 floor. */
export function coverageFade(updatedAt: Date, now = Date.now()): number {
  const ageH = (now - updatedAt.getTime()) / 3_600_000
  if (ageH < 6) return 1
  if (ageH < 24) return 0.75
  if (ageH < 72) return 0.5
  if (ageH < 168) return 0.3
  return 0.15
}

export function coverageFillColor(updatedAt: Date, status: HexState['status']): string {
  const a = coverageFade(updatedAt)
  if (status === 'signed') return `rgba(196, 92, 38, ${0.25 + a * 0.45})`
  if (status === 'revisit') return `rgba(155, 44, 44, ${0.2 + a * 0.35})`
  return `rgba(45, 90, 66, ${0.15 + a * 0.4})`
}

/** Interpolate lon/lat steps so bike gaps don't skip hexes. */
export function interpolatePoints(
  a: GeoPoint,
  b: GeoPoint,
  stepMeters = 25,
): GeoPoint[] {
  const [lng1, lat1] = a
  const [lng2, lat2] = b
  const distM = haversineM(a, b)
  if (distM <= stepMeters) return [b]
  const n = Math.ceil(distM / stepMeters)
  const out: GeoPoint[] = []
  for (let i = 1; i <= n; i++) {
    const t = i / n
    out.push([lng1 + (lng2 - lng1) * t, lat1 + (lat2 - lat1) * t])
  }
  return out
}

export function cellsAlongPath(points: GeoPoint[], res = DEFAULT_H3_RES): string[] {
  const cells = new Set<string>()
  for (let i = 0; i < points.length; i++) {
    cells.add(pointToCell(points[i]!, res))
    if (i > 0) {
      for (const p of interpolatePoints(points[i - 1]!, points[i]!)) {
        cells.add(pointToCell(p, res))
      }
    }
  }
  return [...cells]
}

function haversineM(a: GeoPoint, b: GeoPoint): number {
  const R = 6_371_000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b[1] - a[1])
  const dLng = toRad(b[0] - a[0])
  const lat1 = toRad(a[1])
  const lat2 = toRad(b[1])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function mergeAvoidGeometry(
  existing: GeoJsonPolygon,
  swept: GeoJsonPolygon,
): GeoJsonPolygon {
  const a = turfPolygon(existing.coordinates)
  const b = turfPolygon(swept.coordinates)
  const merged = union(featureCollection([a, b]))
  if (!merged) return swept
  if (merged.geometry.type === 'Polygon') {
    return merged.geometry as GeoJsonPolygon
  }
  // MultiPolygon: take largest ring set as single polygon (ponytail ceiling)
  const coords = merged.geometry.coordinates
  let best = coords[0]!
  for (const c of coords) {
    if ((c[0]?.length ?? 0) > (best[0]?.length ?? 0)) best = c
  }
  return { type: 'Polygon', coordinates: best as GeoJsonPolygon['coordinates'] }
}

export function findIntersectingAvoidArea(
  areas: AvoidArea[],
  swept: GeoJsonPolygon,
): AvoidArea | undefined {
  const sweptFeat = turfPolygon(swept.coordinates)
  return areas.find(
    (a) =>
      a.active &&
      booleanIntersects(sweptFeat, {
        type: 'Feature',
        properties: {},
        geometry: a.geometry,
      }),
  )
}
