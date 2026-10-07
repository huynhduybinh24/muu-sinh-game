import type { PlayerPreferences, PlayerProgress } from './game'

export type PlayerSaveData = PlayerProgress & PlayerPreferences
export interface PortableSave {
  format: 'muu-sinh-save'
  version: number
  exportedAt: string
  data: PlayerSaveData
}
export type SaveError = 'invalid' | 'future' | 'storage'
export type SaveValidation = { ok: true; version: number; exportedAt: string; data: Record<string, unknown> }
  | { ok: false; error: SaveError }
export type ImportedSave = { ok: true; save: PortableSave } | { ok: false; error: SaveError }
export interface SaveRepository {
  read(): string | null
  write(save: PortableSave): void
  writeRecovery(save: PortableSave): void
  readRecovery(): string | null
}
