/**
 * Salida: Fray Justo Sarmiento × Pelliza (Olivos / cementerio).
 * 3 modos de carteles → alteran qué tramos se marcan para pegar.
 */

export type PosterMode = 'dest_return' | 'full' | 'dest_only'

export const POSTER_MODES: {
  id: PosterMode
  label: string
  hint: string
}[] = [
  {
    id: 'dest_return',
    label: 'Destino+vuelta',
    hint: 'Default: carteles en zona destino y camino de regreso',
  },
  {
    id: 'full',
    label: 'Ida+dest+vuelta',
    hint: 'Carteles en ida, destino y regreso',
  },
  {
    id: 'dest_only',
    label: 'Solo destino',
    hint: 'Carteles solo en la zona destino; ida/vuelta sin paradas',
  },
]

export const POSTER_MODE_DEFAULT: PosterMode = 'dest_return'

/** Casa / salida patrulla */
export const PANZA_HOME_BASE = {
  label: 'Fray Justo Sarmiento × Pelliza',
  lat: -34.5154,
  lng: -58.5077,
} as const

type Stop = { label: string; lat: number; lng: number; poster?: boolean }

/** Ida casa → Roca × vía (Florida / FO) */
const OUTBOUND: Stop[] = [
  { label: 'Salida · Fray Justo × Pelliza', lat: -34.5154, lng: -58.5077 },
  { label: 'Florida · Maipú / Mitre', lat: -34.532, lng: -58.492 },
  { label: 'Roca × España', lat: -34.53074, lng: -58.49038 },
  { label: 'Est. Florida BN', lat: -34.5352, lng: -58.4898 },
]

/** Zona destino — Roca × vía BN (ronda Florida / FO / Padilla) */
const DEST: Stop[] = [
  { label: 'Roca × España', lat: -34.53074, lng: -58.49038 },
  { label: 'Est. Florida BN', lat: -34.5352, lng: -58.4898 },
  { label: 'Mitre × Roca', lat: -34.5387, lng: -58.50743 },
  { label: 'Vía BN → Padilla', lat: -34.5405, lng: -58.5035 },
  { label: 'Estación Padilla', lat: -34.5434, lng: -58.5006 },
  { label: 'Shell Gral Paz 3802', lat: -34.5499, lng: -58.5013 },
]

/** Vuelta distinta (carteles) → casa vía Mitre / Florida */
const INBOUND: Stop[] = [
  { label: 'Salida · Mitre × Roca', lat: -34.5387, lng: -58.50743 },
  { label: 'Maipú × Florida', lat: -34.532, lng: -58.492 },
  { label: 'Olivos · Ugarte', lat: -34.525, lng: -58.512 },
  { label: 'Casa · Fray Justo × Pelliza', lat: -34.5154, lng: -58.5077 },
]

export type RouteLeg = {
  id: 'outbound' | 'destination' | 'inbound'
  label: string
  color: string
  dashArray?: string
  points: [number, number][] // lat,lng for Leaflet
  posterStops: { lat: number; lng: number; label: string }[]
}

function latLngs(stops: Stop[]): [number, number][] {
  return stops.map((s) => [s.lat, s.lng])
}

function posters(
  stops: Stop[],
  enabled: boolean,
): { lat: number; lng: number; label: string }[] {
  if (!enabled) return []
  // skip first/last pure transit if many — mark middle + labeled stops
  return stops
    .filter((_, i) => i > 0 || stops.length <= 2)
    .map((s) => ({ lat: s.lat, lng: s.lng, label: s.label }))
}

/** Construye ida / destino / vuelta según modo de carteles. */
export function buildPosterAwareRoute(mode: PosterMode): RouteLeg[] {
  const outPosters = mode === 'full'
  const destPosters = true
  const inPosters = mode !== 'dest_only'

  return [
    {
      id: 'outbound',
      label: 'Ida',
      color: outPosters ? '#c45c26' : '#8a8a8a',
      dashArray: outPosters ? undefined : '4 8',
      points: latLngs(OUTBOUND),
      posterStops: posters(OUTBOUND.slice(1, -1), outPosters),
    },
    {
      id: 'destination',
      label: 'Destino',
      color: '#1a3a2a',
      points: latLngs(DEST),
      posterStops: posters(DEST, destPosters),
    },
    {
      id: 'inbound',
      label: 'Vuelta',
      color: inPosters ? '#c45c26' : '#8a8a8a',
      dashArray: inPosters ? undefined : '4 8',
      points: latLngs(INBOUND),
      posterStops: posters(INBOUND.slice(0, -1), inPosters),
    },
  ]
}

const MODE_KEY = 'panza.posterMode'

export function readPosterMode(): PosterMode {
  try {
    const v = localStorage.getItem(MODE_KEY) as PosterMode | null
    if (v === 'dest_return' || v === 'full' || v === 'dest_only') return v
  } catch {
    /* ignore */
  }
  return POSTER_MODE_DEFAULT
}

export function writePosterMode(mode: PosterMode) {
  try {
    localStorage.setItem(MODE_KEY, mode)
  } catch {
    /* ignore */
  }
}
