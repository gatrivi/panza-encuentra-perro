import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, GoogleAuthProvider } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'
import { connectStorageEmulator, getStorage } from 'firebase/storage'
import { firebaseWebConfig } from './config'

export const app = initializeApp(firebaseWebConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app, 'southamerica-east1')
export const googleProvider = new GoogleAuthProvider()

const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true'

let emulatorsConnected = false

export function connectEmulatorsIfNeeded() {
  if (!useEmulators || emulatorsConnected) return
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
  connectFunctionsEmulator(functions, '127.0.0.1', 5001)
  emulatorsConnected = true
}

export const defaultCaseSlug = (import.meta.env.VITE_CASE_SLUG as string) || 'pancite'
