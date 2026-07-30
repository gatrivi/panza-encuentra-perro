/**
 * Poster routes. The legacy route stays available; the current field route
 * starts at the confirmed Roca × rail sighting and grows with the time budget.
 */

export type PosterMode = 'dest_return' | 'full' | 'dest_only'
export type RoutePlanId = 'home-martelli' | 'roca-vias'

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
export const FIELD_ROUTE_DEFAULT_MINUTES = 60
export const FIELD_ROUTE_MIN_MINUTES = 15
export const FIELD_ROUTE_MAX_MINUTES = 120
export const FIELD_ROUTE_STEP_MINUTES = 15

/** Casa / salida patrulla */
export const PANZA_HOME_BASE = {
  label: 'Fray Justo Sarmiento × Pelliza',
  lat: -34.5154,
  lng: -58.5077,
} as const

/** Último avistamiento confirmado informado en campo, 29/7. */
export const ROCA_VIAS_EPICENTER = {
  id: 'roca-vias',
  label: 'Roca × vías del Belgrano Norte',
  why: 'último avistamiento confirmado; cruzó hacia Villa Martelli',
  lat: -34.53944,
  lng: -58.508577,
} as const

export type RouteOrigin = {
  lat: number
  lng: number
}

/** Same fixed area bundled in public/map for the current field operation. */
export const ROCA_VIAS_FIELD_BOUNDS = {
  south: -34.557,
  west: -58.534,
  north: -34.528,
  east: -58.496,
} as const

/**
 * A remote GPS position is only a reference, never part of the field loop.
 * This prevents home / transit positions from shrinking the operational map.
 */
export function getRocaViasFieldOrigin(
  origin: RouteOrigin | null | undefined,
): RouteOrigin | null {
  if (!origin) return null
  const { south, west, north, east } = ROCA_VIAS_FIELD_BOUNDS
  return origin.lat >= south &&
    origin.lat <= north &&
    origin.lng >= west &&
    origin.lng <= east
    ? origin
    : null
}

type Stop = {
  id?: string
  label: string
  why?: string
  lat: number
  lng: number
  poster?: boolean
}

export type FieldRouteStop = Required<
  Pick<Stop, 'id' | 'label' | 'why' | 'lat' | 'lng'>
> & {
  minMinutes: number
}

/**
 * Clockwise loop. 60 minutes = 13 high-impact stops (~11.7 km / ~24 min
 * driving before traffic + short poster stops). Extra stops are inserted in
 * the same loop at 15-minute thresholds, so changing time does not restart it.
 */
