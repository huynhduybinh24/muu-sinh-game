import { RESET_CONFIRMATION, MAX_BACKUP_BYTES } from '../data/save'
import { getBackupFilename, migrateImportedSave, serializeSave, createPortableSave } from './portableSave'
import { migratePersistedProgress } from './saveMigration'
import { localSaveRepository, setStorageHealth, withoutPersistWrites } from './saveStorage'
import { useProgressStore } from '../store/progressStore'
import type { ImportedSave, PlayerSaveData, SaveError, SaveRepository } from '../types/save'
import { isNativePlatform } from './platform'
import { saveNativeFile } from './nativeFiles'

export { serializeSave, validateSave, migrateImportedSave, getBackupFilename } from './portableSave'
export const saveErrorMessage = (error: SaveError): string => ({
  invalid: 'File sao lưu không hợp lệ.',
  future: 'File sao lưu được tạo bởi phiên bản game mới hơn.',
  storage: 'Chưa thể lưu dữ liệu trên thiết bị. Dữ liệu hiện tại được giữ nguyên.',
})[error]
export async function readBackupFile(file: File): Promise<ImportedSave> {
  if (file.size > MAX_BACKUP_BYTES) return { ok: false, error: 'invalid' }
  try { return migrateImportedSave(await file.text()) } catch { return { ok: false, error: 'invalid' } }
}
export async function downloadSaveBackup(): Promise<boolean> {
  const data = serializeSave(useProgressStore.getState())
  if (isNativePlatform()) {
    const outcome = await saveNativeFile(new Blob([data], { type: 'application/json' }), getBackupFilename())
    if (outcome === 'unsupported') throw new Error('native-file-export-unavailable')
    return outcome !== 'cancelled'
  }
  const url = URL.createObjectURL(new Blob([data], { type: 'application/json;charset=utf-8' }))
  try {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = getBackupFilename()
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
  } finally { window.setTimeout(() => URL.revokeObjectURL(url), 1000) }
  return true
}
export async function copySaveBackup(): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) return false
    await navigator.clipboard.writeText(serializeSave(useProgressStore.getState()))
    return true
  } catch { return false }
}
type SaveOperation = { ok: true } | { ok: false; error: SaveError }
function applyAtomicSave(data: PlayerSaveData, repository: SaveRepository): SaveOperation {
  // Deep normalized snapshot plus original actions; one synchronous turn, no partial file-selection restore.
  const original = useProgressStore.getState()
  const snapshot = createPortableSave(original)
  try {
    repository.writeRecovery(snapshot)
    withoutPersistWrites(() => {
      useProgressStore.setState(data)
      // localStorage setItem is atomic. Commit only after the in-memory replacement succeeds.
      repository.write(createPortableSave(data))
    })
    setStorageHealth('saved')
    return { ok: true }
  } catch {
    // setState updates state before subscribers; rollback even if a subscriber throws.
    try { withoutPersistWrites(() => useProgressStore.setState(original, true)) }
    catch { /* State is already restored before a faulty subscriber runs. */ }
    setStorageHealth('unavailable')
    return { ok: false, error: 'storage' }
  }
}
export function restoreSave(input: unknown, repository: SaveRepository = localSaveRepository): SaveOperation {
  const imported = migrateImportedSave(input)
  return imported.ok ? applyAtomicSave(imported.save.data, repository) : imported
}
export function resetSave(confirmation: string, repository: SaveRepository = localSaveRepository): SaveOperation {
  if (confirmation.trim().normalize('NFC') !== RESET_CONFIRMATION) return { ok: false, error: 'invalid' }
  return applyAtomicSave(migratePersistedProgress(undefined), repository)
}
/** Internal/dev recovery entry. UI intentionally offers only clear file-based restore. */
export function recoverSave(repository: SaveRepository = localSaveRepository): SaveOperation {
  try { return restoreSave(repository.readRecovery(), repository) } catch { return { ok: false, error: 'storage' } }
}
