/**
 * Meta campaña carteles — 1 viaje/día hasta cerrar la red.
 * Detalle: SIGNS_CAMPAIGN.md
 */

export const SIGNS_CAMPAIGN = {
  /** Meta blanda de carteles activos en la red casa→Martelli */
  targetActiveSigns: 24,
  tripsPerDay: 1,
  homeLabel: 'Fray Justo Sarmiento × Pelliza',
  /** Día 0 campaña (ISO date local AR) */
  startDate: '2026-07-28',
  /** Días planificados hasta cobertura completa (ajustable) */
  plannedDays: 7,
} as const

export function signsProgress(activeCount: number) {
  const target = SIGNS_CAMPAIGN.targetActiveSigns
  const pct = Math.min(100, Math.round((activeCount / target) * 100))
  return { active: activeCount, target, pct, done: activeCount >= target }
}

/** Día de campaña 0-based desde startDate (local). */
export function campaignDayIndex(now = new Date()): number {
  const [y, m, d] = SIGNS_CAMPAIGN.startDate.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86_400_000))
}
