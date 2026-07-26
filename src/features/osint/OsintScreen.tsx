import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/cases/useAuth'
import { subscribeSightings } from '@/lib/firebase/repos'
import { PANZA_ANIMAL, PANZA_SOURCES } from '@/lib/panzaCase'
import {
  OSINT_CORE_REPOS,
  OSINT_TOOLS,
  toolsByCategory,
  type OsintCategory,
} from '@/lib/osint/catalog'
import { generatePanzaDorks, dorkSearchUrl } from '@/lib/osint/dorks'
import {
  runInvestigation,
  loadInvestigations,
  saveInvestigation,
  analyzeCorridor,
  type OsintInvestigation,
  type OsintHit,
} from '@/lib/osint/engine'
import { extractExifGps } from '@/lib/osint/exif'
import { t } from '@/i18n/es-AR'
import type { Sighting } from '@/domain/schemas'

const CATEGORIES: { id: OsintCategory; label: string }[] = [
  { id: 'search', label: 'Búsqueda' },
  { id: 'geospatial', label: 'Geo' },
  { id: 'image', label: 'Imagen' },
  { id: 'social', label: 'Social' },
  { id: 'phone', label: 'Teléfono' },
  { id: 'local', label: 'Local' },
]

export function OsintScreen() {
  const { caseId } = useAuth()
  const copy = t()
  const [sightings, setSightings] = useState<Sighting[]>([])
  const [investigations, setInvestigations] = useState<OsintInvestigation[]>(() =>
    loadInvestigations(),
  )
  const [running, setRunning] = useState(false)
  const [activeCat, setActiveCat] = useState<OsintCategory | 'all'>('all')
  const [photoResult, setPhotoResult] = useState<string | null>(null)
  const [pasteText, setPasteText] = useState('')

  useEffect(() => {
    if (!caseId) return
    return subscribeSightings(caseId, setSightings)
  }, [caseId])

  const corridor = analyzeCorridor(
    sightings.map((s) => ({
      point: s.point,
      observedAt: s.observedAt,
      label: s.description || undefined,
    })),
  )

  const dorks = generatePanzaDorks({
    name: PANZA_ANIMAL.name,
    aliases: PANZA_ANIMAL.aliases,
    breed: PANZA_ANIMAL.breed,
    color: PANZA_ANIMAL.color,
  })

  const runFullScan = useCallback(async () => {
    if (!caseId) return
    setRunning(true)
    try {
      const inv = await runInvestigation({
        caseId,
        rawText: pasteText || undefined,
        sightingPoints: sightings.map((s) => ({
          point: s.point,
          observedAt: s.observedAt,
          label: s.description,
        })),
      })
      saveInvestigation(inv)
      setInvestigations(loadInvestigations())
    } finally {
      setRunning(false)
    }
  }, [caseId, pasteText, sightings])

  async function onPhoto(file: File) {
    const exif = await extractExifGps(file)
    if (exif.hasGps && exif.lat && exif.lng) {
      setPhotoResult(`GPS: ${exif.lat.toFixed(5)}, ${exif.lng.toFixed(5)}`)
    } else {
      setPhotoResult(exif.warnings.join(' · ') || 'Sin GPS')
    }
  }

  const filteredTools =
    activeCat === 'all' ? OSINT_TOOLS : toolsByCategory(activeCat)

  const latestInv = investigations[0]

  return (
    <main className="screen osint-screen">
      <header className="osint-hero">
        <p className="osint-badge">OSINT · {OSINT_CORE_REPOS.catalog.name}</p>
        <h1>{copy.osint.title}</h1>
        <p className="muted">{copy.osint.subtitle}</p>
      </header>

      <section className="card osint-phase">
        <h2>{copy.osint.phases.recon}</h2>
        <p className="muted small">{copy.osint.reconHint}</p>
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={running || !caseId}
          onClick={() => void runFullScan()}
        >
          {running ? copy.osint.running : copy.osint.runScan}
        </button>
        {latestInv ? (
          <p className="muted small">
            Último escaneo: {latestInv.hits.length} hallazgos ·{' '}
            {new Date(latestInv.createdAt).toLocaleString('es-AR')}
          </p>
        ) : null}
      </section>

      <section className="card osint-phase">
        <h2>{copy.osint.phases.analyze}</h2>
        <ul className="intel-list">
          {corridor.map((c) => (
            <li key={c.label} className={c.priority === 'high' ? 'intel-high' : ''}>
              <strong>{c.label}</strong>
              <span>{c.detail}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card osint-phase">
        <h2>{copy.osint.phases.collect}</h2>
        <div className="field">
          <label htmlFor="osint-paste">{copy.osint.pasteLabel}</label>
          <textarea
            id="osint-paste"
            rows={3}
            placeholder="Pegá post de FB, IG, WhatsApp…"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="osint-photo">{copy.osint.photoLabel}</label>
          <input
            id="osint-photo"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void onPhoto(f)
            }}
          />
          {photoResult ? <p className="small">{photoResult}</p> : null}
        </div>
        <Link to="/bandeja?capture=1" className="btn btn-ghost btn-block">
          {copy.actions.pastePost} → Bandeja
        </Link>
      </section>

      <section className="card osint-phase">
        <h2>{copy.osint.dorksTitle}</h2>
        <div className="dork-grid">
          {dorks.slice(0, 8).map((d) => (
            <a
              key={d.id}
              href={dorkSearchUrl(d.query)}
              target="_blank"
              rel="noopener noreferrer"
              className="dork-chip"
            >
              <span className="dork-target">{d.target}</span>
              {d.label}
            </a>
          ))}
        </div>
      </section>

      {latestInv && latestInv.hits.length > 0 ? (
        <section className="card osint-phase">
          <h2>{copy.osint.hitsTitle}</h2>
          <ul className="hit-list">
            {latestInv.hits.slice(0, 12).map((h: OsintHit) => (
              <li key={h.id}>
                <div className="hit-head">
                  <strong>{h.title}</strong>
                  {h.priority === 'high' ? (
                    <span className="tag tag-high">alta</span>
                  ) : null}
                </div>
                <p className="small muted">{h.summary}</p>
                {h.url ? (
                  <a href={h.url} target="_blank" rel="noopener noreferrer" className="small">
                    Abrir →
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="card osint-phase">
        <h2>{copy.osint.toolkitTitle}</h2>
        <p className="muted small">
          Catálogo de{' '}
          <a href={OSINT_CORE_REPOS.catalog.url} target="_blank" rel="noopener noreferrer">
            {OSINT_CORE_REPOS.catalog.name}
          </a>{' '}
          · motor estilo{' '}
          <a href={OSINT_CORE_REPOS.engine.url} target="_blank" rel="noopener noreferrer">
            {OSINT_CORE_REPOS.engine.name}
          </a>
        </p>
        <div className="cat-tabs" role="tablist">
          <button
            type="button"
            className={activeCat === 'all' ? 'cat-tab active' : 'cat-tab'}
            onClick={() => setActiveCat('all')}
          >
            Todos
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={activeCat === c.id ? 'cat-tab active' : 'cat-tab'}
              onClick={() => setActiveCat(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <ul className="tool-list">
          {filteredTools.map((tool) => (
            <li key={tool.id}>
              <a
                href={
                  tool.searchUrl
                    ? tool.searchUrl(PANZA_ANIMAL.name + ' perro perdido')
                    : tool.url
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                <strong>{tool.name}</strong>
                <span className="small muted">{tool.description}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="card osint-phase muted small">
        <h2>{copy.osint.sourcesTitle}</h2>
        <p>
          <a href={PANZA_SOURCES.facebook} target="_blank" rel="noopener noreferrer">
            Facebook
          </a>{' '}
          ·{' '}
          <a href={PANZA_SOURCES.instagram} target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        </p>
      </section>
    </main>
  )
}
