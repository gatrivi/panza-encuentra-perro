/**
 * Zona operativa activa — hardcode app (no API / no DB por ahora).
 * Una sola zona: Norte CABA + Vicente López / Olivos.
 */

export type FieldBounds = {
  south: number
  west: number
  north: number
  east: number
}

/** Búsqueda activa Panza · v0.2.9 */
export const ACTIVE_FIELD_ZONE = {
  id: 'zona-norte',
  label: 'Zona Norte',
  barrios: [
    'Núñez',
    'Saavedra',
    'Olivos',
    'La Lucila',
    'Florida',
    'Florida Oeste',
    'Villa Martelli',
    'Vicente López',
    'Munro',
  ],
  /** Bbox aprox. Núñez río → oeste Martelli · norte Olivos → sur Constituyentes */
  bounds: {
    south: -34.575,
    west: -58.545,
    north: -34.49,
    east: -58.44,
  } satisfies FieldBounds,
} as const

export type ActiveFieldZone = typeof ACTIVE_FIELD_ZONE

export function inActiveFieldZone(lat: number, lng: number): boolean {
  const { south, west, north, east } = ACTIVE_FIELD_ZONE.bounds
  return lat >= south && lat <= north && lng >= west && lng <= east
}
