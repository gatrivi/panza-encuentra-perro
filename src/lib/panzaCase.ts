/** Shared Panza case payload — client bootstrap + seed. */

import {
  ROCA_VIAS_EPICENTER,
  ROCA_VIAS_STOPS,
} from '@/lib/posterRoutes'

export {
  ACTIVE_FIELD_ZONE,
  inActiveFieldZone,
} from '@/lib/fieldZone'

export const PANZA_CASE_ID = 'case_panza'
export const PANZA_SLUG = 'pancita'

export const PANZA_PHOTOS = [
  '/panza/pnan2.jpg',
  '/panza/panrec.png',
  '/panza/panz.jpg',
] as const

export const PANZA_ANIMAL = {
  name: 'Panza',
  aliases: ['Pancita', 'Panchi', 'Pancite'],
  species: 'dog' as const,
  breed: 'Caniche / cruza',
  color: 'Negro / gris',
  sex: 'female' as const,
  size: 'mediana/pequeña',
  distinguishingMarks:
    'Pelaje negro rizado, cola larga, collar violeta con chapita de cerámica (dice PANZA) y 2 teléfonos. Mimosa, miedosa y rápida. 4 años, castrada.',
  photos: [...PANZA_PHOTOS],
}

export const PANZA_CONTACT = {
  displayPhone: '1156194761',
  whatsapp: '5491156194761',
  secondaryPhone: '1130400210',
}

export const PANZA_INSTRUCTIONS =
  'No la persigas ni la agarres. Solo la familia (Pau / Rodri / Gastón) puede retenerla. Seguíla a distancia, avisá YA. Collar violeta + chapita PANZA. Último foco fuerte: 23/7 banquina Gral Paz → Villa Martelli (Parque Sarmiento). También Florida / Vicente López.'

/** Banquina Gral Paz, Parque Sarmiento / mano Villa Martelli (GeoJSON lng,lat) */
export const PANZA_MAP_CENTER: [number, number] = [-58.508, -34.551]

/** Salida patrulla: Fray Justo Sarmiento × Pelliza (Olivos) */
export { PANZA_HOME_BASE } from '@/lib/posterRoutes'

export const PANZA_SOURCES = {
  facebook: 'https://www.facebook.com/share/p/1BgkXzFdgY/',
  facebookPrev: 'https://www.facebook.com/share/p/1JsbccK79Q/',
  facebookZaguates: 'https://www.facebook.com/groups/1449678978426788/permalink/28023231790644812/',
  facebookOwner: 'https://www.facebook.com/pau.trivi',
  instagram: 'https://www.instagram.com/buscamos.a.panza/',
} as const

/** Dueña + tags FB (Brave OSINT 27/7/2026) */
export const PANZA_TEAM = {
  owner: {
    name: 'Pau Trivi (Poli)',
    username: 'paula',
    fb: PANZA_SOURCES.facebookOwner,
    livesIn: 'Olivos, Buenos Aires',
    contactHandles: ['paupocket'],
  },
  secondary: [
    { name: 'Rodrii Perez Schmidt', username: 'rodrigo', role: 'coordinator' },
    { name: 'G Alejandro Trivi', username: 'gaston', role: 'coordinator' },
  ],
} as const

/**
 * Timeline OSINT desde posts centrales de Pau (+ difusión grupos).
 * No scraper: captura manual vía sesión Brave 27/7/2026.
 */
