/**
 * Investigation engine — OpenOSINT-style modular tool pipeline.
 * Tools run client-side; hits feed Bandeja as leads.
 */

import { generatePanzaDorks, dorkSearchUrl, type GeneratedDork } from './dorks'
import { extractExifGps, type ExifResult } from './exif'
import { PANZA_WATCH_QUERIES } from './catalog'
import type { GeoPoint } from '@/domain/schemas'

export type OsintToolId =
  | 'dork_scan'
  | 'watch_queries'
  | 'photo_exif'
  | 'corridor_analysis'
  | 'text_extract'

export type OsintHit = {
  id: string
  toolId: OsintToolId
  title: string
  summary: string
  url?: string
  point?: GeoPoint
  priority: 'normal' | 'high'
  capturedAt: string
}

export type OsintInvestigation = {
  id: string
  caseId: string
  query: string
  status: 'running' | 'completed' | 'failed'
  hits: OsintHit[]
  createdAt: string
  completedAt?: string
}

export type CorridorInsight = {
  label: string
  detail: string
  point?: GeoPoint
  priority: 'normal' | 'high'
}

const PHONE_RE = /(?:\+?54\s?)?(?:11|15)\s?\d{4}[\s-]?\d{4}|\d{10,11}/g
const DATE_RE =
  /\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b|\b(\d{4})-(\d{2})-(\d{2})\b/g
const LOC_RE =
  /\b(?:av\.?|avenida|calle|banquina|gral\.?\s*paz|constituyentes|maipú|martelli|olivos|vicente\s*lópez|tecnópolis|sarmiento|florida)\b[^\n.,;]{0,60}/gi

