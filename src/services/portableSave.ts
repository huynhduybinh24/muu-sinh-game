import { SAVE_FORMAT, SAVE_VERSION, MAX_BACKUP_BYTES } from '../data/save'
import { isLocalDateKey, getLocalDateKey } from './dailyChallenge'
import { migratePersistedProgress } from './saveMigration'
import { getPlayerNameError } from './playerProfile'
import type { ImportedSave, PlayerSaveData, PortableSave, SaveValidation } from '../types/save'

export const isSaveRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const numberFields = ['money', 'reputation', 'energy', 'currentStreak', 'bestStreak', 'totalDaysWorked', 'totalGamesPlayed',
  'totalMoneyEarned', 'totalMoneySpent', 'xp', 'totalDailyMissionsClaimed', 'dailyRewardStreak', 'dailyRewardCycleDay'] as const
const numeric = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER
const strings = (value: unknown, limit = 256) => Array.isArray(value) && value.length <= limit && value.every((id: unknown) => typeof id === 'string' && id.length <= 80)
export const saveDateValid = (value: unknown): value is string => typeof value === 'string' && value.length <= 40
  && isLocalDateKey(value.slice(0, 10)) && Number.isFinite(Date.parse(value))
const dateOrNull = (value: unknown) => value === null || (typeof value === 'string' && isLocalDateKey(value))

function validatePayload(data: Record<string, unknown>, version: number): boolean {
  if (!numeric(data.money)) return false
  if (version === SAVE_VERSION && Object.keys(migratePersistedProgress(undefined)).some((key) => !Object.hasOwn(data, key))) return false
  for (const key of numberFields) if (key in data && !numeric(data[key])) return false
  if (version >= 4 && (!numeric(data.xp) || !numeric(data.totalMoneySpent) || !strings(data.ownedItemIds))) return false
  for (const key of ['completedJobs', 'completedTutorials', 'ownedItemIds']) if (key in data && !strings(data[key])) return false
  for (const key of ['currentJobId', 'previousJobId']) if (key in data && data[key] !== null && typeof data[key] !== 'string') return false
  for (const key of ['lastCompletedDate', 'lastDailyRewardDate']) if (key in data && !dateOrNull(data[key])) return false
  if ('soundEnabled' in data && typeof data.soundEnabled !== 'boolean') return false
  if (version >= 3 || 'profile' in data) {
    const profile = data.profile
    if (!isSaveRecord(profile) || typeof profile.playerName !== 'string' || (profile.playerName !== '' && getPlayerNameError(profile.playerName))) return false
    if (profile.createdAt !== '' && !saveDateValid(profile.createdAt)) return false
    if (!isSaveRecord(profile.appearance) || Object.values(profile.appearance).some((value) => typeof value !== 'string')) return false
    if ('lifestyle' in profile) {
      const life = profile.lifestyle
      const selections = (value: unknown) => isSaveRecord(value) && Object.keys(value).length <= 16
        && Object.values(value).every(id => id === null || (typeof id === 'string' && id.length <= 80))
      if (!isSaveRecord(life) || !selections(life.equipment) || !selections(life.room)) return false
      for (const key of ['phone', 'computer', 'vehicle']) if (life[key] !== null && (typeof life[key] !== 'string' || String(life[key]).length > 80)) return false
    }
  }
  if ('jobStats' in data) {
    if (!isSaveRecord(data.jobStats) || Object.keys(data.jobStats).length > 64) return false
    for (const stats of Object.values(data.jobStats)) {
      if (!isSaveRecord(stats) || ['timesPlayed', 'bestScore', 'totalScore', 'totalMoneyEarned'].some((key) => !numeric(stats[key]))) return false
    }
  }
  if ('achievements' in data) {
    if (!Array.isArray(data.achievements) || data.achievements.length > 256) return false
    for (const unlock of data.achievements) if (!isSaveRecord(unlock) || typeof unlock.id !== 'string' || !saveDateValid(unlock.unlockedAt)) return false
  }
  if ('dailyMissions' in data && data.dailyMissions !== null) {
    const daily = data.dailyMissions
    if (!isSaveRecord(daily) || typeof daily.dateKey !== 'string' || !isLocalDateKey(daily.dateKey) || !Array.isArray(daily.missions) || daily.missions.length > 16) return false
    for (const mission of daily.missions) {
      if (!isSaveRecord(mission) || typeof mission.id !== 'string' || !numeric(mission.progress) || typeof mission.claimed !== 'boolean') return false
    }
  }
  if ('dailyRewardCycleDay' in data && (!Number.isInteger(data.dailyRewardCycleDay) || Number(data.dailyRewardCycleDay) < 1 || Number(data.dailyRewardCycleDay) > 7)) return false
  return true
}
export function validateSave(input: unknown): SaveValidation {
  try {
    let value: unknown = input
    if (typeof input === 'string') {
      if (new TextEncoder().encode(input).byteLength > MAX_BACKUP_BYTES) return { ok: false, error: 'invalid' }
      value = JSON.parse(input.replace(/^\uFEFF/, ''), (key, entry: unknown) => {
        if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('unsafe-key')
        return entry
      })
    }
    if (!isSaveRecord(value) || value.format !== SAVE_FORMAT || typeof value.version !== 'number' || !Number.isInteger(value.version) || value.version < 0) return { ok: false, error: 'invalid' }
    if (value.version > SAVE_VERSION) return { ok: false, error: 'future' }
    if (!saveDateValid(value.exportedAt) || !isSaveRecord(value.data) || !validatePayload(value.data, value.version)) return { ok: false, error: 'invalid' }
    return { ok: true, version: value.version, exportedAt: value.exportedAt, data: value.data }
  } catch { return { ok: false, error: 'invalid' } }
}
export function migrateImportedSave(input: unknown): ImportedSave {
  const validation = validateSave(input)
  if (!validation.ok) return validation
  try {
    return { ok: true, save: { format: SAVE_FORMAT, version: SAVE_VERSION, exportedAt: validation.exportedAt,
      data: migratePersistedProgress(validation.data, validation.version) } }
  } catch { return { ok: false, error: 'invalid' } }
}
export function createPortableSave(progress: PlayerSaveData, exportedAt = new Date().toISOString()): PortableSave {
  return { format: SAVE_FORMAT, version: SAVE_VERSION, exportedAt, data: migratePersistedProgress(progress, SAVE_VERSION) }
}
export function serializeSave(progress: PlayerSaveData, exportedAt = new Date().toISOString()): string {
  return JSON.stringify(createPortableSave(progress, exportedAt), null, 2)
}
export function getBackupFilename(date = new Date()): string { return `muu-sinh-save-${getLocalDateKey(date)}.json` }
