/**
 * CATTS TTS client (home PC Tailscale).
 * Docs: E:\zengatrivi-drive-e\catts\docs\EXTERNAL_TTS.md · PHONE_STACK.md
 */

const DEFAULT_BASE = 'http://100.87.252.18:59200'

export function cattsBaseUrl(): string {
  return (import.meta.env.VITE_CATTS_URL || DEFAULT_BASE).replace(/\/$/, '')
}

function apiKey(): string {
  return import.meta.env.VITE_CATTS_API_KEY || ''
}

function headers(): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  const key = apiKey()
  if (key) h['X-API-Key'] = key
  return h
}

export type CattsLang = 'es' | 'en'

/** GET /health — no key required. */
export async function cattsHealth(): Promise<{ ok: boolean; raw?: string }> {
  try {
    const res = await fetch(`${cattsBaseUrl()}/health`, { signal: AbortSignal.timeout(4000) })
    const raw = await res.text()
    return { ok: res.ok, raw }
  } catch {
    return { ok: false }
  }
}

/** Short live chunk (≤500 chars). Returns wav Blob. */
export async function cattsLive(text: string, lang: CattsLang = 'es'): Promise<Blob> {
  const res = await fetch(`${cattsBaseUrl()}/tts/live`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ text, lang }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`CATTS live ${res.status}: ${detail.slice(0, 120)}`)
  }
  return res.blob()
}

/** Longer reading / field announce. Returns wav Blob. */
export async function cattsSpeak(text: string, lang: CattsLang = 'es'): Promise<Blob> {
  const res = await fetch(`${cattsBaseUrl()}/tts/speak`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ text, lang }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`CATTS speak ${res.status}: ${detail.slice(0, 120)}`)
  }
  return res.blob()
}

/** Play a blob once (field speaker / phone). */
export async function playCattsBlob(blob: Blob): Promise<void> {
  const url = URL.createObjectURL(blob)
  try {
    const audio = new Audio(url)
    await audio.play()
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve()
      audio.onerror = () => reject(new Error('audio play failed'))
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Speak ES and play immediately. */
export async function cattsAnnounce(text: string, lang: CattsLang = 'es'): Promise<void> {
  const blob = text.length <= 500 ? await cattsLive(text, lang) : await cattsSpeak(text, lang)
  await playCattsBlob(blob)
}
