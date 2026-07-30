/**
 * Editable POI catalog (weights + on/off). Defaults from Roca route +
 * high-impact anchors. Overrides live in localStorage — family phone only.
 */

import { ROCA_VIAS_STOPS } from '@/lib/posterRoutes'

export type PoiKind = 'via' | 'gas' | 'station' | 'shop' | 'plaza' | 'cross' | 'health' | 'other'

export type CatalogPoi = {
  id: string
  label: string
  why: string
  lat: number
  lng: number
  /** Default weight 1–10 (higher = more important for carteles). */
  defaultW: number
  kind: PoiKind
}

export type PoiOverride = {
  on?: boolean
  w?: number
}

const KEY = 'panza.poi.overrides.v1'

function defaultWFromMinutes(minMinutes: number): number {
  if (minMinutes <= 30) return 10
  if (minMinutes <= 45) return 8
  if (minMinutes <= 60) return 7
  return 6
}

function kindFromLabel(label: string, why: string): PoiKind {
  const t = `${label} ${why}`.toLowerCase()
  if (/estación|estacion|vía|via|tren|belgrano|padilla|florida/.test(t))
    return 'station'
  if (/shell|ypf|puma|petrobras|nafta|combustible|gnc/.test(t)) return 'gas'
  if (/plaza|parque|verde|paseador/.test(t)) return 'plaza'
  if (/caps|salud|clínica|clinica|veterinar/.test(t)) return 'health'
  if (/super|market|luna|dia|barata|outlet|comercio|shop/.test(t)) return 'shop'
  if (/×|x |cruce|constituyentes|maipú|maipu/.test(t)) return 'cross'
  if (/roca|vía|via/.test(t)) return 'via'
  return 'other'
}

/** Seed catalog — curated stops, not the 1200 grid. */
export const POI_CATALOG: readonly CatalogPoi[] = [
  ...ROCA_VIAS_STOPS.map((s) => ({
    id: s.id,
    label: s.label,
    why: s.why,
    lat: s.lat,
    lng: s.lng,
    defaultW: defaultWFromMinutes(s.minMinutes),
    kind: kindFromLabel(s.label, s.why),
  })),
  {
    id: 'constituyentes-maipu',
    label: 'Constituyentes × Maipú',
    why: 'cruce alto tránsito · avistajes previos',
    lat: -34.5633,
    lng: -58.5152,
    defaultW: 10,
    kind: 'cross',
  },
  {
    id: 'shell-gralpaz-3802',
    label: 'Shell Gral Paz 3802',
    why: 'nafta 24 h · delivery / Uber / bicis',
    lat: -34.5499,
    lng: -58.5013,
    defaultW: 9,
    kind: 'gas',
  },
  {
    id: 'estacion-padilla',
    label: 'Estación Padilla',
    why: 'andén + rampas · gente que espera',
    lat: -34.5434,
    lng: -58.5006,
    defaultW: 9,
    kind: 'station',
  },
]

function readOverrides(): Record<string, PoiOverride> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, PoiOverride>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeOverrides(next: Record<string, PoiOverride>) {
  localStorage.setItem(KEY, JSON.stringify(next))
}

export function isPoiOn(id: string, overrides = readOverrides()): boolean {
  const o = overrides[id]
  return o?.on !== false
}

export function poiWeight(id: string, overrides = readOverrides()): number {
  const base = POI_CATALOG.find((p) => p.id === id)?.defaultW ?? 5
  const w = overrides[id]?.w
  if (typeof w === 'number' && Number.isFinite(w)) {
    return Math.max(1, Math.min(10, Math.round(w)))
  }
  return base
}

export type EffectivePoi = CatalogPoi & { w: number; on: boolean }

export function listPois(): EffectivePoi[] {
  const overrides = readOverrides()
  return POI_CATALOG.map((p) => ({
    ...p,
    on: isPoiOn(p.id, overrides),
    w: poiWeight(p.id, overrides),
  })).sort((a, b) => b.w - a.w || a.label.localeCompare(b.label, 'es'))
}

/** Anchors used for scoring — only enabled POIs. */
export function effectiveValueAnchors(): {
  id: string
  lat: number
  lng: number
  w: number
  label: string
}[] {
  return listPois()
    .filter((p) => p.on)
    .map((p) => ({
      id: p.id,
      lat: p.lat,
      lng: p.lng,
      w: p.w,
      label: p.label,
    }))
}

export function setPoiOn(id: string, on: boolean) {
  const next = readOverrides()
  const cur = next[id] ?? {}
  next[id] = { ...cur, on }
  writeOverrides(next)
}

export function setPoiWeight(id: string, w: number) {
  const next = readOverrides()
  const cur = next[id] ?? {}
  next[id] = {
    ...cur,
    w: Math.max(1, Math.min(10, Math.round(w))),
  }
  writeOverrides(next)
}

export function resetPoiOverrides() {
  localStorage.removeItem(KEY)
}

export function disabledPoiIds(): Set<string> {
  const overrides = readOverrides()
  const out = new Set<string>()
  for (const p of POI_CATALOG) {
    if (!isPoiOn(p.id, overrides)) out.add(p.id)
  }
  return out
}

export const POI_KIND_LABEL: Record<PoiKind, string> = {
  via: 'Vía / Roca',
  gas: 'Nafta',
  station: 'Estación',
  shop: 'Comercio',
  plaza: 'Plaza',
  cross: 'Cruce',
  health: 'Salud',
  other: 'Otro',
}
