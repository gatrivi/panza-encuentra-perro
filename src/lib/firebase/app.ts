import { initializeApp } from 'firebase/app'
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { connectStorageEmulator, getStorage } from 'firebase/storage'
import { firebaseWebConfig } from './config'

export const app = initializeApp(firebaseWebConfig)

const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true'

// Sonnet: persistentLocalCache = cola offline + sync al reconectar (reemplaza sync propio).
// Emulator: memory default — IndexedDB + emulator se pisan.
export const db = useEmulators
  ? getFirestore(app)
  : initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })

export const storage = getStorage(app)

let emulatorsConnected = false

export function connectEmulatorsIfNeeded() {
  if (!useEmulators || emulatorsConnected) return
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
  emulatorsConnected = true
}

export const defaultCaseSlug = (import.meta.env.VITE_CASE_SLUG as string) || 'pancita'
