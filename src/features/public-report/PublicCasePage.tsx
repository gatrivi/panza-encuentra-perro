import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { connectEmulatorsIfNeeded } from '@/lib/firebase/app'
import { ensurePanzaCase, getPublicCase, submitPublicReport } from '@/lib/firebase/repos'
import type { CompassDirection, PublicCase } from '@/domain/schemas'
import { t } from '@/i18n/es-AR'

const DIRECTIONS: CompassDirection[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

export function PublicCasePage() {
  const { slug = '' } = useParams()
  const [pub, setPub] = useState<PublicCase | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'idle' | 'seeing_now' | 'think_i_saw' | 'done'>('idle')
  const copy = t()

  useEffect(() => {
    connectEmulatorsIfNeeded()
    void (async () => {
      try {
        await ensurePanzaCase()
        setPub(await getPublicCase(slug))
      } catch (e) {
        console.error(e)
        setPub(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [slug])

  if (loading) {
    return (
      <div className="public-page">
        <p style={{ padding: '1.5rem' }}>{copy.auth.loading}</p>
      </div>
    )
  }

  if (!pub) {
    return (
      <div className="public-page">
        <p style={{ padding: '1.5rem' }}>No encontramos este caso.</p>
        <Link to="/" style={{ padding: '0 1.5rem' }}>
          Volver
        </Link>
      </div>
    )
  }

  const animal = pub.animal
  const phone = pub.publicContact.displayPhone
  const wa = pub.publicContact.whatsapp

  return (
    <div className="public-page">
      <section className="public-hero" aria-label={animal.name}>
        {animal.photos?.[0] ? (
          <img
            className="public-hero-img"
            src={animal.photos[0]}
            alt={animal.name}
            width={640}
            height={640}
          />
        ) : null}
        <div className="brand">{animal.name}</div>
        <p>
          {[animal.breed, animal.color, animal.sex === 'female' ? 'hembra' : animal.sex]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {animal.distinguishingMarks ? <p>{animal.distinguishingMarks}</p> : null}
        {animal.photos && animal.photos.length > 1 ? (
          <div className="public-photo-row">
            {animal.photos.slice(1).map((src) => (
              <img key={src} src={src} alt="" width={160} height={160} />
            ))}
          </div>
        ) : null}
      </section>

      <div className="public-body">
        {mode === 'done' ? (
          <>
            <h2>{copy.public.thanks}</h2>
            <p>{pub.publicInstructions || copy.public.guidance}</p>
            <ContactActions phone={phone} wa={wa} />
          </>
        ) : mode === 'idle' ? (
          <>
            <p>{pub.publicInstructions || copy.public.guidance}</p>
            <button
              type="button"
              className="btn btn-accent btn-block"
              onClick={() => setMode('seeing_now')}
            >
              {copy.public.seeingNow}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => setMode('think_i_saw')}
            >
              {copy.public.thinkISaw}
            </button>
            <ContactActions phone={phone} wa={wa} />
          </>
        ) : (
          <UrgentReportForm
            slug={slug}
            mode={mode}
            onDone={() => setMode('done')}
            onCancel={() => setMode('idle')}
          />
        )}
      </div>
    </div>
  )
}

function ContactActions({ phone, wa }: { phone?: string; wa?: string }) {
  const copy = t()
  return (
    <div className="row">
      {phone ? (
        <a className="btn btn-primary" href={`tel:${phone}`}>
          {copy.public.call}
        </a>
      ) : null}
      {wa ? (
        <a
          className="btn btn-ghost"
          href={`https://wa.me/${wa.replace(/\D/g, '')}`}
          target="_blank"
          rel="noreferrer"
        >
          {copy.public.whatsapp}
        </a>
      ) : null}
    </div>
  )
}

function UrgentReportForm({
  slug,
  mode,
  onDone,
  onCancel,
}: {
  slug: string
  mode: 'seeing_now' | 'think_i_saw'
  onDone: () => void
  onCancel: () => void
}) {
  const copy = t()
  const [direction, setDirection] = useState<CompassDirection | undefined>()
  const [phone, setPhone] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [point, setPoint] = useState<[number, number] | undefined>()
  const [locError, setLocError] = useState<string | null>(null)
  const [honeypot, setHoneypot] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function requestLocation() {
    setLocError(null)
    if (!navigator.geolocation) {
      setLocError(copy.errors.locationDenied)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setPoint([pos.coords.longitude, pos.coords.latitude]),
      () => setLocError(copy.errors.locationDenied),
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!anonymous && !phone.trim()) {
      setError('Dejá un teléfono o marcá anónimo.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await submitPublicReport({
        slug,
        mode,
        point,
        direction,
        phone: anonymous ? undefined : phone,
        anonymous,
        honeypot,
      })
      onDone()
    } catch (err) {
      console.error(err)
      setError(copy.errors.generic)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="stack" onSubmit={(e) => void submit(e)}>
      <h2>{mode === 'seeing_now' ? copy.public.seeingNow : copy.public.thinkISaw}</h2>
      <button type="button" className="btn btn-ghost btn-block" onClick={requestLocation}>
        {copy.public.allowLocation}
        {point ? ' ✓' : ''}
      </button>
      {locError ? <p role="alert">{locError}</p> : null}

      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="muted" style={{ marginBottom: '0.5rem', fontWeight: 650 }}>
          {copy.public.directionLabel}
        </legend>
        <div className="compass">
          {DIRECTIONS.map((d) => (
            <button
              key={d}
              type="button"
              className={`btn btn-ghost${direction === d ? ' selected' : ''}`}
              onClick={() => setDirection(d)}
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            className={`btn btn-ghost${direction === 'stationary' || direction === 'unknown' ? ' selected' : ''}`}
            style={{ gridColumn: '1 / -1' }}
            onClick={() => setDirection('stationary')}
          >
            {copy.public.stationary}
          </button>
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="phone">{copy.public.phoneLabel}</label>
        <input
          id="phone"
          type="tel"
          value={phone}
          disabled={anonymous}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
        />
      </div>
      <label className="row" style={{ alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
        />
        {copy.public.anonymous}
      </label>

      {/* honeypot */}
      <input
        className="sr-only"
        tabIndex={-1}
        autoComplete="off"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        aria-hidden
      />

      {error ? <p role="alert">{error}</p> : null}

      <button type="submit" className="btn btn-accent btn-block" disabled={submitting}>
        {submitting ? copy.public.submitting : copy.actions.submit}
      </button>
      <button type="button" className="btn btn-ghost btn-block" onClick={onCancel}>
        {copy.actions.cancel}
      </button>
    </form>
  )
}
