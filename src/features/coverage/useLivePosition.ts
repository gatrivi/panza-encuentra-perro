import { useEffect, useState } from 'react'

export type LivePos = {
  lat: number
  lng: number
  accuracy: number
  heading: number | null
}

/** Watch GPS; silent if denied. ponytail: no fallback geocode. */
export function useLivePosition(enabled: boolean) {
  const [pos, setPos] = useState<LivePos | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    if (!navigator.geolocation) {
      setError('Sin GPS en este dispositivo')
      return
    }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setPos({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy,
          heading: Number.isFinite(p.coords.heading) ? p.coords.heading : null,
        })
        setError(null)
      },
      (e) => setError(e.message || 'No se pudo ubicar'),
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 15000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [enabled])

  return { pos, error }
}
