import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  addDoc,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, defaultCaseSlug, functions } from './app'
import { requireDate, toDate } from './converters'
import { caseSlugCandidates } from '@/domain/caseIdentity'
import type {
  Case,
  Lead,
  LeadStatus,
  Member,
  PublicCase,
  Sighting,
  SightingConfidence,
  CompassDirection,
  MemberRole,
  SearchTask,
  SearchZone,
  Sign,
  SignPlaceType,
  SignTier,
} from '@/domain/schemas'

export async function getPublicCase(slug: string): Promise<PublicCase | null> {
  let snap = null
  for (const candidate of caseSlugCandidates(slug)) {
    const candidateSnap = await getDoc(doc(db, 'publicCases', candidate))
    if (candidateSnap.exists()) {
      snap = candidateSnap
      break
    }
  }
  if (!snap) return null
  const d = snap.data()
  const animal = d.animal as PublicCase['animal']
  return {
    slug: snap.id,
    caseId: d.caseId,
    status: d.status,
    animal: {
      ...animal,
      aliases: animal?.aliases ?? [],
      photos: animal?.photos ?? [],
    },
    publicContact: d.publicContact ?? {},
    publicInstructions: d.publicInstructions,
    publicArea: d.publicArea,
    updatedAt: requireDate(d.updatedAt, 'updatedAt'),
  }
}

export async function getCase(caseId: string): Promise<Case | null> {
  const snap = await getDoc(doc(db, 'cases', caseId))
  if (!snap.exists()) return null
  const d = snap.data()
  const animal = d.animal as Case['animal']
  return {
    id: snap.id,
    slug: d.slug,
    status: d.status,
    animal: {
      ...animal,
      aliases: animal?.aliases ?? [],
      photos: animal?.photos ?? [],
    },
    locale: d.locale ?? 'es-AR',
    distanceUnit: d.distanceUnit ?? 'km',
    mapCenter: d.mapCenter,
    publicContact: d.publicContact ?? {},
    publicInstructions: d.publicInstructions,
    zonePolicy: d.zonePolicy ?? { defaultRadius: 3, unit: 'km' },
    createdAt: requireDate(d.createdAt, 'createdAt'),
    updatedAt: requireDate(d.updatedAt, 'updatedAt'),
  }
}

export async function getMember(caseId: string, uid: string): Promise<Member | null> {
  const snap = await getDoc(doc(db, 'cases', caseId, 'members', uid))
  if (!snap.exists()) return null
  const d = snap.data()
  return {
    uid: snap.id,
    role: d.role,
    displayName: d.displayName,
    email: d.email,
    active: d.active,
    createdAt: requireDate(d.createdAt, 'createdAt'),
    lastSeenAt: toDate(d.lastSeenAt),
  }
}

export function subscribeMembers(
  caseId: string,
  onChange: (members: Member[]) => void,
): Unsubscribe {
  return onSnapshot(collection(db, 'cases', caseId, 'members'), (snap) => {
    const members = snap.docs.map((item) => {
      const data = item.data()
      return {
        uid: item.id,
        role: data.role as Member['role'],
        displayName: String(data.displayName ?? data.email ?? item.id),
        email: String(data.email ?? ''),
        active: data.active === true,
        createdAt: toDate(data.createdAt) ?? new Date(0),
        lastSeenAt: toDate(data.lastSeenAt),
      }
    })
    members.sort((a, b) => a.displayName.localeCompare(b.displayName, 'es'))
    onChange(members)
  })
}

export async function findActiveMembership(uid: string): Promise<{
  caseId: string
  member: Member
} | null> {
  // ponytail: MVP = one case per deployment; collectionGroup later for multi-case
  const publicCase = await getPublicCase(defaultCaseSlug)
  if (!publicCase) return null
  const caseId = publicCase.caseId
  const member = await getMember(caseId, uid)
  if (!member || !member.active) return null
  return { caseId, member }
}

export async function claimMembershipIfEligible(uid: string): Promise<Member | null> {
  // joinCase is retained as the stable callable name across v0.1 and v0.2.
  const claim = httpsCallable(functions, 'joinCase')
  try {
    const result = await claim({ slug: defaultCaseSlug })
    const data = result.data as { caseId?: string }
    if (!data.caseId) return null
    return getMember(data.caseId, uid)
  } catch {
    return null
  }
}

/** @deprecated kept for older callers while deployments move to claimMembership. */
export const claimFirstOwnerIfNeeded = claimMembershipIfEligible

export async function inviteMember(input: {
  caseId: string
  email: string
  role: Exclude<MemberRole, 'owner'>
}): Promise<{ alreadyMember: boolean }> {
  const invite = httpsCallable(functions, 'inviteMember')
  const result = await invite(input)
  const data = result.data as { alreadyMember?: boolean }
  return { alreadyMember: Boolean(data.alreadyMember) }
}

