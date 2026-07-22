import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import type {
  SearchTask,
  SearchZone,
  Sign,
  SignPlaceType,
  SignTier,
  Sighting,
  TaskKind,
  TaskPriority,
  Member,
} from '@/domain/schemas'
import { canManageMembers, canManageZones } from '@/domain/schemas'
import { useAuth } from '@/features/cases/useAuth'
import {
  claimTask,
  createSign,
  createTask,
  inviteMember,
  setActiveZone,
  setTaskDone,
  subscribeActiveZone,
  subscribeMembers,
  subscribeSigns,
  subscribeSightings,
  subscribeTasks,
  updateSignStatus,
} from '@/lib/firebase/repos'
import { t } from '@/i18n/es-AR'

const kindLabels: Record<TaskKind, string> = {
  search: 'Recorrido',
  sign: 'Carteles',
  contact: 'Contactar lugar',
  camera: 'Revisar cámara',
  feeding: 'Punto de comida',
  other: 'Otra',
}

const placeTypeLabels: Record<SignPlaceType, string> = {
  service_station: 'Estación de servicio',
  police: 'Policía',
  security: 'Garita / seguridad',
  business_24h: 'Comercio 24 h',
  vet: 'Veterinaria',
  pet_shop: 'Pet shop',
  groomer: 'Peluquería canina',
  shelter: 'Refugio',
  supermarket: 'Supermercado',
  transit: 'Estación / tránsito',
  pharmacy: 'Farmacia',
  school: 'Escuela',
  club: 'Club',
  street: 'Vía pública',
  other: 'Otro',
}

const tierHelp: Record<SignTier, string> = {
  A: 'presencia humana 24/7',
  B: 'red animal',
  C: 'alto tránsito',
  D: 'calle común',
}

function useCoordination(caseId: string | null) {
  const [tasks, setTasks] = useState<SearchTask[]>([])
  const [signs, setSigns] = useState<Sign[]>([])
  const [sightings, setSightings] = useState<Sighting[]>([])
  const [zone, setZone] = useState<SearchZone | null>(null)
  const [members, setMembers] = useState<Member[]>([])

  useEffect(() => {
    if (!caseId) return
    const unsubscribe = [
      subscribeTasks(caseId, setTasks),
      subscribeSigns(caseId, setSigns),
      subscribeSightings(caseId, setSightings),
      subscribeActiveZone(caseId, setZone),
      subscribeMembers(caseId, setMembers),
    ]
    return () => unsubscribe.forEach((stop) => stop())
  }, [caseId])

  return { tasks, signs, sightings, zone, members }
}

export function PlanScreen() {
  const { caseId, member, user } = useAuth()
  const { tasks, signs, sightings, zone, members } = useCoordination(caseId)
  const [params] = useSearchParams()
  const [message, setMessage] = useState<string | null>(null)
  const copy = t()

  const latestConfirmed = useMemo(
    () =>
      sightings.find(
        (item) => item.confidence === 'confirmed' && item.affectsOfficialZone,
      ) ?? sightings.find((item) => item.confidence === 'confirmed'),
    [sightings],
  )

  if (!caseId || !member || !user) return null

  const openTasks = tasks.filter((item) => item.status !== 'done').length
  const placedSigns = signs.filter((item) => item.status === 'placed').length

  return (
    <div className="screen plan-screen">
      <div className="plan-heading">
        <div>
          <h1>{copy.plan.title}</h1>
          <p className="muted">Una sola verdad operativa para todo el equipo.</p>
        </div>
        <div className="plan-metrics" aria-label="Resumen operativo">
          <span><strong>{openTasks}</strong> pendientes</span>
          <span><strong>{placedSigns}</strong> carteles activos</span>
        </div>
      </div>

      {message ? <p className="notice" role="status">{message}</p> : null}

      <section className="protocol-card" aria-labelledby="field-protocol">
        <h2 id="field-protocol">Si la ven ahora</h2>
        <ol>
          <li>No perseguirla, llamarla ni rodearla.</li>
          <li>Anotar hora exacta, punto y dirección; sacar foto sin acercarse.</li>
          <li>Una persona informa; otra coordina. Evitar respuestas duplicadas.</li>
          <li>Comida, cámaras o trampas: sólo con responsable y monitoreo continuo.</li>
        </ol>
      </section>

      <TaskSection
        caseId={caseId}
        actor={{ uid: user.uid, displayName: member.displayName }}
        tasks={tasks}
        initiallyOpen={params.get('new') === 'task'}
        onMessage={setMessage}
      />

      <SignSection
        caseId={caseId}
        actorUid={user.uid}
        signs={signs}
        initiallyOpen={params.get('new') === 'sign'}
        onMessage={setMessage}
      />

      <ZoneSection
        caseId={caseId}
        actorUid={user.uid}
        zone={zone}
        latestConfirmed={latestConfirmed}
        canEdit={canManageZones(member.role)}
        onMessage={setMessage}
      />

      {canManageMembers(member.role) ? (
        <InviteSection caseId={caseId} members={members} onMessage={setMessage} />
      ) : null}
    </div>
  )
}