function uid(): string {
  return `osint_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function hit(
  toolId: OsintToolId,
  title: string,
  summary: string,
  extra?: Partial<OsintHit>,
): OsintHit {
  return {
    id: uid(),
    toolId,
    title,
    summary,
    priority: 'normal',
    capturedAt: new Date().toISOString(),
    ...extra,
  }
}

/** Extract phones, dates, locations from raw text */
export function extractIntelFromText(text: string): OsintHit[] {
  const hits: OsintHit[] = []
  const phones = [...new Set(text.match(PHONE_RE) ?? [])]
  const dates = [...new Set(text.match(DATE_RE) ?? [])]
  const locs = [...new Set((text.match(LOC_RE) ?? []).map((l) => l.trim()))]

  if (phones.length) {
    hits.push(
      hit('text_extract', 'Teléfonos detectados', phones.join(' · '), {
        priority: 'high',
      }),
    )
  }
  if (dates.length) {
    hits.push(hit('text_extract', 'Fechas detectadas', dates.join(' · ')))
  }
  if (locs.length) {
    hits.push(
      hit('text_extract', 'Ubicaciones mencionadas', locs.slice(0, 5).join(' · '), {
        priority: 'high',
      }),
    )
  }
  return hits
}

/** Analyze sighting corridor — movement pattern from confirmed points */
export function analyzeCorridor(
  points: Array<{ point: GeoPoint; observedAt: Date; label?: string }>,
): CorridorInsight[] {
  if (points.length === 0) {
    return [
      {
        label: 'Sin datos',
        detail: 'Promové avistajes en Bandeja para activar análisis de corredor.',
        priority: 'normal',
      },
    ]
  }

  const sorted = [...points].sort(
    (a, b) => a.observedAt.getTime() - b.observedAt.getTime(),
  )
  const latest = sorted[sorted.length - 1]
  const insights: CorridorInsight[] = [
    {
      label: 'Último punto conocido',
      detail: latest.label ?? `${latest.point[1].toFixed(4)}, ${latest.point[0].toFixed(4)}`,
      point: latest.point,
      priority: 'high',
    },
  ]

  if (sorted.length >= 2) {
    const prev = sorted[sorted.length - 2]
    const dLng = latest.point[0] - prev.point[0]
    const dLat = latest.point[1] - prev.point[1]
    const bearing =
      dLng === 0 && dLat === 0
        ? 'estacionaria'
        : Math.abs(dLng) > Math.abs(dLat)
          ? dLng > 0
            ? 'este'
            : 'oeste'
          : dLat > 0
            ? 'norte'
            : 'sur'
    insights.push({
      label: 'Vector de movimiento',
      detail: `De ${prev.label ?? 'punto anterior'} hacia el ${bearing}. Priorizá búsqueda en esa dirección + 500 m.`,
      priority: 'high',
    })
  }

  insights.push({
    label: 'Corredor Gral Paz / Constituyentes',
    detail:
      'Historial: Olivos cementerio (15/7) → Gral Paz banquina (23/7) → Constituyentes×Maipú (26/7). Seguir arterias principales.',
    priority: 'high',
  })

  insights.push({
    label: 'Zonas de escondite',
    detail:
      'Tecnópolis estacionamientos, Parque Laprida, cuenco Medrano, colectora Gral Paz, vías Padilla, depósitos Constituyentes.',
    priority: 'normal',
  })

  return insights
}

export type RunInvestigationInput = {
  caseId: string
  query?: string
  photo?: File
  rawText?: string
  sightingPoints?: Array<{ point: GeoPoint; observedAt: Date; label?: string }>
}

/** Full investigation pass — chains tools like OpenOSINT agent */
export async function runInvestigation(
  input: RunInvestigationInput,
): Promise<OsintInvestigation> {
  const inv: OsintInvestigation = {
    id: uid(),
    caseId: input.caseId,
    query: input.query ?? 'panza_auto',
    status: 'running',
    hits: [],
    createdAt: new Date().toISOString(),
  }

  try {
    // 1. Dork recon
    const dorks = generatePanzaDorks()
    for (const d of dorks) {
      inv.hits.push(dorkToHit(d))
    }

    // 2. Watch queries
    for (const wq of PANZA_WATCH_QUERIES) {
      inv.hits.push(
        hit('watch_queries', `Vigilar: "${wq}"`, 'Abrir búsqueda y revisar últimas 24 h', {
          url: dorkSearchUrl(`"${wq}" after:2026-07-15`),
        }),
      )
    }

    // 3. Photo EXIF
    if (input.photo) {
      const exif = await extractExifGps(input.photo)
      inv.hits.push(...exifToHits(exif))
    }

    // 4. Text extraction
    if (input.rawText?.trim()) {
      inv.hits.push(...extractIntelFromText(input.rawText))
    }

    // 5. Corridor analysis
    if (input.sightingPoints?.length) {
      const corridor = analyzeCorridor(input.sightingPoints)
      for (const c of corridor) {
        inv.hits.push(
          hit('corridor_analysis', c.label, c.detail, {
            point: c.point,
            priority: c.priority,
          }),
        )
      }
    }

    inv.status = 'completed'
    inv.completedAt = new Date().toISOString()
  } catch {
    inv.status = 'failed'
  }

  return inv
}

function dorkToHit(d: GeneratedDork): OsintHit {
  return hit('dork_scan', d.label, d.rationale, {
    url: dorkSearchUrl(d.query),
    priority: d.target === 'facebook' ? 'high' : 'normal',
  })
}

function exifToHits(exif: ExifResult): OsintHit[] {
  const hits: OsintHit[] = []
  if (exif.hasGps && exif.lat !== undefined && exif.lng !== undefined) {
    hits.push(
      hit(
        'photo_exif',
        'GPS en foto',
        `${exif.lat.toFixed(5)}, ${exif.lng.toFixed(5)}${exif.takenAt ? ` · ${exif.takenAt.toLocaleString('es-AR')}` : ''}`,
        {
          point: [exif.lng, exif.lat],
          priority: 'high',
          url: `https://www.google.com/maps/search/?api=1&query=${exif.lat},${exif.lng}`,
        },
      ),
    )
  } else {
    hits.push(
      hit('photo_exif', 'Sin GPS en foto', exif.warnings.join(' · ') || 'Usar Google Lens / TinEye', {
        priority: 'normal',
        url: 'https://lens.google.com',
      }),
    )
  }
  return hits
}

const STORAGE_KEY = 'panza.osint.investigations'

export function loadInvestigations(): OsintInvestigation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as OsintInvestigation[]) : []
  } catch {
    return []
  }
}

export function saveInvestigation(inv: OsintInvestigation): void {
  const all = loadInvestigations()
  all.unshift(inv)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 20)))
}