export const ROCA_VIAS_STOPS: readonly FieldRouteStop[] = [
  {
    id: 'estacion-florida',
    label: 'Estación Florida + plazas de la vía',
    why: 'pasajeros, ambos lados de la vía y permanencia',
    lat: -34.5371432,
    lng: -58.5130649,
    minMinutes: 30,
  },
  {
    id: 'luna-yrigoyen',
    label: 'Luna Market · Yrigoyen',
    why: 'supermercado y tránsito barrial',
    lat: -34.5375559,
    lng: -58.5186835,
    minMinutes: 45,
  },
  {
    id: 'plaza-la-paz',
    label: 'Plaza La Paz',
    why: 'verde, paseadores y vecinos',
    lat: -34.5388166,
    lng: -58.5235635,
    minMinutes: 45,
  },
  {
    id: 'caps-bermudez',
    label: 'CAPS Bermúdez',
    why: 'referencia vecinal con circulación sostenida',
    lat: -34.5392013,
    lng: -58.522956,
    minMinutes: 60,
  },
  {
    id: 'roca-comercios',
    label: 'Roca · corredor comercial/industrial',
    why: 'portones, repartidores, kioscos y trabajadores',
    lat: -34.54297,
    lng: -58.5153,
    minMinutes: 15,
  },
  {
    id: 'puma-oeste',
    label: 'Puma · borde oeste',
    why: 'combustible, atención extendida y tránsito',
    lat: -34.5447706,
    lng: -58.5265441,
    minMinutes: 120,
  },
  {
    id: 'parque-zagala',
    label: 'Parque Zagala',
    why: 'verde y refugios del borde industrial',
    lat: -34.5479718,
    lng: -58.5271062,
    minMinutes: 120,
  },
  {
    id: 'outlet-pet',
    label: 'Outlet Pet Shop',
    why: 'red animalista y clientes con perros',
    lat: -34.5486616,
    lng: -58.5293572,
    minMinutes: 120,
  },
  {
    id: 'plaza-almafuerte',
    label: 'Plaza Almafuerte',
    why: 'paseadores, familias y permanencia',
    lat: -34.5503229,
    lng: -58.5192651,
    minMinutes: 105,
  },
  {
    id: 'caps-ravazzoli',
    label: 'CAPS Ravazzoli',
    why: 'referencia barrial y personal local',
    lat: -34.5509653,
    lng: -58.5182503,
    minMinutes: 105,
  },
  {
    id: 'pet-laprida-oeste',
    label: 'Pet shop · Laprida oeste',
    why: 'contacto directo con dueños de animales',
    lat: -34.5514309,
    lng: -58.5120884,
    minMinutes: 105,
  },
  {
    id: 'maternidad-santa-rosa',
    label: 'Maternidad Santa Rosa + guardia',
    why: 'guardia, personal y circulación prolongada',
    lat: -34.5440457,
    lng: -58.5124267,
    minMinutes: 30,
  },
  {
    id: 'veterinaria-melo',
    label: 'Veterinaria · Melo',
    why: 'si la acercan o preguntan por ella',
    lat: -34.5431321,
    lng: -58.5089563,
    minMinutes: 15,
  },
  {
    id: 'plaza-intendentes',
    label: 'Plaza de los Intendentes',
    why: 'verde, paseadores y cruce de recorridos',
    lat: -34.5530901,
    lng: -58.5060235,
    minMinutes: 60,
  },
  {
    id: 'pet-el-arca',
    label: 'El Arca · pet shop',
    why: 'red de mascotas del lado Martelli',
    lat: -34.5509129,
    lng: -58.510531,
    minMinutes: 45,
  },
  {
    id: 'pet-nuevo-sol',
    label: 'Nuevo Sol · pet shop',
    why: 'clientes y comerciantes atentos a animales',
    lat: -34.5481653,
    lng: -58.5042856,
    minMinutes: 60,
  },
  {
    id: 'plaza-vienni',
    label: 'Plaza León Vienni + destacamento',
    why: 'plaza, policía 24 h y centro de Martelli',
    lat: -34.5463981,
    lng: -58.4995403,
    minMinutes: 45,
  },
  {
    id: 'plaza-americas-padilla',
    label: 'Plaza de las Américas / Padilla',
    why: 'estación, plaza y circulación peatonal',
    lat: -34.5432644,
    lng: -58.5004784,
    minMinutes: 30,
  },
  {
    id: 'shell-mitre',
    label: 'Shell · Mitre 901',
    why: '24 h, cámaras, comida y tránsito',
    lat: -34.5414494,
    lng: -58.5058781,
    minMinutes: 15,
  },
  {
    id: 'vet-roca',
    label: 'Centro Médico Veterinario Roca',
    why: 'veterinaria de referencia sobre Roca',
    lat: -34.5357654,
    lng: -58.5011908,
    minMinutes: 75,
  },
  {
    id: 'coto-san-martin',
    label: 'Coto · San Martín',
    why: 'alto tránsito y cartelera comercial',
    lat: -34.5327908,
    lng: -58.5024296,
    minMinutes: 90,
  },
  {
    id: 'comisaria-florida',
    label: 'Comisaría de Florida',
    why: 'personal 24 h y referencia vecinal',
    lat: -34.5342888,
    lng: -58.5046496,
    minMinutes: 90,
  },
  {
    id: 'puppis-mitre',
    label: 'Puppis · Mitre',
    why: 'alto contacto con dueños de mascotas',
    lat: -34.5327097,
    lng: -58.5112902,
    minMinutes: 75,
  },
  {
    id: 'axion-florida',
    label: 'Axion · Florida Oeste',
    why: 'atención extendida, cámaras y tránsito',
    lat: -34.5348743,
    lng: -58.5094398,
    minMinutes: 75,
  },
] as const

/** Ida casa → Roca × vía (Florida / FO), ruta anterior. */
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

export type PosterStop = {
  id: string
  lat: number
  lng: number
  label: string
  why?: string
}

export type RouteLeg = {
  id: 'outbound' | 'destination' | 'inbound'
  label: string
  color: string
  dashArray?: string
  points: [number, number][] // lat,lng for Leaflet
  posterStops: PosterStop[]
}

export type RouteOptions = {
  plan?: RoutePlanId
  minutes?: number
  skippedIds?: readonly string[]
  origin?: RouteOrigin | null
}

function latLngs(stops: readonly Stop[]): [number, number][] {
  return stops.map((s) => [s.lat, s.lng])
}

function fallbackStopId(stop: Stop, index: number): string {
  const slug = stop.label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `${slug || 'stop'}-${index}`
}

function posters(stops: readonly Stop[], enabled: boolean): PosterStop[] {
  if (!enabled) return []
  return stops
    .filter((_, i) => i > 0 || stops.length <= 2)
    .map((s, i) => ({
      id: s.id ?? fallbackStopId(s, i),
      lat: s.lat,
      lng: s.lng,
      label: s.label,
      why: s.why,
    }))
}

