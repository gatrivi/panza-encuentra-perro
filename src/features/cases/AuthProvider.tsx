import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { connectEmulatorsIfNeeded } from '@/lib/firebase/app'
import { ensureOperatorMember, ensurePanzaCase } from '@/lib/firebase/repos'
import { checkFamilyLogin, resolveOperator } from '@/lib/operators'
import type { Member } from '@/domain/schemas'
import { t } from '@/i18n/es-AR'
import { AuthContext, type SessionUser } from './auth-context'

const SESSION_KEY = 'panza.session'
const USERNAME_KEY = 'panza.username'

type StoredSession = { username: string }

function readStoredUsername(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StoredSession
      if (parsed?.username && resolveOperator(parsed.username)) return parsed.username
    }
  } catch {
    /* ignore */
  }
  const legacy = localStorage.getItem(USERNAME_KEY)
  return legacy && resolveOperator(legacy) ? legacy : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [caseId, setCaseId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const hydrate = useCallback(async (username: string) => {
    const op = resolveOperator(username)
    if (!op) throw new Error('unknown operator')
    const id = await ensurePanzaCase()
    const m = await ensureOperatorMember(id, op)
    setUser({ uid: op.username })
    setMember(m)
    setCaseId(id)
  }, [])

  useEffect(() => {
    connectEmulatorsIfNeeded()
    const username = readStoredUsername()
    if (!username) {
      setLoading(false)
      return
    }
    void hydrate(username)
      .catch((e) => {
        console.error(e)
        localStorage.removeItem(SESSION_KEY)
        setError(t().errors.generic)
      })
      .finally(() => setLoading(false))
  }, [hydrate])

  const signInWithUsername = useCallback(
    async (username: string, password: string) => {
      setError(null)
      const op = checkFamilyLogin(username, password)
      if (!op) {
        setError(resolveOperator(username) ? t().auth.badPassword : t().auth.unknownUser)
        return
      }
      localStorage.setItem(USERNAME_KEY, op.username)
      localStorage.setItem(SESSION_KEY, JSON.stringify({ username: op.username } satisfies StoredSession))
      setLoading(true)
      try {
        await hydrate(op.username)
      } catch (e) {
        console.error(e)
        setError(t().errors.generic)
      } finally {
        setLoading(false)
      }
    },
    [hydrate],
  )

  const signOut = useCallback(async () => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
    setMember(null)
    setCaseId(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      member,
      caseId,
      loading,
      error,
      signInWithUsername,
      signOut,
    }),
    [user, member, caseId, loading, error, signInWithUsername, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