function mapLead(id: string, caseId: string, d: Record<string, unknown>): Lead {
  return {
    id,
    caseId,
    origin: d.origin as Lead['origin'],
    sourceUrl: d.sourceUrl as string | undefined,
    rawText: d.rawText as string | undefined,
    attachmentPaths: (d.attachmentPaths as string[]) ?? [],
    sourcePublishedAt: toDate(d.sourcePublishedAt),
    capturedAt: requireDate(d.capturedAt, 'capturedAt'),
    capturedByUid: d.capturedByUid as string | undefined,
    reporter: (d.reporter as Lead['reporter']) ?? {},
    claimedObservationAt: toDate(d.claimedObservationAt),
    claimedLocationText: d.claimedLocationText as string | undefined,
    claimedPoint: d.claimedPoint as Lead['claimedPoint'],
    claimedDirection: d.claimedDirection as Lead['claimedDirection'],
    parserSuggestions: (d.parserSuggestions as Lead['parserSuggestions']) ?? {
      dates: [],
      locations: [],
      phones: [],
      keywords: [],
    },
    status: d.status as LeadStatus,
    duplicateOf: d.duplicateOf as string | undefined,
    reviewNotes: d.reviewNotes as string | undefined,
    promotedSightingId: d.promotedSightingId as string | undefined,
    priority: (d.priority as Lead['priority']) ?? 'normal',
    posterCode: d.posterCode as string | undefined,
  }
}

export function subscribeLeads(
  caseId: string,
  onChange: (leads: Lead[]) => void,
): Unsubscribe {
  const q = query(collection(db, 'cases', caseId, 'leads'))
  return onSnapshot(q, (snap) => {
    const leads = snap.docs.map((docSnap) => mapLead(docSnap.id, caseId, docSnap.data()))
    leads.sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime())
    onChange(leads)
  })
}

export async function createLead(
  caseId: string,
  input: {
    origin: Lead['origin']
    rawText?: string
    sourceUrl?: string
    attachmentPaths?: string[]
    capturedByUid?: string
    priority?: Lead['priority']
    claimedPoint?: Lead['claimedPoint']
    claimedDirection?: Lead['claimedDirection']
    reporter?: Lead['reporter']
    posterCode?: string
  },
): Promise<string> {
  const ref = await addDoc(collection(db, 'cases', caseId, 'leads'), {
    origin: input.origin,
    rawText: input.rawText ?? null,
    sourceUrl: input.sourceUrl ?? null,
    attachmentPaths: input.attachmentPaths ?? [],
    capturedAt: serverTimestamp(),
    capturedByUid: input.capturedByUid ?? null,
    reporter: input.reporter ?? {},
    parserSuggestions: { dates: [], locations: [], phones: [], keywords: [] },
    status: 'new',
    priority: input.priority ?? 'normal',
    claimedPoint: input.claimedPoint ?? null,
    claimedDirection: input.claimedDirection ?? null,
    posterCode: input.posterCode ?? null,
  })
  return ref.id
}

export async function updateLeadStatus(
  caseId: string,
  leadId: string,
  status: LeadStatus,
  reviewNotes?: string,
): Promise<void> {
  await updateDoc(doc(db, 'cases', caseId, 'leads', leadId), {
    status,
    reviewNotes: reviewNotes ?? null,
  })
}

function mapSighting(id: string, caseId: string, d: Record<string, unknown>): Sighting {
  return {
    id,
    caseId,
    observedAt: requireDate(d.observedAt, 'observedAt'),
    reportedAt: requireDate(d.reportedAt, 'reportedAt'),
    point: d.point as Sighting['point'],
    accuracyMeters: d.accuracyMeters as number | undefined,
    direction: (d.direction as CompassDirection) ?? 'unknown',
    movement: (d.movement as Sighting['movement']) ?? 'unknown',
    confidence: d.confidence as SightingConfidence,
    evidence: (d.evidence as Sighting['evidence']) ?? {
      leadIds: [],
      photos: [],
      sourceLinks: [],
    },
    description: (d.description as string) ?? '',
    createdByUid: d.createdByUid as string,
    reviewedByUid: d.reviewedByUid as string | undefined,
    reviewedAt: toDate(d.reviewedAt),
    affectsOfficialZone: Boolean(d.affectsOfficialZone),
  }
}

export function subscribeSightings(
  caseId: string,
  onChange: (sightings: Sighting[]) => void,
): Unsubscribe {
  const q = query(collection(db, 'cases', caseId, 'sightings'))
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((docSnap) =>
      mapSighting(docSnap.id, caseId, docSnap.data()),
    )
    items.sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime())
    onChange(items)
  })
}