export function normalizeRouteMinutes(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return FIELD_ROUTE_DEFAULT_MINUTES
  const stepped =
    Math.round(parsed / FIELD_ROUTE_STEP_MINUTES) *
    FIELD_ROUTE_STEP_MINUTES
  return Math.max(
    FIELD_ROUTE_MIN_MINUTES,
    Math.min(FIELD_ROUTE_MAX_MINUTES, stepped),
  )
}

export function getRocaViasStops(
  minutes = FIELD_ROUTE_DEFAULT_MINUTES,
  skippedIds: readonly string[] = [],
): FieldRouteStop[] {
  const budget = normalizeRouteMinutes(minutes)
  const skipped = new Set(skippedIds)
  // Keep in sync with poiCatalog KEY — avoid circular import.
  const disabled = readDisabledPoiIds()
  return ROCA_VIAS_STOPS.filter(
    (stop) =>
      stop.minMinutes <= budget &&
      !skipped.has(stop.id) &&
      !disabled.has(stop.id),
  )
}

/** Mirrors `disabledPoiIds` in poiCatalog (same localStorage key). */
function readDisabledPoiIds(): Set<string> {
  const out = new Set<string>()
  try {
    const raw = localStorage.getItem('panza.poi.overrides.v1')
    if (!raw) return out
    const parsed = JSON.parse(raw) as Record<string, { on?: boolean }>
    for (const [id, o] of Object.entries(parsed)) {
      if (o?.on === false) out.add(id)
    }
  } catch {
    /* ignore */
  }
  return out
}

function rotateToNearest(
  stops: readonly FieldRouteStop[],
  origin: RouteOrigin | null | undefined,
): FieldRouteStop[] {
  if (!origin || stops.length < 2) return [...stops]
  let nearest = 0
  let best = Number.POSITIVE_INFINITY
  stops.forEach((stop, index) => {
    const lat = stop.lat - origin.lat
    const lng = (stop.lng - origin.lng) * 0.82
    const distance = lat * lat + lng * lng
    if (distance < best) {
      best = distance
      nearest = index
    }
  })
  return [...stops.slice(nearest), ...stops.slice(0, nearest)]
}

export function getRouteStart(plan: RoutePlanId): RouteOrigin & {
  label: string
} {
  return plan === 'roca-vias' ? ROCA_VIAS_EPICENTER : PANZA_HOME_BASE
}

function buildRocaViasRoute(
  mode: PosterMode,
  options: RouteOptions,
): RouteLeg[] {
  const fieldOrigin = getRocaViasFieldOrigin(options.origin)
  const start = fieldOrigin ?? ROCA_VIAS_EPICENTER
  const selected = getRocaViasStops(
    options.minutes,
    options.skippedIds,
  )
  const stops = rotateToNearest(selected, fieldOrigin)
  const first = stops[0] ?? ROCA_VIAS_EPICENTER
  const last = stops.at(-1) ?? ROCA_VIAS_EPICENTER
  const returnStart = fieldOrigin ?? last
  const posterStops: PosterStop[] = stops.map((stop) => ({
    id: stop.id,
    lat: stop.lat,
    lng: stop.lng,
    label: stop.label,
    why: stop.why,
  }))

  return [
    {
      id: 'outbound',
      label: fieldOrigin ? 'Desde tu ubicación' : 'Inicio en Roca × vías',
      color: '#8a8a8a',
      dashArray: '4 8',
      points: [
        [start.lat, start.lng],
        [first.lat, first.lng],
      ],
      posterStops: mode === 'full' ? [posterStops[0]!].filter(Boolean) : [],
    },
    {
      id: 'destination',
      label: 'Carteles',
      color: '#1a3a2a',
      points: latLngs(stops),
      posterStops,
    },
    {
      id: 'inbound',
      label: 'Cierre al avistamiento',
      color: '#c45c26',
      dashArray: '4 8',
      points: [
        [returnStart.lat, returnStart.lng],
        [ROCA_VIAS_EPICENTER.lat, ROCA_VIAS_EPICENTER.lng],
      ],
      posterStops: [],
    },
  ]
}

/** Construye ida / destino / vuelta según plan, tiempo y decisiones de campo. */
export function buildPosterAwareRoute(
  mode: PosterMode,
  options: RouteOptions = {},
): RouteLeg[] {
  if (options.plan === 'roca-vias') {
    return buildRocaViasRoute(mode, options)
  }

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

export function countRoutePosters(
  mode: PosterMode,
  options: RouteOptions = {},
): number {
  return buildPosterAwareRoute(mode, options).reduce(
    (total, leg) => total + leg.posterStops.length,
    0,
  )
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
