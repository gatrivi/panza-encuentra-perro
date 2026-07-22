import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
  addDoc,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './app'
import { requireDate, toDate } from './converters'
import type {
  Case,
  Lead,
  LeadStatus,
  Member,
  PublicCase,
  Sighting,
  SightingConfidence,
  CompassDirection,
} from '@/domain/schemas'

export async function getPublicCase(slug: string): Promise<PublicCase | null> {
  const snap = await getDoc(doc(db, 'publicCases', slug))
  if (!snap.exists()) return null
  const d = snap.data()
  return {
    slug: snap.id,
    caseId: d.caseId,
    status: d.status,
    animal: d.animal,
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
  return {
    id: snap.id,
    slug: d.slug,
    status: d.status,
    animal: d.animal,
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

export async function findActiveMembership(uid: string): Promise<{
  caseId: string
  member: Member
} | null> {
  // ponytail: MVP = one case per deployment; collectionGroup later for multi-case
  const caseSlug = import.meta.env.VITE_CASE_SLUG || 'pancite'
  const publicSnap = await getDoc(doc(db, 'publicCases', caseSlug))
  if (!publicSnap.exists()) return null
  const caseId = publicSnap.data().caseId as string
  const member = await getMember(caseId, uid)
  if (!member || !member.active) return null
  return { caseId, member }
}

export async function bootstrapOwnerIfNeeded(
  _uid: string,
  email: string,
  _displayName: string,
  bootstrapEmail: string | undefined,
): Promise<Member | null> {
  if (!bootstrapEmail || email.toLowerCase() !== bootstrapEmail.toLowerCase()) {
    return null
  }
  const claim = httpsCallable(functions, 'claimOwnerBootstrap')
  const result = await claim({ slug: import.meta.env.VITE_CASE_SLUG || 'pancite' })
  const data = result.data as { caseId?: string }
  if (!data.caseId) return null
  return getMember(data.caseId, _uid)
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