function TaskSection({
  caseId,
  actor,
  tasks,
  initiallyOpen,
  onMessage,
}: {
  caseId: string
  actor: { uid: string; displayName: string }
  tasks: SearchTask[]
  initiallyOpen: boolean
  onMessage: (message: string) => void
}) {
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<TaskKind>('search')
  const [priority, setPriority] = useState<TaskPriority>('normal')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [composerOpen, setComposerOpen] = useState(initiallyOpen)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    setBusy(true)
    try {
      await createTask(caseId, {
        title,
        kind,
        priority,
        notes,
        createdByUid: actor.uid,
      })
      setTitle('')
      setNotes('')
      onMessage('Tarea compartida con el equipo.')
    } catch {
      onMessage('No se pudo guardar la tarea. Revisá la conexión.')
    } finally {
      setBusy(false)
    }
  }

  const act = async (action: () => Promise<void>, success: string) => {
    try {
      await action()
      onMessage(success)
    } catch {
      onMessage('No se pudo actualizar la tarea.')
    }
  }

  return (
    <section className="plan-card">
      <div className="section-title">
        <div><h2>Trabajo de campo</h2><p>Asigná recorridos y evitá repetir zonas.</p></div>
        <span className="badge">{tasks.filter((task) => task.status !== 'done').length} activas</span>
      </div>

      <details
        className="composer"
        open={composerOpen}
        onToggle={(event) => setComposerOpen(event.currentTarget.open)}
      >
        <summary>Nueva tarea</summary>
        <form onSubmit={(event) => void submit(event)}>
          <div className="field">
            <label htmlFor="task-title">Qué hay que hacer</label>
            <input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Ej.: recorrer Maipú de San Ramón a 9 de Julio" />
          </div>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="task-kind">Tipo</label>
              <select id="task-kind" value={kind} onChange={(event) => setKind(event.target.value as TaskKind)}>
                {Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="task-priority">Prioridad</label>
              <select id="task-priority" value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="task-notes">Punto de encuentro / calles / cuidado</label>
            <textarea id="task-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Indicá límites claros y cualquier riesgo objetivo del recorrido." />
          </div>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Guardando…' : 'Compartir tarea'}</button>
        </form>
      </details>

      {tasks.length === 0 ? <p className="empty-state">Todavía no hay tareas.</p> : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li className={`task-card priority-${task.priority} ${task.status === 'done' ? 'done' : ''}`} key={task.id}>
              <div className="task-main">
                <div className="task-labels"><span className="badge">{kindLabels[task.kind]}</span>{task.priority !== 'normal' ? <span className="badge warn">{task.priority === 'urgent' ? 'urgente' : 'alta'}</span> : null}</div>
                <strong>{task.title}</strong>
                {task.notes ? <p>{task.notes}</p> : null}
                {task.assigneeName ? <small>Responsable: {task.assigneeName}</small> : <small>Sin responsable</small>}
              </div>
              <div className="task-actions">
                {task.status === 'open' ? <button className="btn btn-ghost" onClick={() => void act(() => claimTask(caseId, task.id, actor), 'Tarea tomada.')}>La hago</button> : null}
                {task.status !== 'done' ? <button className="btn btn-primary" onClick={() => void act(() => setTaskDone(caseId, task.id, true), 'Tarea completada.')}>Hecha</button> : <button className="btn btn-ghost" onClick={() => void act(() => setTaskDone(caseId, task.id, false), 'Tarea reabierta.')}>Reabrir</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function SignSection({
  caseId,
  actorUid,
  signs,
  initiallyOpen,
  onMessage,
}: {
  caseId: string
  actorUid: string
  signs: Sign[]
  initiallyOpen: boolean
  onMessage: (message: string) => void
}) {
  const [placeName, setPlaceName] = useState('')
  const [tier, setTier] = useState<SignTier>('A')
  const [placeType, setPlaceType] = useState<SignPlaceType>('service_station')
  const [longitude, setLongitude] = useState('')
  const [latitude, setLatitude] = useState('')
  const [alerted, setAlerted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [composerOpen, setComposerOpen] = useState(initiallyOpen)

  const locate = () => {
    if (!navigator.geolocation) return onMessage('Este dispositivo no ofrece ubicación.')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLongitude(coords.longitude.toFixed(6))
        setLatitude(coords.latitude.toFixed(6))
        onMessage('Ubicación lista. Confirmala antes de guardar.')
      },
      () => onMessage('No se pudo obtener la ubicación.'),
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const lng = Number(longitude)
    const lat = Number(latitude)
    if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lng) > 180 || Math.abs(lat) > 90) {
      onMessage('Ingresá una ubicación válida.')
      return
    }
    setBusy(true)
    try {
      await createSign(caseId, {
        point: [lng, lat],
        placeName,
        tier,
        placeType,
        status: 'placed',
        staffPersonallyAlerted: alerted,
        createdByUid: actorUid,
      })
      setPlaceName('')
      setLongitude('')
      setLatitude('')
      setAlerted(false)
      onMessage('Cartel agregado al mapa.')
    } catch {
      onMessage('No se pudo guardar el cartel.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="plan-card">
      <div className="section-title"><div><h2>Red de carteles</h2><p>Priorizá ojos humanos y registrá a quién avisaron.</p></div><span className="badge">{signs.filter((sign) => sign.status === 'placed').length} colocados</span></div>
      <div className="tier-key" aria-label="Prioridades de carteles">{(['A', 'B', 'C', 'D'] as const).map((value) => <span key={value}><strong>{value}</strong> {tierHelp[value]}</span>)}</div>

      <details
        className="composer"
        open={composerOpen}
        onToggle={(event) => setComposerOpen(event.currentTarget.open)}
      >
        <summary>Registrar cartel colocado</summary>
        <form onSubmit={(event) => void submit(event)}>
          <div className="field"><label htmlFor="sign-place">Lugar</label><input id="sign-place" required value={placeName} onChange={(event) => setPlaceName(event.target.value)} placeholder="Ej.: YPF Maipú" /></div>
          <div className="field-grid">
            <div className="field"><label htmlFor="sign-tier">Prioridad</label><select id="sign-tier" value={tier} onChange={(event) => setTier(event.target.value as SignTier)}>{(['A', 'B', 'C', 'D'] as const).map((value) => <option key={value} value={value}>{value} — {tierHelp[value]}</option>)}</select></div>
            <div className="field"><label htmlFor="sign-type">Tipo de lugar</label><select id="sign-type" value={placeType} onChange={(event) => setPlaceType(event.target.value as SignPlaceType)}>{Object.entries(placeTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          </div>
          <button type="button" className="btn btn-ghost btn-block" onClick={locate}>Usar mi ubicación</button>
          <div className="field-grid coordinate-fields">
            <div className="field"><label htmlFor="sign-lat">Latitud</label><input id="sign-lat" inputMode="decimal" required value={latitude} onChange={(event) => setLatitude(event.target.value)} /></div>
            <div className="field"><label htmlFor="sign-lng">Longitud</label><input id="sign-lng" inputMode="decimal" required value={longitude} onChange={(event) => setLongitude(event.target.value)} /></div>
          </div>
          <label className="check-row"><input type="checkbox" checked={alerted} onChange={(event) => setAlerted(event.target.checked)} /> Hablamos personalmente con alguien del lugar</label>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Guardando…' : 'Guardar cartel'}</button>
        </form>
      </details>

      {signs.length === 0 ? <p className="empty-state">Todavía no hay carteles registrados.</p> : (
        <ul className="compact-list">
          {signs.slice(0, 12).map((sign) => (
            <li key={sign.id}><span className={`tier tier-${sign.tier}`}>{sign.tier}</span><div><strong>{sign.placeName || placeTypeLabels[sign.placeType]}</strong><small>{placeTypeLabels[sign.placeType]} · {sign.staffPersonallyAlerted ? 'personal avisado' : 'sin confirmar aviso'}{sign.posterCode ? ` · código ${sign.posterCode}` : ''}</small></div><select aria-label={`Estado de ${sign.placeName || 'cartel'}`} value={sign.status} onChange={(event) => void updateSignStatus(caseId, sign.id, event.target.value as Sign['status']).catch(() => onMessage('No se pudo actualizar el cartel.'))}><option value="placed">Colocado</option><option value="planned">Planificado</option><option value="missing">Falta</option><option value="damaged">Dañado</option><option value="removed">Retirado</option></select></li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ZoneSection({
  caseId,
  actorUid,
  zone,
  latestConfirmed,
  canEdit,
  onMessage,
}: {
  caseId: string
  actorUid: string
  zone: SearchZone | null
  latestConfirmed?: Sighting
  canEdit: boolean
  onMessage: (message: string) => void
}) {
  const [radiusKm, setRadiusKm] = useState('3')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (zone) setRadiusKm((zone.radiusMeters / 1000).toFixed(1).replace('.0', ''))
  }, [zone])

  const save = async () => {
    const radius = Number(radiusKm)
    if (!latestConfirmed || !Number.isFinite(radius) || radius < 0.1 || radius > 25) {
      onMessage('Elegí un radio entre 0,1 y 25 km y verificá que haya un avistaje confirmado.')
      return
    }
    setBusy(true)
    try {
      await setActiveZone(caseId, {
        center: latestConfirmed.point,
        radiusMeters: radius * 1000,
        basisSightingId: latestConfirmed.id,
        basisObservedAt: latestConfirmed.observedAt,
        updatedByUid: actorUid,
      })
      onMessage('Zona operativa actualizada en el mapa.')
    } catch {
      onMessage('No se pudo actualizar la zona.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="plan-card">
      <div className="section-title"><div><h2>Zona operativa</h2><p>Se mueve sólo desde un avistaje confirmado.</p></div>{zone ? <span className="badge">{(zone.radiusMeters / 1000).toLocaleString('es-AR')} km</span> : null}</div>
      {latestConfirmed ? <p className="zone-basis"><strong>Base:</strong> {latestConfirmed.description || 'avistaje confirmado'} · {latestConfirmed.observedAt.toLocaleString('es-AR')}</p> : <p className="empty-state">Falta un avistaje confirmado para fijar la zona.</p>}
      {canEdit ? <div className="zone-controls"><div className="field"><label htmlFor="zone-radius">Radio para búsqueda y carteles (km)</label><input id="zone-radius" type="number" min="0.1" max="25" step="0.1" value={radiusKm} onChange={(event) => setRadiusKm(event.target.value)} /></div><button className="btn btn-primary" disabled={busy || !latestConfirmed} onClick={() => void save()}>{busy ? 'Actualizando…' : 'Mover zona al último confirmado'}</button></div> : <p className="muted">Sólo owner o coordinador puede moverla.</p>}
    </section>
  )
}

function InviteSection({ caseId, members, onMessage }: { caseId: string; members: Member[]; onMessage: (message: string) => void }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'coordinator' | 'searcher'>('searcher')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    try {
      const result = await inviteMember({ caseId, email: email.trim(), role })
      onMessage(result.alreadyMember ? 'Esa persona ya pertenece al equipo.' : 'Invitación lista. Debe entrar con ese mismo email.')
      setEmail('')
    } catch {
      onMessage('No se pudo crear la invitación.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="plan-card">
      <div className="section-title"><div><h2>Equipo</h2><p>Invitaciones por email; no se publica ninguna identidad.</p></div></div>
      <form className="invite-form" onSubmit={(event) => void submit(event)}>
        <div className="field"><label htmlFor="invite-email">Email exacto</label><input id="invite-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="persona@gmail.com" /></div>
        <div className="field"><label htmlFor="invite-role">Rol</label><select id="invite-role" value={role} onChange={(event) => setRole(event.target.value as typeof role)}><option value="searcher">Buscador/a</option><option value="coordinator">Coordinador/a</option></select></div>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Invitando…' : 'Invitar'}</button>
      </form>
      <ul className="team-list" aria-label="Miembros activos">
        {members.filter((item) => item.active).map((item) => (
          <li key={item.uid}>
            <span><strong>{item.displayName}</strong><small>{item.email}</small></span>
            <span className="badge">{item.role === 'owner' ? 'owner' : item.role === 'coordinator' ? 'coordinación' : 'búsqueda'}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