export async function promoteLeadToSighting(params: {
  caseId: string
  lead: Lead
  actorUid: string
  observedAt: Date
  point: [number, number]
  direction: CompassDirection
  confidence: SightingConfidence
  description?: string
}): Promise<string> {
  const { caseId, lead, actorUid, observedAt, point, direction, confidence, description } =
    params

  const affectsOfficialZone = confidence === 'confirmed'

  const sightingRef = await addDoc(collection(db, 'cases', caseId, 'sightings'), {
    observedAt: Timestamp.fromDate(observedAt),
    reportedAt: Timestamp.fromDate(lead.capturedAt),
    point,
    direction,
    movement: direction === 'stationary' ? 'stationary' : 'unknown',
    confidence,
    evidence: {
      leadIds: [lead.id],
      photos: lead.attachmentPaths,
      sourceLinks: lead.sourceUrl ? [lead.sourceUrl] : [],
    },
    description: description ?? lead.rawText?.slice(0, 500) ?? '',
    createdByUid: actorUid,
    reviewedByUid: actorUid,
    reviewedAt: serverTimestamp(),
    affectsOfficialZone,
  })

  await updateDoc(doc(db, 'cases', caseId, 'leads', lead.id), {
    status: 'promoted',
    promotedSightingId: sightingRef.id,
  })

  await addDoc(collection(db, 'cases', caseId, 'audit'), {
    actorUid,
    action: 'sighting.promote',
    objectType: 'sighting',
    objectId: sightingRef.id,
    before: { leadStatus: lead.status },
    after: { confidence, affectsOfficialZone, leadId: lead.id },
    createdAt: serverTimestamp(),
  })

  return sightingRef.id
}

