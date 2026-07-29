import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { OPERATORS, resolveOperator, type OperatorUsername } from '@/lib/operators'
import { PANZA_CASE_ID } from '@/lib/panzaCase'
import type { Member } from '@/domain/schemas'
import { t } from '@/i18n/es-AR'
import { AuthContext, type SessionUser } from './auth-context'

const DEFAULT_USERNAME: OperatorUsername = 'gaston'
const CASE_CACHE_KEY = 'panza.caseId'
const OP_CACHE_KEY = 'panza.operator'

function readCachedOperator(): OperatorUsername {
  try {
    const v = localStorage.getItem(OP_CACHE_KEY)
    const op = v ? resolveOperator(v) : null
    if (op) return op.username as OperatorUsername
  } catch {
    /* ignore */
  }
  return DEFAULT_USERNAME
}

function stubMember(username: OperatorUsername): Member {
  const op = OPERATORS[username]
  return {
    uid: op.username,
    role: op.role,
    displayName: op.displayName,
    email: `${op.username}@panza.local`,
    active: true,
    createdAt: new Date(),
    lastSeenAt: new Date(),
  }
}

function readCachedCaseId(): string {
  try {
    return localStorage.getItem(CASE_CACHE_KEY) || PANZA_CASE_ID
  } catch {
    return PANZA_CASE_ID
  }
}

/** Boot instantáneo: UI ya; Firebase en dynamic import. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [caseId, setCaseId] = useState(() => readCachedCaseId())
  const [opKey, setOpKey] = useState<OperatorUsername>(() => readCachedOperator())
  const [user, setUser] = useState<SessionUser>(() => ({ uid: readCachedOperator() }))
  const [member, setMember] = useState<Member>(() => stubMember(readCachedOperator()))
  const [loading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const { connectEmulatorsIfNeeded } = await import('@/lib/firebase/app')
          const { ensureOperatorMember, ensurePanzaCase } = await import(
            '@/lib/firebase/repos'
          )
          connectEmulatorsIfNeeded()
          const id = await ensurePanzaCase()
          if (cancelled) return
          localStorage.setItem(CASE_CACHE_KEY, id)
          setCaseId(id)
          const m = await ensureOperatorMember(id, OPERATORS[opKey])
          if (!cancelled) setMember(m)
        } catch (e) {
          console.error(e)
          if (!cancelled) setError(t().errors.generic)
        }
      })()
    }, 2_000)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [opKey])

  const switchOperator = useCallback(async (username: string) => {
    const op = resolveOperator(username)
    if (!op) return
    const key = op.username as OperatorUsername
    try {
      localStorage.setItem(OP_CACHE_KEY, key)
    } catch {
      /* ignore */
    }
    setOpKey(key)
    setUser({ uid: key })
    setMember(stubMember(key))
  }, [])

  const boot = useCallback(async () => {
    /* no-op: always on */
  }, [])

  const value = useMemo(
    () => ({
      user,
      member,
      caseId,
      loading,
      error,
      signInWithUsername: boot,
      switchOperator,
      signOut: boot,
    }),
    [user, member, caseId, loading, error, boot, switchOperator],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
