import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import {
  auth,
  connectEmulatorsIfNeeded,
  googleProvider,
  ownerBootstrapEmail,
} from '@/lib/firebase/app'
import { bootstrapOwnerIfNeeded, findActiveMembership } from '@/lib/firebase/repos'
import type { Member } from '@/domain/schemas'
import { t } from '@/i18n/es-AR'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [caseId, setCaseId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    connectEmulatorsIfNeeded()
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
        if (!membership && next.email) {
          const bootstrapped = await bootstrapOwnerIfNeeded(
            next.uid,
            next.email,
            next.displayName || next.email,
            ownerBootstrapEmail,
          )
          if (bootstrapped) {
            membership = await findActiveMembership(next.uid)
          }
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

  const signInGoogle = useCallback(async () => {
    setError(null)
    await signInWithPopup(auth, googleProvider)
  }, [])

  const signInDemo = useCallback(async (email: string, password: string) => {
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch {
      await createUserWithEmailAndPassword(auth, email, password)
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
      signInGoogle,
      signInDemo,
      signOut,
    }),
    [user, member, caseId, loading, error, signInGoogle, signInDemo, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
