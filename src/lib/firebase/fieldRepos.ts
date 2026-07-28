import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  addDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './app'
import { requireDate } from './converters'
import type {
  AvoidArea,
  CoverageCell,
  CoverageMethod,
  CoverageStatus,
  GeoJsonPolygon,
  GeoPoint,
  Sign,
  SignStatus,
  SignTier,
} from '@/domain/schemas'
import {
  findIntersectingAvoidArea,
  mergeAvoidGeometry,
  pointToCell,
  sweptToPolygon,
} from '@/lib/geo/h3Coverage'

function mapSign(id: string, caseId: string, d: Record<string, unknown>): Sign {
  return {
    id,
    caseId,
    point: d.point as GeoPoint,
    tier: (d.tier as SignTier) ?? 'C',
    status: (d.status as SignStatus) ?? 'active',
    posterCode: d.posterCode as string | undefined,
    notes: d.notes as string | undefined,
    cellId: d.cellId as string | undefined,
    createdByUid: d.createdByUid as string,
    createdAt: requireDate(d.createdAt, 'createdAt'),
    updatedAt: requireDate(d.updatedAt, 'updatedAt'),
  }
}

function mapCoverage(id: string, caseId: string, d: Record<string, unknown>): CoverageCell {
  return {
    id,
    caseId,
    status: d.status as CoverageStatus,
    coverageMethod: d.coverageMethod as CoverageMethod | undefined,
    assignedToUid: d.assignedToUid as string | undefined,
    assignedOutingId: d.assignedOutingId as string | undefined,
    updatedAt: requireDate(d.updatedAt, 'updatedAt'),
    updatedByUid: d.updatedByUid as string | undefined,
  }
}

function mapAvoidArea(id: string, caseId: string, d: Record<string, unknown>): AvoidArea {
  return {
    id,
    caseId,
    name: d.name as string,
    geometry: d.geometry as GeoJsonPolygon,
    reason: (d.reason as string | null | undefined) ?? null,
    active: Boolean(d.active),
    createdByUid: d.createdByUid as string,
    createdAt: requireDate(d.createdAt, 'createdAt'),
    updatedAt: requireDate(d.updatedAt, 'updatedAt'),
  }
}

async function writeAudit(
  caseId: string,
  input: {
    actorUid: string
    action: string
    objectType: string
    objectId: string
    before?: Record<string, unknown>
    after?: Record<string, unknown>
  },
): Promise<void> {
  await addDoc(collection(db, 'cases', caseId, 'audit'), {
    ...input,
    before: input.before ?? null,
    after: input.after ?? null,
    createdAt: serverTimestamp(),
  })
}

export function subscribeSigns(
  caseId: string,
  onChange: (signs: Sign[]) => void,
): Unsubscribe {
  return onSnapshot(collection(db, 'cases', caseId, 'signs'), (snap) => {
    const items = snap.docs.map((d) => mapSign(d.id, caseId, d.data()))
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    onChange(items)
  })
}

export function subscribeCoverage(
  caseId: string,
  onChange: (cells: CoverageCell[]) => void,
): Unsubscribe {
  return onSnapshot(collection(db, 'cases', caseId, 'coverage'), (snap) => {
    onChange(snap.docs.map((d) => mapCoverage(d.id, caseId, d.data())))
  })
}

export function subscribeAvoidAreas(
  caseId: string,
  onChange: (areas: AvoidArea[]) => void,
): Unsubscribe {
  return onSnapshot(collection(db, 'cases', caseId, 'avoidAreas'), (snap) => {
    onChange(snap.docs.map((d) => mapAvoidArea(d.id, caseId, d.data())))
  })
}

export async function getActiveAvoidAreas(caseId: string): Promise<AvoidArea[]> {
  const snap = await getDocs(collection(db, 'cases', caseId, 'avoidAreas'))
  return snap.docs
    .map((d) => mapAvoidArea(d.id, caseId, d.data()))
    .filter((a) => a.active)
}