export const PANZA_OSINT_LEADS = [
  {
    idKey: 'fb_escape_olivos_2026_07_15',
    origin: 'facebook' as const,
    sourceUrl: PANZA_SOURCES.facebookOwner,
    observedLocal: '2026-07-15T21:00:00-03:00',
    point: [-58.5085, -34.507] as [number, number],
    locationText: 'Olivos, zona cementerio (escape al final del partido)',
    priority: 'high' as const,
    status: 'needs_details' as const,
    rawText: `Pau Trivi (central): BUSCAMOS A PANZA.
Se escapó de casa el 15/7 al final del partido por Olivos, zona cementerio.
Hembra, castrada, 4 años, mimosa, miedosa y rápida. Collar violeta + chapita cerámica con 2 teléfonos.
Contacto: paupocket / Rodrii Perez Schmidt / números del flyer.
Tags: Rodrii Perez Schmidt + G Alejandro Trivi.
Fuente: ${PANZA_SOURCES.facebookOwner}`,
    locations: ['Olivos', 'cementerio'],
    keywords: ['escape', 'partido', 'collar violeta'],
  },
  {
    idKey: 'fb_vicentelopez_sanmartin',
    origin: 'facebook' as const,
    sourceUrl: PANZA_SOURCES.facebookOwner,
    observedLocal: '2026-07-18T12:00:00-03:00',
    point: [-58.492, -34.532] as [number, number],
    locationText: 'Vicente López (corría); posible San Martín',
    priority: 'high' as const,
    status: 'needs_details' as const,
    rawText: `Pau Trivi: se la vio corriendo por Vicente López y tal vez por San Martín.
Collar violeta, chapita grande, cola larga. Avisar aunque no se pueda retener.
Tags: Rodrii Perez Schmidt. Fuente: ${PANZA_SOURCES.facebookOwner}`,
    locations: ['Vicente López', 'San Martín'],
    keywords: ['corriendo', 'chapita', 'cola larga'],
  },
  {
    idKey: 'fb_carteles_norte',
    origin: 'facebook' as const,
    sourceUrl: PANZA_SOURCES.facebookOwner,
    observedLocal: '2026-07-19T12:00:00-03:00',
    point: [-58.49, -34.52] as [number, number],
    locationText: 'Carteles: Olivos, Florida, La Lucila, Martínez, Munro',
    priority: 'normal' as const,
    status: 'needs_details' as const,
    rawText: `Pau + tío en bici pegando carteles. Hashtags: #olivos #florida #lalucila #matinez #munro.
Fuente: ${PANZA_SOURCES.facebookOwner}`,
    locations: ['Olivos', 'Florida', 'La Lucila', 'Martínez', 'Munro'],
    keywords: ['carteles', 'bici'],
  },
  {
    idKey: 'fb_martelli_florida',
    origin: 'facebook' as const,
    sourceUrl: PANZA_SOURCES.facebookOwner,
    observedLocal: '2026-07-22T18:00:00-03:00',
    point: [-58.51, -34.545] as [number, number],
    locationText: 'Villa Martelli y Florida — corriendo, asustada, no se deja agarrar',
    priority: 'high' as const,
    status: 'promoted' as const,
    rawText: `Pau Trivi: dato de que corre por la calle asustada y no se deja agarrar.
Ayer la vieron por Villa Martelli y por Florida. Pedir ojos para reubicar zona.
Tags: Rodrii + G Alejandro. Fuente: ${PANZA_SOURCES.facebookOwner}`,
    locations: ['Villa Martelli', 'Florida'],
    keywords: ['asustada', 'no se deja'],
  },
  {
    idKey: 'fb_sin_novedades_post_domingo',
    origin: 'facebook' as const,
    sourceUrl: PANZA_SOURCES.facebookZaguates,
    observedLocal: '2026-07-21T12:00:00-03:00',
    point: [-58.5, -34.53] as [number, number],
    locationText: 'Vicente López ampliado — sin novedades desde domingo; posible retención',
    priority: 'normal' as const,
    status: 'needs_details' as const,
    rawText: `Pau (ZAGUATES DIFUNDE): desde el domingo sin novedades.
Puede haberse alejado mucho O retenida. Info anónima OK. Ofrecen recompensa.
Tags: Rodrii + G Alejandro. Fuente: ${PANZA_SOURCES.facebookZaguates}`,
    locations: ['Vicente López'],
    keywords: ['recompensa', 'retenida', 'sin novedades'],
  },
] as const

