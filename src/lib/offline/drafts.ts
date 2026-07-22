import { get, set, del, keys } from 'idb-keyval'

export type IntakeDraft = {
  id: string
  createdAt: string
  rawText?: string
  sourceUrl?: string
  /** object URL or data URL preview — not uploaded yet */
  localImageKey?: string
  imageBlob?: Blob
  status: 'draft' | 'uploading' | 'synced' | 'error'
  error?: string
  remoteLeadId?: string
}

const PREFIX = 'intake-draft:'

export async function saveDraft(draft: IntakeDraft): Promise<void> {
  await set(PREFIX + draft.id, draft)
}

export async function getDraft(id: string): Promise<IntakeDraft | undefined> {
  return get(PREFIX + id)
}

export async function listDrafts(): Promise<IntakeDraft[]> {
  const allKeys = await keys()
  const draftKeys = allKeys.filter(
    (k) => typeof k === 'string' && k.startsWith(PREFIX),
  ) as string[]
  const drafts = await Promise.all(draftKeys.map((k) => get<IntakeDraft>(k)))
  return drafts.filter(Boolean) as IntakeDraft[]
}

export async function removeDraft(id: string): Promise<void> {
  await del(PREFIX + id)
}

export function newDraftId(): string {
  return `d_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}
