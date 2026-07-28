/**
 * Frases de navegación básicas + fallback offline (Web Speech)
 * cuando CatTS cae. Pocas a propósito — campo, no GPS completo.
 */

export const VOICE_NAV = {
  left: 'Girá a la izquierda',
  right: 'Girá a la derecha',
  straight: 'Seguí derecho',
  stop: 'Pará acá',
  arrive: 'Llegaste al punto',
  uTurn: 'Dá la vuelta',
  caution: 'Cuidado, zona de riesgo',
  gpsLost: 'Sin señal de GPS',
  continue: 'Seguí el recorrido',
  searching: 'Te estoy buscando',
  riskOn: 'Modo riesgo. Vas a marcar zonas a evitar',
  riskOff: 'Modo riesgo apagado',
  posterAsk: '¿Colocaste un cartel?',
} as const

export type VoiceNavKey = keyof typeof VOICE_NAV

export function voiceMeters(
  meters: number,
  turn: 'left' | 'right' | 'straight',
): string {
  const m = Math.max(10, Math.round(meters / 10) * 10)
  const dir =
    turn === 'left' ? 'izquierda' : turn === 'right' ? 'derecha' : 'recto'
  if (turn === 'straight') return `En ${m} metros, seguí derecho`
  return `En ${m} metros, girá a la ${dir}`
}

/** Offline TTS — Chrome/Android SpeechSynthesis. */
export function speakOffline(text: string, lang = 'es-AR'): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      reject(new Error('Sin speechSynthesis'))
      return
    }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    u.rate = 1.05
    u.onend = () => resolve()
    u.onerror = () => reject(new Error('speechSynthesis error'))
    window.speechSynthesis.speak(u)
  })
}

export type AnnounceVia = 'catts' | 'offline'

/** Intenta CatTS; si cae, habla offline. */
export async function announceNav(
  text: string,
  lang: 'es' | 'en' = 'es',
): Promise<AnnounceVia> {
  try {
    const { cattsAnnounce } = await import('./catts')
    await cattsAnnounce(text, lang)
    return 'catts'
  } catch {
    await speakOffline(text, lang === 'es' ? 'es-AR' : 'en-US')
    return 'offline'
  }
}

export function announceKey(key: VoiceNavKey): Promise<AnnounceVia> {
  return announceNav(VOICE_NAV[key])
}