/** 23/7 noche — Eva Buscando Huellas / Perros PERDIDOS ZONA NORTE */
export const PANZA_LATEST_SIGHTING = {
  idKey: 'fb_gralpaz_2026_07_23',
  sourceUrl: PANZA_SOURCES.facebook,
  observedLocal: '2026-07-23T21:00:00-03:00',
  point: [-58.508, -34.551] as [number, number],
  direction: 'NW' as const,
  confidence: 'probable' as const,
  locationText:
    'Banquina Av. Gral Paz cerca Parque Sarmiento, mano Villa Martelli (Pista Miguel Sánchez / Plazoleta El Ombú)',
  mapPhoto: '/panza/avistaje-gralpaz-2026-07-23.png',
  rawText: `URGENTE 23/7 — la vieron caminando por la banquina cerca de Parque Sarmiento yendo para Villa Martelli.
Cansada y desorientada. No se deja agarrar, está asustada y corre. Tiene chapita identificatoria.
NO AGARRARLA: seguirla a distancia y llamar a la familia. Solo los dueños pueden retenerla.
Contactos flyer: ${PANZA_CONTACT.displayPhone} / ${PANZA_CONTACT.secondaryPhone}.
Grupos: Perros PERDIDOS ZONA NORTE · Eva Buscando Huellas (Martelli y Florida, Vicente López).
Fuente: ${PANZA_SOURCES.facebook}`,
} as const

/** Mañana 24/7 — focos a pie (amanecer / atardecer) */
export const PANZA_SEARCH_PLAN_TOMORROW = [
  {
    title: 'Banquina Gral Paz → Villa Martelli',
    detail:
      'Tramo Parque Sarmiento / Pista Miguel Sánchez. Ambos lados. Ella va cansada por la banquina.',
  },
  {
    title: 'Verde: Plazoleta El Ombú + borde Parque Sarmiento',
    detail: 'Perros asustados se meten en pastizal / sombra. No empujar hacia la autopista.',
  },
  {
    title: 'Villa Martelli (lado provincia)',
    detail: 'Zufriategui y calles perpendiculares (Perú, Chile, Venezuela) pegadas a Gral Paz.',
  },
  {
    title: 'Shell / YPF de esa banquina',
    detail: 'Olfato a comida. Si la ven: no rodear — un solo contacto a distancia + llamada.',
  },
] as const

/**
 * Dos mitades. No entrar a calzada Gral Paz.
 * Coords Maps = lat,lng
 */
export const PANZA_BIKE_LOOP_MARTELLI = [
  { label: 'Inicio · acceso Parque Sarmiento / Gral Paz', lat: -34.5508, lng: -58.5055 },
  { label: 'Borde parque · pista / Plazoleta El Ombú', lat: -34.5492, lng: -58.5068 },
  { label: 'Pin avistaje 23/7 (mirar banquina)', lat: -34.551, lng: -58.508 },
  { label: 'Zufriategui (Martelli) Norte', lat: -34.5528, lng: -58.5128 },
  { label: 'Zufriategui × Chile / Perú', lat: -34.5552, lng: -58.5142 },
  { label: 'Zona Shell (desde paralelo)', lat: -34.5578, lng: -58.5162 },
  { label: 'Cierre · Plaza Intendentes', lat: -34.5538, lng: -58.5158 },
] as const

/** Mitad CABA: Parque Sarmiento, bordes, accesos (sin cruzar a calzada) */
export const PANZA_BIKE_LOOP_SARMIENTO = [
  { label: 'Inicio · acceso peatonal Gral Paz / El Ombú', lat: -34.5505, lng: -58.505 },
  { label: 'Pista Miguel Sánchez · borde oeste', lat: -34.5518, lng: -58.5025 },
  { label: 'Norte parque · hacia Lugones', lat: -34.5472, lng: -58.5005 },
  { label: 'Miller / borde NE (mirá Dot)', lat: -34.544, lng: -58.498 },
  { label: 'Entrada Balbín 4750', lat: -34.5548, lng: -58.4968 },
  { label: 'Sur parque · juegos / tenis', lat: -34.5568, lng: -58.5005 },
  { label: 'Borde Gral Paz sur (banquina CABA)', lat: -34.5535, lng: -58.5055 },
  { label: 'Cierre · acceso peatonal El Ombú', lat: -34.5508, lng: -58.5048 },
] as const