export async function createSign(params: {
  caseId: string
  point: GeoPoint
  actorUid: string
  tier?: SignTier
  notes?: string
  posterCode?: string
}): Promise<string> {
  const cellId = pointToCell(params.point)
  const ref = await addDoc(collection(db, 'cases', params.caseId, 'signs'), {
    point: params.point,
    tier: params.tier ?? 'C',
    status: 'active',
    posterCode: params.posterCode ?? null,
    notes: params.notes ?? null,
    cellId,
    createdByUid: params.actorUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  await upsertCoverageCell({
    caseId: params.caseId,
    cellId,
    status: 'signed',
    method: 'signs',
    actorUid: params.actorUid,
  })
  await writeAudit(params.caseId, {
    actorUid: params.actorUid,
    action: 'sign.created',
    objectType: 'sign',
    objectId: ref.id,
    after: { point: params.point, cellId, tier: params.tier ?? 'C' },
  })
  return ref.id
}

export async function upsertCoverageCell(params: {
  caseId: string
  cellId: string
  status: CoverageStatus
  method?: CoverageMethod
  actorUid: string
}): Promise<void> {
  const ref = doc(db, 'cases', params.caseId, 'coverage', params.cellId)
  await setDoc(
    ref,
    {
      status: params.status,
      coverageMethod: params.method ?? 'walk',
      updatedAt: serverTimestamp(),
      updatedByUid: params.actorUid,
    },
    { merge: true },
  )
}

export async function paintCoverageCells(params: {
  caseId: string
  cellIds: string[]
  actorUid: string
  status?: CoverageStatus
}): Promise<void> {
  const status = params.status ?? 'walked'
  await Promise.all(
    params.cellIds.map((cellId) =>
      upsertCoverageCell({
        caseId: params.caseId,
        cellId,
        status,
        method: 'walk',
        actorUid: params.actorUid,
      }),
    ),
  )
}

export async function createAvoidArea(params: {
  caseId: string
  name: string
  geometry: GeoJsonPolygon
  actorUid: string
  reason?: string | null
}): Promise<string> {
  const ref = await addDoc(collection(db, 'cases', params.caseId, 'avoidAreas'), {
    name: params.name,
    geometry: params.geometry,
    reason: params.reason ?? null,
    active: true,
    createdByUid: params.actorUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  await writeAudit(params.caseId, {
    actorUid: params.actorUid,
    action: 'avoidArea.created',
    objectType: 'avoidArea',
    objectId: ref.id,
    after: { name: params.name },
  })
  return ref.id
}

export async function updateAvoidAreaGeometry(params: {
  caseId: string
  areaId: string
  geometry: GeoJsonPolygon
  actorUid: string
}): Promise<void> {
  await updateDoc(doc(db, 'cases', params.caseId, 'avoidAreas', params.areaId), {
    geometry: params.geometry,
    updatedAt: serverTimestamp(),
  })
  await writeAudit(params.caseId, {
    actorUid: params.actorUid,
    action: 'avoidArea.merged',
    objectType: 'avoidArea',
    objectId: params.areaId,
  })
}

export async function deactivateAvoidArea(params: {
  caseId: string
  areaId: string
  actorUid: string
}): Promise<void> {
  await updateDoc(doc(db, 'cases', params.caseId, 'avoidAreas', params.areaId), {
    active: false,
    updatedAt: serverTimestamp(),
  })
  await writeAudit(params.caseId, {
    actorUid: params.actorUid,
    action: 'avoidArea.deactivated',
    objectType: 'avoidArea',
    objectId: params.areaId,
  })
}

/** Risk-mode stop: H3 cells → polygon → merge or create avoidArea. */
export async function commitRiskSweep(params: {
  caseId: string
  cellIds: string[]
  actorUid: string
}): Promise<{ areaId: string; merged: boolean } | null> {
  const swept = sweptToPolygon(params.cellIds)
  if (!swept) return null

  const existing = await getActiveAvoidAreas(params.caseId)
  const match = findIntersectingAvoidArea(existing, swept)

  if (match) {
    const geometry = mergeAvoidGeometry(match.geometry, swept)
    await updateAvoidAreaGeometry({
      caseId: params.caseId,
      areaId: match.id,
      geometry,
      actorUid: params.actorUid,
    })
    return { areaId: match.id, merged: true }
  }

  const areaId = await createAvoidArea({
    caseId: params.caseId,
    name: `Zona a evitar ${existing.length + 1}`,
    geometry: swept,
    actorUid: params.actorUid,
    reason: null,
  })
  return { areaId, merged: false }
}
