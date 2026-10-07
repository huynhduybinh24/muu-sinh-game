import type { StateStorage } from 'zustand/middleware'
import { SAVE_KEY, RECOVERY_KEY, SAVE_FORMAT, SAVE_VERSION } from '../data/save'
import { createPortableSave, isSaveRecord, migrateImportedSave } from './portableSave'
import { migratePersistedProgress } from './saveMigration'
import type { PortableSave, SaveRepository } from '../types/save'

export type StorageHealth = 'saved' | 'unavailable' | 'corrupted' | 'recovered' | 'newer'
let health: StorageHealth = 'saved'
let paused = false
const listeners = new Set<() => void>()
export const getStorageHealth = () => health
export const subscribeStorageHealth = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
export function setStorageHealth(next: StorageHealth): void {
  if (health === next) return
  health = next
  listeners.forEach((listener) => { try { listener() } catch { /* Status observers cannot invalidate a save commit. */ } })
}
export function withoutPersistWrites<T>(action: () => T): T {
  const previous = paused
  paused = true
  try { return action() } finally { paused = previous }
}

/** The only adapter that knows Zustand's local wrapper. Cloud transports can store the envelope directly. */
export class LocalStorageSaveAdapter implements SaveRepository {
  private readonly storage: () => Storage
  constructor(storage: () => Storage = () => localStorage) { this.storage = storage }
  read(): string | null {
    const raw = this.storage().getItem(SAVE_KEY)
    if (raw === null) return null
    const value: unknown = JSON.parse(raw)
    if (!isSaveRecord(value) || !isSaveRecord(value.state) || typeof value.version !== 'number') throw new Error('invalid-local-save')
    return JSON.stringify({ format: SAVE_FORMAT, version: value.version, exportedAt: new Date().toISOString(), data: value.state })
  }
  write(save: PortableSave): void {
    const validation = migrateImportedSave(save)
    if (!validation.ok) throw new Error('invalid-save')
    this.storage().setItem(SAVE_KEY, JSON.stringify({ state: validation.save.data, version: SAVE_VERSION }))
  }
  writeRecovery(save: PortableSave): void { this.storage().setItem(RECOVERY_KEY, JSON.stringify(save)) }
  readRecovery(): string | null { return this.storage().getItem(RECOVERY_KEY) }
}
export const localSaveRepository = new LocalStorageSaveAdapter()

function recoverLocal(): string | null {
  try {
    const recovery = migrateImportedSave(localSaveRepository.readRecovery())
    if (recovery.ok) {
      setStorageHealth('recovered')
      return JSON.stringify({ state: recovery.save.data, version: SAVE_VERSION })
    }
  } catch { /* A blocked recovery slot must not crash startup. */ }
  return null
}
/** Safe persistence transport; failed writes leave gameplay usable in memory, with an honest health indicator. */
export const gameStateStorage: StateStorage = {
  getItem: (key) => {
    let raw: string | null
    try { raw = localStorage.getItem(key) } catch { setStorageHealth('unavailable'); return null }
    if (raw === null) { setStorageHealth('saved'); return null }
    try {
      const value: unknown = JSON.parse(raw)
      if (!isSaveRecord(value) || !isSaveRecord(value.state) || typeof value.version !== 'number' || !Number.isInteger(value.version) || value.version < 0) throw new Error('invalid-local-save')
      if (value.version > SAVE_VERSION) { setStorageHealth('newer'); return null }
      // Preserve normalized legacy progress before the existing middleware migrates it.
      if (value.version < SAVE_VERSION) {
        try { localSaveRepository.writeRecovery(createPortableSave(migratePersistedProgress(value.state, value.version))) }
        catch { setStorageHealth('unavailable') }
      } else setStorageHealth('saved')
      return raw
    } catch {
      setStorageHealth('corrupted')
      return recoverLocal()
    }
  },
  setItem: (key, value) => {
    if (paused || health === 'corrupted' || health === 'newer') return
    try {
      localStorage.setItem(key, value)
      if (health !== 'recovered') setStorageHealth('saved')
    } catch { setStorageHealth('unavailable') }
  },
  removeItem: (key) => {
    try { localStorage.removeItem(key) } catch { setStorageHealth('unavailable') }
  },
}
