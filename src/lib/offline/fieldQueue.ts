/**
 * Offline queue for field actions (coverage paint, signs, risk sweeps).
 * Syncs when online — same pattern as intake drafts.
 */
import { get, set, del, keys } from 'idb-keyval'
import type { GeoPoint } from '@/domain/schemas'

export type FieldAction =
  | {
      id: string
      kind: 'coverage_paint'
      caseId: string
      cellIds: string[]
      actorUid: string
      createdAt: string
    }
  | {
      id: string
      kind: 'place_sign'
      caseId: string
      point: GeoPoint
      actorUid: string
      createdAt: string
    }
  | {
      id: string
      kind: 'risk_sweep'
      caseId: string
      cellIds: string[]
      actorUid: string
      createdAt: string
    }

const PREFIX = 'field-action:'

export function newFieldActionId(): string {
  return `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export async function enqueueFieldAction(
  action:
    | Omit<Extract<FieldAction, { kind: 'coverage_paint' }>, 'id' | 'createdAt'>
    | Omit<Extract<FieldAction, { kind: 'place_sign' }>, 'id' | 'createdAt'>
    | Omit<Extract<FieldAction, { kind: 'risk_sweep' }>, 'id' | 'createdAt'>
    | FieldAction,
): Promise<string> {
  const id = 'id' in action && action.id ? action.id : newFieldActionId()
  const full = {
    ...action,
    id,
    createdAt:
      'createdAt' in action && action.createdAt
        ? action.createdAt
        : new Date().toISOString(),
  } as FieldAction
  await set(PREFIX + id, full)
  return id
}

export async function listFieldActions(): Promise<FieldAction[]> {
  const allKeys = await keys()
  const actionKeys = allKeys.filter(
    (k) => typeof k === 'string' && k.startsWith(PREFIX),
  ) as string[]
  const items = await Promise.all(actionKeys.map((k) => get<FieldAction>(k)))
  return (items.filter(Boolean) as FieldAction[]).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  )
}

export async function removeFieldAction(id: string): Promise<void> {
  await del(PREFIX + id)
}

async function applyAction(action: FieldAction): Promise<void> {
  const { commitRiskSweep, createSign, paintCoverageCells } = await import(
    '@/lib/firebase/fieldRepos'
  )
  if (action.kind === 'coverage_paint') {
    await paintCoverageCells({
      caseId: action.caseId,
      cellIds: action.cellIds,
      actorUid: action.actorUid,
    })
  } else if (action.kind === 'place_sign') {
    await createSign({
      caseId: action.caseId,
      point: action.point,
      actorUid: action.actorUid,
    })
  } else {
    await commitRiskSweep({
      caseId: action.caseId,
      cellIds: action.cellIds,
      actorUid: action.actorUid,
    })
  }
}

/** Try sync now; leave failed items in queue. */
export async function flushFieldActions(): Promise<{ ok: number; failed: number }> {
  if (!navigator.onLine) return { ok: 0, failed: 0 }
  const actions = await listFieldActions()
  let ok = 0
  let failed = 0
  for (const action of actions) {
    try {
      await applyAction(action)
      await removeFieldAction(action.id)
      ok++
    } catch {
      failed++
    }
  }
  return { ok, failed }
}

/** Run action online or enqueue. */
export async function runOrEnqueue(
  action:
    | Omit<Extract<FieldAction, { kind: 'coverage_paint' }>, 'id' | 'createdAt'>
    | Omit<Extract<FieldAction, { kind: 'place_sign' }>, 'id' | 'createdAt'>
    | Omit<Extract<FieldAction, { kind: 'risk_sweep' }>, 'id' | 'createdAt'>,
): Promise<void> {
  if (!navigator.onLine) {
    await enqueueFieldAction(action)
    return
  }
  try {
    await applyAction({
      ...action,
      id: newFieldActionId(),
      createdAt: new Date().toISOString(),
    } as FieldAction)
  } catch {
    await enqueueFieldAction(action)
  }
}
