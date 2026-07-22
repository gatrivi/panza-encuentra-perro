import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { auth, connectEmulatorsIfNeeded } from '@/lib/firebase/app'
import { findActiveMembership, joinCaseIfNeeded } from '@/lib/firebase/repos'
import { resolveOperator } from '@/lib/operators'
import type { Member } from '@/domain/schemas'
import { t } from '@/i18n/es-AR'
import { AuthContext } from './auth-context'

const USERNAME_KEY = 'panza.username'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [caseId, setCaseId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    connectEmulatorsIfNeeded()
    void setPersistence(auth, browserLocalPersistence)
    return onAuthStateChanged(auth, async (next) => {
      setLoading(true)
      setError(null)
      setUser(next)
      if (!next) {
        setMember(null)
        setCaseId(null)
        setLoading(false)
        return
      }
      try {
        let membership = await findActiveMembership(next.uid)
        if (!membership) {
          if (!next.email) {
            setError(t().auth.needInvite)
            setLoading(false)
            return
          }
          await joinCaseIfNeeded(next.uid, {
            email: next.email,
            displayName: next.displayName,
          })
          membership = await findActiveMembership(next.uid)
        }
        if (!membership) {
          setMember(null)
          setCaseId(null)
          setError(t().auth.needInvite)
        } else {
          setMember(membership.member)
          setCaseId(membership.caseId)
        }
      } catch (e) {
        console.error(e)
        setError(t().errors.generic)
      } finally {
        setLoading(false)
      }
    })
  }, [])

  const signInWithUsername = useCallback(async (username: string, password: string) => {
    setError(null)
    const op = resolveOperator(username)
    if (!op) {
      setError(t().auth.unknownUser)
      return
    }
    localStorage.setItem(USERNAME_KEY, op.username)
    await setPersistence(auth, browserLocalPersistence)
    try {
      await signInWithEmailAndPassword(auth, op.email, password)
    } catch {
      try {
        await createUserWithEmailAndPassword(auth, op.email, password)
      } catch (e) {
        const code = (e as { code?: string }).code
        if (code === 'auth/email-already-in-use') {
          setError(t().auth.badPassword)
          return
        }
        console.error(e)
        setError(t().errors.generic)
      }
    }
  }, [])

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth)
  }, [])

  const value = useMemo(
    () => ({
      user,
      member,
      caseId,
      loading,
      error,
      rememberedUsername: localStorage.getItem(USERNAME_KEY) ?? '',
      signInWithUsername,
      signOut,
    }),
    [user, member, caseId, loading, error, signInWithUsername, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