/** @deprecated alias — loop corto original */
export const PANZA_BIKE_LOOP = PANZA_BIKE_LOOP_MARTELLI

function mapsLatLng(p: { lat: number; lng: number }) {
  return `${p.lat},${p.lng}`
}

function gmapsBikeUrl(
  loop: ReadonlyArray<{ lat: number; lng: number }>,
): string {
  const origin = loop[0]
  const dest = loop[loop.length - 1]
  const waypoints = loop
    .slice(1, -1)
    .map(mapsLatLng)
    .join('|')
  return (
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${mapsLatLng(origin)}` +
    `&destination=${mapsLatLng(dest)}` +
    `&waypoints=${waypoints}` +
    `&travelmode=bicycling`
  )
}

function wazeUrl(p: { lat: number; lng: number }) {
  return `https://waze.com/ul?ll=${mapsLatLng(p)}&navigate=yes&zoom=17`
}

/** Google Maps · Martelli (oeste Gral Paz) */
export const PANZA_GMAPS_BIKE_URL = gmapsBikeUrl(PANZA_BIKE_LOOP_MARTELLI)

/** Google Maps · Parque Sarmiento (este / CABA) */
export const PANZA_GMAPS_BIKE_SARMIENTO_URL = gmapsBikeUrl(PANZA_BIKE_LOOP_SARMIENTO)

export const PANZA_WAZE_START_URL = wazeUrl(PANZA_BIKE_LOOP_MARTELLI[0])
export const PANZA_WAZE_SARMIENTO_URL = wazeUrl(PANZA_BIKE_LOOP_SARMIENTO[0])

/** Waze desde casa (Fray Justo × Pelliza) → foco Martelli */
export const PANZA_WAZE_HOME_URL = wazeUrl({
  lat: -34.5154,
  lng: -58.5077,
})

/** Maps ida completa: casa → Martelli loop (waypoints) */
export const PANZA_GMAPS_FROM_HOME_URL =
  `https://www.google.com/maps/dir/?api=1` +
  `&origin=-34.5154,-58.5077` +
  `&destination=-34.551,-58.508` +
  `&waypoints=-34.532,-58.492|-34.545,-58.505` +
  `&travelmode=bicycling`

/** Solo el pin del avistaje (Waze / Maps) */
export const PANZA_WAZE_SIGHTING_URL =
  `https://waze.com/ul?ll=${PANZA_LATEST_SIGHTING.point[1]},${PANZA_LATEST_SIGHTING.point[0]}&navigate=yes&zoom=18`

export const PANZA_GMAPS_SIGHTING_URL =
  `https://www.google.com/maps/search/?api=1&query=${PANZA_LATEST_SIGHTING.point[1]},${PANZA_LATEST_SIGHTING.point[0]}`

export const PANZA_FB_LEAD_TEXT = PANZA_LATEST_SIGHTING.rawText

export const PANZA_IG_LEAD_TEXT = `Cuenta de difusión Instagram @buscamos.a.panza
Dueña: Pau Trivi (paupocket). Equipo: Rodrii Perez Schmidt + G Alejandro Trivi.
BUSCAMOS A PANZA. Se escapó el 15/7 al final del partido por Olivos, zona cementerio.
Hembra, 4 años, collar violeta con chapita. Último foco: Gral Paz / Parque Sarmiento → Villa Martelli (23/7); también Florida.
Fuente: ${PANZA_SOURCES.instagram}`

/** Carteles · Constituyentes × Maipú · ~2 h · bici/auto */
export type SignStop = {
  n: number
  label: string
  why: string
  lat: number
  lng: number
}

export const PANZA_SIGN_EPICENTER = {
  lat: -34.5633,
  lng: -58.5152,
  label: 'Constituyentes × Maipú',
} as const

/** 30 paradas en orden. Ver public/panza/RECORRIDO-CONSTITUYENTES.md */
export const PANZA_SIGN_ROUTE: readonly SignStop[] = [
  { n: 1, label: 'Constituyentes × Maipú', why: 'último avistaje (epicentro)', lat: -34.5633, lng: -58.5152 },
  { n: 2, label: 'Shell Constituyentes 1806', why: 'nafta 24 h, olores, gente', lat: -34.5643, lng: -58.5145 },
  { n: 3, label: 'Petrobras Illia 1101', why: 'nafta/GNC, cerca del epicentro', lat: -34.5658, lng: -58.5134 },
  { n: 4, label: 'Estacionamiento Tecnópolis Const 1908', why: 'playa grande, refugio', lat: -34.5632, lng: -58.5153 },
  { n: 5, label: 'Ingreso peatonal Tecnópolis Const 2220', why: 'alto tránsito, perímetro', lat: -34.5592, lng: -58.5118 },
  { n: 6, label: 'Gral Paz × Constituyentes', why: 'colectivos, borde sur', lat: -34.5585, lng: -58.5125 },
  { n: 7, label: 'Cuenco aliviador / ex cuartel', why: 'vegetación, agua, escondite', lat: -34.557, lng: -58.5105 },
  { n: 8, label: 'Ex autocine / lote abierto sur Tecno', why: 'terreno bajo, matorral', lat: -34.5565, lng: -58.5095 },
  { n: 9, label: 'Zufriategui × Constituyentes', why: 'corredor sur Villa Martelli', lat: -34.5555, lng: -58.5088 },
  { n: 10, label: 'J. B. de la Salle 4491', why: 'entrada sur Tecno, peatonal', lat: -34.5496, lng: -58.5007 },
  { n: 11, label: 'J. B. de la Salle 4601', why: 'estacionamiento sur', lat: -34.5488, lng: -58.5 },
  { n: 12, label: 'Shell Gral Paz 3802', why: 'nafta 24 h, colectora', lat: -34.5499, lng: -58.5013 },
  { n: 13, label: 'Colectora Gral Paz (Tecno–Padilla)', why: 'banquina, perros de tránsito', lat: -34.551, lng: -58.5035 },
  { n: 14, label: 'Estación Padilla', why: 'vías, refugio bajo rampas', lat: -34.5434, lng: -58.5006 },
  { n: 15, label: 'Av. Mitre × Laprida', why: 'borde industrial este', lat: -34.5458, lng: -58.4995 },
  { n: 16, label: 'Super Luna Güemes 4907', why: 'super, olores de comida', lat: -34.549, lng: -58.5197 },
  { n: 17, label: 'Parque Laprida (Laprida 4731)', why: 'galpones, playa estacionamiento', lat: -34.5532, lng: -58.5158 },
  { n: 18, label: 'DIA Laprida 4076', why: 'super, tránsito vecinal', lat: -34.5545, lng: -58.5165 },
  { n: 19, label: 'La Barata Constituyentes 135', why: 'super, corredor este', lat: -34.5569, lng: -58.5197 },
  { n: 20, label: 'Bomberos Villa Martelli Const 100', why: 'referencia, gente local', lat: -34.558, lng: -58.5188 },
  { n: 21, label: 'Constituyentes 2500 (depósitos)', why: 'naves, portones, escondites', lat: -34.5595, lng: -58.5195 },
  { n: 22, label: 'SM Ahorro Constituyentes 2632', why: 'super Villa Maipú', lat: -34.556, lng: -58.521 },
  { n: 23, label: 'MAS Supermercado Illia 2141', why: 'super, oeste', lat: -34.5704, lng: -58.5214 },
  { n: 24, label: 'Shell Illia 2114', why: 'nafta', lat: -34.5706, lng: -58.521 },
  { n: 25, label: 'El Puente Estrada 2768', why: 'super, zona oeste', lat: -34.5715, lng: -58.522 },
  { n: 26, label: 'Constituyentes 5380 (oeste)', why: 'borde industrial GSM', lat: -34.5666, lng: -58.5123 },
  { n: 27, label: 'Clínica Veterinaria Chile 328', why: 'avisar por si la traen', lat: -34.552, lng: -58.514 },
  { n: 28, label: 'Av. Maipú norte del cruce', why: 'corredor norte, comercios', lat: -34.5585, lng: -58.5155 },
  { n: 29, label: 'Av. Maipú sur del cruce', why: 'retorno al epicentro', lat: -34.5665, lng: -58.5148 },
  { n: 30, label: 'Constituyentes × Maipú (cierre)', why: 'segundo cartel cara opuesta', lat: -34.5633, lng: -58.5152 },
] as const

/** Si solo hay ~45 min */
export const PANZA_SIGN_QUICK45 = [1, 4, 5, 6, 7, 12, 17, 2, 22, 23] as const

export const PANZA_WAZE_SIGN_START_URL = wazeUrl(PANZA_SIGN_EPICENTER)

/**
 * Mañana 29–30/7 · Calle Roca × vía Belgrano Norte (Florida / Florida Oeste / Martelli).
 * Prioridad: tránsito peatonal, estación, Mitre, supers/naftas, permanencia en andenes.
 * Cloud itinerary puede reemplazar coords — merge encima de esto.
 * Ver public/panza/RECORRIDO-ROCA-VIA.md
 */
export const PANZA_ROCA_VIA_EPICENTER = {
  lat: ROCA_VIAS_EPICENTER.lat,
  lng: ROCA_VIAS_EPICENTER.lng,
  label: ROCA_VIAS_EPICENTER.label,
} as const

const PANZA_ROCA_VIA_60_STOPS = ROCA_VIAS_STOPS.filter(
  (stop) => stop.minMinutes <= 60,
)

export const PANZA_ROCA_VIA_ROUTE: readonly SignStop[] = [
  {
    n: 1,
    label: ROCA_VIAS_EPICENTER.label,
    why: ROCA_VIAS_EPICENTER.why,
    lat: ROCA_VIAS_EPICENTER.lat,
    lng: ROCA_VIAS_EPICENTER.lng,
  },
  ...PANZA_ROCA_VIA_60_STOPS.map((stop, index) => ({
    n: index + 2,
    label: stop.label,
    why: stop.why,
    lat: stop.lat,
    lng: stop.lng,
  })),
  {
    n: PANZA_ROCA_VIA_60_STOPS.length + 2,
    label: `${ROCA_VIAS_EPICENTER.label} · cierre`,
    why: 'cerrar el circuito en el último avistamiento',
    lat: ROCA_VIAS_EPICENTER.lat,
    lng: ROCA_VIAS_EPICENTER.lng,
  },
]

export const PANZA_ROCA_VIA_QUICK: readonly number[] = [
  1,
  ...PANZA_ROCA_VIA_60_STOPS.flatMap((stop, index) =>
    stop.minMinutes <= 45 ? [index + 2] : [],
  ),
  PANZA_ROCA_VIA_60_STOPS.length + 2,
]

/** Campaña activa del día — Plan / mapa usan esto. */
export type SignCampaignId = 'constituyentes' | 'roca_via'

export const SIGN_CAMPAIGN_DEFAULT: SignCampaignId = 'roca_via'

export function signRouteForCampaign(id: SignCampaignId): readonly SignStop[] {
  return id === 'roca_via' ? PANZA_ROCA_VIA_ROUTE : PANZA_SIGN_ROUTE
}

export function signQuickForCampaign(id: SignCampaignId): readonly number[] {
  return id === 'roca_via' ? PANZA_ROCA_VIA_QUICK : PANZA_SIGN_QUICK45
}

export const PANZA_WAZE_ROCA_VIA_URL = wazeUrl(PANZA_ROCA_VIA_EPICENTER)