export async function listOpenLeads(caseId: string): Promise<Lead[]> {
  const q = query(
    collection(db, 'cases', caseId, 'leads'),
    where('status', 'in', ['new', 'needs_details']),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => mapLead(d.id, caseId, d.data()))
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function mapTask(id: string, caseId: string, d: Record<string, unknown>): SearchTask {
  return {
    id,
    caseId,
    title: String(d.title ?? ''),
    kind: d.kind as SearchTask['kind'],
    status: d.status as SearchTask['status'],
    priority: d.priority as SearchTask['priority'],
    notes: optionalString(d.notes),
    point: d.point as SearchTask['point'],
    assigneeUid: optionalString(d.assigneeUid),
    assigneeName: optionalString(d.assigneeName),
    createdByUid: String(d.createdByUid ?? ''),
    createdAt: toDate(d.createdAt) ?? new Date(0),
    updatedAt: toDate(d.updatedAt) ?? new Date(0),
    completedAt: toDate(d.completedAt),
  }
}

export function subscribeTasks(
  caseId: string,
  onChange: (tasks: SearchTask[]) => void,
): Unsubscribe {
  return onSnapshot(collection(db, 'cases', caseId, 'tasks'), (snap) => {
    const statusRank: Record<SearchTask['status'], number> = {
      claimed: 0,
      open: 1,
      done: 2,
    }
    const priorityRank: Record<SearchTask['priority'], number> = {
      urgent: 0,
      high: 1,
      normal: 2,
    }
    const items = snap.docs.map((item) => mapTask(item.id, caseId, item.data()))
    items.sort(
      (a, b) =>
        statusRank[a.status] - statusRank[b.status] ||
        priorityRank[a.priority] - priorityRank[b.priority] ||
        b.updatedAt.getTime() - a.updatedAt.getTime(),
    )
    onChange(items)
  })
}

export async function createTask(
  caseId: string,
  input: {
    title: string
    kind: SearchTask['kind']
    priority: SearchTask['priority']
    notes?: string
    point?: SearchTask['point']
    createdByUid: string
  },
): Promise<string> {
  const now = Timestamp.now()
  const ref = await addDoc(collection(db, 'cases', caseId, 'tasks'), {
    title: input.title.trim(),
    kind: input.kind,
    status: 'open',
    priority: input.priority,
    notes: input.notes?.trim() || null,
    point: input.point ?? null,
    assigneeUid: null,
    assigneeName: null,
    createdByUid: input.createdByUid,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  })
  return ref.id
}

export async function claimTask(
  caseId: string,
  taskId: string,
  assignee: { uid: string; displayName: string },
): Promise<void> {
  await updateDoc(doc(db, 'cases', caseId, 'tasks', taskId), {
    status: 'claimed',
    assigneeUid: assignee.uid,
    assigneeName: assignee.displayName,
    updatedAt: Timestamp.now(),
    completedAt: null,
  })
}

export async function setTaskDone(
  caseId: string,
  taskId: string,
  done: boolean,
): Promise<void> {
  const now = Timestamp.now()
  await updateDoc(doc(db, 'cases', caseId, 'tasks', taskId), {
    status: done ? 'done' : 'open',
    completedAt: done ? now : null,
    updatedAt: now,
    ...(done ? {} : { assigneeUid: null, assigneeName: null }),
  })
}

function mapSign(id: string, caseId: string, d: Record<string, unknown>): Sign {
  return {
    id,
    caseId,
    point: d.point as Sign['point'],
    placeName: optionalString(d.placeName),
    tier: d.tier as Sign['tier'],
    placeType: d.placeType as Sign['placeType'],
    status: d.status as Sign['status'],
    staffPersonallyAlerted: Boolean(d.staffPersonallyAlerted),
    notes: optionalString(d.notes),
    posterCode: optionalString(d.posterCode),
    createdByUid: String(d.createdByUid ?? ''),
    createdAt: toDate(d.createdAt) ?? new Date(0),
    updatedAt: toDate(d.updatedAt) ?? new Date(0),
    placedAt: toDate(d.placedAt),
    lastCheckedAt: toDate(d.lastCheckedAt),
  }
}

export function subscribeSigns(
  caseId: string,
  onChange: (signs: Sign[]) => void,
): Unsubscribe {
  return onSnapshot(collection(db, 'cases', caseId, 'signs'), (snap) => {
    const items = snap.docs.map((item) => mapSign(item.id, caseId, item.data()))
    items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    onChange(items)
  })
}

export async function createSign(
  caseId: string,
  input: {
    point: Sign['point']
    placeName?: string
    tier: SignTier
    placeType: SignPlaceType
    status: Sign['status']
    staffPersonallyAlerted: boolean
    notes?: string
    createdByUid: string
  },
): Promise<string> {
  const now = Timestamp.now()
  const ref = await addDoc(collection(db, 'cases', caseId, 'signs'), {
    point: input.point,
    placeName: input.placeName?.trim() || null,
    tier: input.tier,
    placeType: input.placeType,
    status: input.status,
    staffPersonallyAlerted: input.staffPersonallyAlerted,
    notes: input.notes?.trim() || null,
    posterCode: crypto.randomUUID().replaceAll('-', '').slice(0, 10),
    createdByUid: input.createdByUid,
    createdAt: now,
    updatedAt: now,
    placedAt: input.status === 'placed' ? now : null,
    lastCheckedAt: input.status === 'placed' ? now : null,
  })
  return ref.id
}

export async function updateSignStatus(
  caseId: string,
  signId: string,
  status: Sign['status'],
): Promise<void> {
  const now = Timestamp.now()
  await updateDoc(doc(db, 'cases', caseId, 'signs', signId), {
    status,
    updatedAt: now,
    lastCheckedAt: now,
    ...(status === 'placed' ? { placedAt: now } : {}),
  })
}

function mapZone(id: string, caseId: string, d: Record<string, unknown>): SearchZone {
  return {
    id,
    caseId,
    center: d.center as SearchZone['center'],
    radiusMeters: Number(d.radiusMeters),
    basisSightingId: optionalString(d.basisSightingId),
    basisObservedAt: toDate(d.basisObservedAt),
    updatedByUid: String(d.updatedByUid ?? ''),
    createdAt: toDate(d.createdAt) ?? new Date(0),
    updatedAt: toDate(d.updatedAt) ?? new Date(0),
  }
}

export function subscribeActiveZone(
  caseId: string,
  onChange: (zone: SearchZone | null) => void,
): Unsubscribe {
  return onSnapshot(doc(db, 'cases', caseId, 'zones', 'active'), (snap) => {
    onChange(snap.exists() ? mapZone(snap.id, caseId, snap.data()) : null)
  })
}

export async function setActiveZone(
  caseId: string,
  input: {
    center: SearchZone['center']
    radiusMeters: number
    basisSightingId?: string
    basisObservedAt?: Date
    updatedByUid: string
  },
): Promise<void> {
  const ref = doc(db, 'cases', caseId, 'zones', 'active')
  const existing = await getDoc(ref)
  const now = Timestamp.now()
  await setDoc(ref, {
    center: input.center,
    radiusMeters: input.radiusMeters,
    basisSightingId: input.basisSightingId ?? null,
    basisObservedAt: input.basisObservedAt
      ? Timestamp.fromDate(input.basisObservedAt)
      : null,
    updatedByUid: input.updatedByUid,
    createdAt: existing.exists() ? existing.data().createdAt : now,
    updatedAt: now,
  })
}
