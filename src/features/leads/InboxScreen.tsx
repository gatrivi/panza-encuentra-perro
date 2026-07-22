import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useAuth } from '@/features/cases/useAuth'
import {
  createLead,
  subscribeLeads,
  updateLeadStatus,
  promoteLeadToSighting,
} from '@/lib/firebase/repos'
import { storage } from '@/lib/firebase/app'
import { newDraftId, saveDraft, type IntakeDraft } from '@/lib/offline/drafts'
import type { CompassDirection, Lead, SightingConfidence } from '@/domain/schemas'
import { canPromoteSightings } from '@/domain/schemas'
import { formatAge, t } from '@/i18n/es-AR'
import { detectIntake } from '@/features/intake/detectIntake'

export function InboxScreen() {
  const { caseId, user, member } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [promoteLead, setPromoteLead] = useState<Lead | null>(null)
  const [params] = useSearchParams()
  const fileRef = useRef<HTMLInputElement>(null)
  const copy = t()

  useEffect(() => {
    if (!caseId) return
    return subscribeLeads(caseId, setLeads)
  }, [caseId])

  useEffect(() => {
    if (params.get('capture')) {
      // focus paste surface via query flag — no extra form
    }
  }, [params])

  const openLeads = useMemo(
    () => leads.filter((l) => l.status === 'new' || l.status === 'needs_details'),
    [leads],
  )

  async function persistCapture(input: {
    rawText?: string
    sourceUrl?: string
    file?: File
  }) {
    if (!caseId || !user) return
    setBusy(true)
    const draftId = newDraftId()
    const draft: IntakeDraft = {
      id: draftId,
      createdAt: new Date().toISOString(),
      rawText: input.rawText,
      sourceUrl: input.sourceUrl,
      status: 'draft',
      imageBlob: input.file,
    }
    try {
      await saveDraft(draft)
      draft.status = 'uploading'
      await saveDraft(draft)

      const attachmentPaths: string[] = []
      if (input.file) {
        const path = `cases/${caseId}/leads/${draftId}/${input.file.name}`
        const storageRef = ref(storage, path)
        await uploadBytes(storageRef, input.file)
        attachmentPaths.push(await getDownloadURL(storageRef))
      }

      const origin = input.sourceUrl?.includes('facebook')
        ? 'facebook'
        : input.sourceUrl?.includes('instagram')
          ? 'instagram'
          : 'other'

      const leadId = await createLead(caseId, {
        origin,
        rawText: input.rawText,
        sourceUrl: input.sourceUrl,
        attachmentPaths,
        capturedByUid: user.uid,
      })

      draft.status = 'synced'
      draft.remoteLeadId = leadId
      await saveDraft(draft)
      setToast(copy.actions.saved)
      setTimeout(() => setToast(null), 2000)
    } catch (e) {
      console.error(e)
      draft.status = 'error'
      draft.error = e instanceof Error ? e.message : 'error'
      await saveDraft(draft)
      setToast(navigator.onLine ? copy.errors.generic : copy.errors.offline)
      setTimeout(() => setToast(null), 3000)
    } finally {
      setBusy(false)
    }
  }

  async function onPaste(e: React.ClipboardEvent) {
    const detected = await detectIntake(e.clipboardData)
    if (!detected.rawText && !detected.sourceUrl && !detected.file) return
    e.preventDefault()
    await persistCapture(detected)
  }

  async function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    const text = e.dataTransfer.getData('text')
    const detected = detectIntake.fromValues({ text, file })
    await persistCapture(detected)
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await persistCapture({ file })
    e.target.value = ''
  }

  return (
    <div className="screen">
      <h1>{copy.inbox.title}</h1>

      <div
        className="paste-surface"
        tabIndex={0}
        role="button"
        aria-label={copy.inbox.pasteHint}
        onPaste={(e) => void onPaste(e)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => void onDrop(e)}
        onClick={() => fileRef.current?.click()}
      >
        <h2>{copy.inbox.pasteHint}</h2>
        <p>{copy.inbox.pasteSub}</p>
        {busy ? <p className="muted">Guardando…</p> : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/*,text/plain"
          className="sr-only"
          onChange={(e) => void onFile(e)}
        />
      </div>

      {openLeads.length === 0 ? (
        <p className="muted" style={{ marginTop: '1rem' }}>
          {copy.inbox.empty}
        </p>
      ) : (
        <ul className="lead-list">
          {openLeads.map((lead) => (
            <li
              key={lead.id}
              className={`lead-card${lead.priority === 'high' ? ' high' : ''}`}
            >
              <div className="lead-meta">
                <span className="badge">{lead.origin}</span>
                {lead.priority === 'high' ? (
                  <span className="badge warn">urgente</span>
                ) : null}
                <span>
                  {copy.inbox.captureAge.replace(
                    '{age}',
                    formatAge(Date.now() - lead.capturedAt.getTime()),
                  )}
                </span>
                <span>{lead.status}</span>
              </div>
              {lead.rawText ? (
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {lead.rawText.slice(0, 280)}
                </p>
              ) : null}
              {lead.sourceUrl ? (
                <p style={{ margin: '0.35rem 0 0' }}>
                  <a href={lead.sourceUrl} target="_blank" rel="noreferrer">
                    {lead.sourceUrl}
                  </a>
                </p>
              ) : null}
              {lead.attachmentPaths[0] ? (
                <img
                  src={lead.attachmentPaths[0]}
                  alt="Evidencia"
                  style={{
                    marginTop: '0.5rem',
                    maxWidth: '100%',
                    borderRadius: 8,
                    maxHeight: 160,
                    objectFit: 'cover',
                  }}
                />
              ) : null}
              {lead.claimedLocationText ? (
                <p className="muted">{lead.claimedLocationText}</p>
              ) : null}
              <div className="lead-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={!canPromoteSightings(member!.role)}
                  onClick={() => setPromoteLead(lead)}
                >
                  {copy.actions.locate}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!canPromoteSightings(member!.role)}
                  onClick={() => setPromoteLead(lead)}
                >
                  {copy.actions.promote}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={!canPromoteSightings(member!.role)}
                  onClick={() =>
                    void updateLeadStatus(caseId!, lead.id, 'rejected', 'Descartado')
                  }
                >
                  {copy.actions.discard}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {promoteLead && caseId && user ? (
        <PromoteSheet
          lead={promoteLead}
          caseId={caseId}
          actorUid={user.uid}
          onClose={() => setPromoteLead(null)}
          onDone={() => {
            setPromoteLead(null)
            setToast(copy.actions.saved)
            setTimeout(() => setToast(null), 2000)
          }}
        />
      ) : null}

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  )
}

function PromoteSheet({
  lead,
  caseId,
  actorUid,
  onClose,
  onDone,
}: {
  lead: Lead
  caseId: string
  actorUid: string
  onClose: () => void
  onDone: () => void
}) {
  const copy = t()
  const [observedAt, setObservedAt] = useState(
    () => new Date().toISOString().slice(0, 16),
  )
  const [lng, setLng] = useState(String(lead.claimedPoint?.[0] ?? -58.49))
  const [lat, setLat] = useState(String(lead.claimedPoint?.[1] ?? -34.512))
  const [direction, setDirection] = useState<CompassDirection>(
    lead.claimedDirection ?? 'unknown',
  )
  const [confidence, setConfidence] = useState<SightingConfidence>('probable')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await promoteLeadToSighting({
        caseId,
        lead,
        actorUid,
        observedAt: new Date(observedAt),
        point: [Number(lng), Number(lat)],
        direction,
        confidence,
        description: notes || lead.rawText,
      })
      onDone()
    } catch (err) {
      console.error(err)
      alert(copy.errors.generic)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <form className="sheet" onClick={(e) => e.stopPropagation()} onSubmit={(e) => void submit(e)}>
        <h2>{copy.promote.title}</h2>
        <div className="field">
          <label htmlFor="observedAt">{copy.promote.observedAt}</label>
          <input
            id="observedAt"
            type="datetime-local"
            value={observedAt}
            onChange={(e) => setObservedAt(e.target.value)}
            required
          />
        </div>
        <div className="row">
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="lng">Longitud</label>
            <input id="lng" value={lng} onChange={(e) => setLng(e.target.value)} required />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="lat">Latitud</label>
            <input id="lat" value={lat} onChange={(e) => setLat(e.target.value)} required />
          </div>
        </div>
        <div className="field">
          <label htmlFor="direction">Dirección</label>
          <select
            id="direction"
            value={direction}
            onChange={(e) => setDirection(e.target.value as CompassDirection)}
          >
            {['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'stationary', 'unknown'].map(
              (d) => (
                <option key={d} value={d}>
                  {d === 'stationary' ? copy.public.stationary : d}
                </option>
              ),
            )}
          </select>
        </div>
        <div className="field">
          <label htmlFor="confidence">{copy.promote.confidence}</label>
          <select
            id="confidence"
            value={confidence}
            onChange={(e) => setConfidence(e.target.value as SightingConfidence)}
          >
            <option value="unverified">{copy.confidence.unverified}</option>
            <option value="probable">{copy.confidence.probable}</option>
            <option value="confirmed">{copy.confidence.confirmed}</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="notes">{copy.promote.notes}</label>
          <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="stack">
          <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
            {copy.actions.promote}
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={onClose}>
            {copy.actions.cancel}
          </button>
        </div>
      </form>
    </div>
  )
}
