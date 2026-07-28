/**
 * Decaimiento visual de leads/avistajes (Sonnet direction).
 * No borra: baja opacidad/color según edad del observado.
 * Umbrales de partida — ajustar según ritmo de búsqueda.
 */

export type DecayStyle = {
  opacity: number
  color: string
}

const MIN = 60_000
const H = 60 * MIN

/** Usa timestamp observado (no el de ingreso). */
export function calcLeadDecay(
  observedAt: Date | number,
  now = Date.now(),
): DecayStyle {
  const t = typeof observedAt === 'number' ? observedAt : observedAt.getTime()
  const age = now - t

  if (age < 30 * MIN) return { opacity: 1, color: '#e63946' }
  if (age < 2 * H) return { opacity: 0.8, color: '#f4a261' }
  if (age < 6 * H) return { opacity: 0.55, color: '#e9c46a' }
  if (age < 24 * H) return { opacity: 0.35, color: '#8d99ae' }
  return { opacity: 0.2, color: '#8d99ae' }
}

/** Tips sin verificar: visibles pero opacity capped (no mueve zona oficial). */
export function calcTipDecay(
  observedAt: Date | number | undefined,
  now = Date.now(),
): DecayStyle {
  const base = calcLeadDecay(observedAt ?? now, now)
  return {
    opacity: Math.min(base.opacity, 0.55),
    color: base.color,
  }
}
