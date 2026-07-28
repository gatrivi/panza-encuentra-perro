/**
 * Puesta de sol aproximada (campo). Lat/lng default = Gral Paz / Panza.
 * No es efemérides precisas — ±5–10 min OK para “cuánto luz queda”.
 */

const DEG = Math.PI / 180

export type SunTimes = {
  sunset: Date
  sunrise: Date
  minutesLeft: number
  afterSunset: boolean
}

/** NOAA-ish: sunset/sunrise local for a civil day. */
export function sunTimes(
  now = new Date(),
  lat = -34.551,
  lng = -58.508,
): SunTimes {
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()
  // day of year
  const n =
    Math.floor(
      (Date.UTC(y, m, d) - Date.UTC(y, 0, 0)) / 86_400_000,
    )
  const decl =
    0.4095 * Math.sin(((2 * Math.PI) / 365) * (n - 81))
  const latR = lat * DEG
  const cosHa =
    (-Math.sin(-0.833 * DEG) - Math.sin(latR) * Math.sin(decl)) /
    (Math.cos(latR) * Math.cos(decl))
  const ha = Math.acos(Math.min(1, Math.max(-1, cosHa))) // radians
  const hours = (ha / DEG) / 15
  // solar noon UTC ≈ 12 - lng/15
  const noonUtc = 12 - lng / 15
  const riseUtc = noonUtc - hours
  const setUtc = noonUtc + hours

  const sunrise = utcHoursToLocal(y, m, d, riseUtc)
  const sunset = utcHoursToLocal(y, m, d, setUtc)
  const minutesLeft = Math.round((sunset.getTime() - now.getTime()) / 60_000)
  return {
    sunrise,
    sunset,
    minutesLeft,
    afterSunset: minutesLeft < 0,
  }
}

function utcHoursToLocal(
  y: number,
  m: number,
  d: number,
  utcHours: number,
): Date {
  const h = Math.floor(utcHours)
  const min = Math.round((utcHours - h) * 60)
  return new Date(Date.UTC(y, m, d, h, min, 0))
}

export function formatHm(date: Date): string {
  return date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatTimeLeft(minutesLeft: number): string {
  if (minutesLeft < 0) {
    const ago = Math.abs(minutesLeft)
    const h = Math.floor(ago / 60)
    const m = ago % 60
    return h > 0 ? `anocheció hace ${h}h ${m}m` : `anocheció hace ${m}m`
  }
  const h = Math.floor(minutesLeft / 60)
  const m = minutesLeft % 60
  if (h <= 0) return `${m} min de luz`
  return `${h}h ${m}m de luz`
}
