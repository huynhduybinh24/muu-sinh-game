import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SAVE_FORMAT, SAVE_VERSION, SAVE_KEY, RECOVERY_KEY, MAX_BACKUP_BYTES } from '../src/data/save'
import { starterItemIds } from '../src/data/shop'
import { defaultAppearance } from '../src/data/avatar'
import { getDailyMissionDefinitions } from '../src/services/dailyMissions'
import { getLevelProgress } from '../src/services/level'
import { useProgressStore, migratePersistedProgress } from '../src/store/progressStore'
import { serializeSave, validateSave, migrateImportedSave, getBackupFilename, restoreSave, resetSave, recoverSave, readBackupFile, saveErrorMessage } from '../src/services/saveService'
import { createPortableSave } from '../src/services/portableSave'
import { LocalStorageSaveAdapter, getStorageHealth, setStorageHealth, gameStateStorage } from '../src/services/saveStorage'
import type { PlayerSaveData, SaveRepository } from '../src/types/save'

const date = '2026-10-07'
const exportedAt = `${date}T05:00:00.000Z`
function populated(): PlayerSaveData {
  const base = migratePersistedProgress(undefined)
  return { ...base,
    profile: { playerName: 'Nguyễn Ánh', createdAt: '2026-10-01T05:00:00.000Z', appearance: { ...defaultAppearance, gender: 'female', skinToneId: 'deep', hairId: 'long', shirtId: 'rose', pantsId: 'plum' } },
    ownedItemIds: [...starterItemIds, 'hair-long', 'shirt-rose', 'pants-plum'], xp: 900,
    money: 1_250_000, reputation: 55, energy: 40, currentJobId: 'shipper', previousJobId: 'construction',
    completedJobs: ['sugarcane', 'construction', 'shipper', 'noodle', 'barber', 'carwash'],
    totalGamesPlayed: 40, totalDaysWorked: 20, totalMoneyEarned: 2_000_000, totalMoneySpent: 750_000,
    currentStreak: 4, bestStreak: 10, lastCompletedDate: '2026-10-06', soundEnabled: false,
    completedTutorials: ['sugarcane', 'construction', 'shipper', 'noodle', 'barber', 'carwash'],
    jobStats: { ...base.jobStats, shipper: { timesPlayed: 40, bestScore: 3000, totalScore: 14_000, totalMoneyEarned: 2_000_000 } },
    achievements: [{ id: 'first-day', unlockedAt: exportedAt }, { id: 'reward-7', unlockedAt: exportedAt }],
    dailyMissions: { dateKey: date, missions: getDailyMissionDefinitions(date).map(({ id, target }) => ({ id, progress: target, claimed: true })) },
    totalDailyMissionsClaimed: 30, dailyRewardStreak: 7, dailyRewardCycleDay: 7, lastDailyRewardDate: date,
  }
}
const repository = () => new LocalStorageSaveAdapter()
const current = () => migratePersistedProgress(useProgressStore.getState(), SAVE_VERSION)
const envelope = () => createPortableSave(populated(), exportedAt)
beforeEach(() => { vi.restoreAllMocks(); setStorageHealth('saved'); useProgressStore.getState().resetProgress(); localStorage.removeItem(RECOVERY_KEY) })

describe('portable envelope and validation', () => {
  it('serializes all meaningful data as UTF-8-compatible JSON, with no actions/Zustand/UI metadata', () => {
    useProgressStore.setState(populated())
    const json = serializeSave(useProgressStore.getState(), exportedAt)
    const parsed: unknown = JSON.parse(json)
    expect(parsed).toEqual({ format: SAVE_FORMAT, version: 5, exportedAt, data: populated() })
    expect(Object.keys(parsed as object)).toEqual(['format', 'version', 'exportedAt', 'data'])
    expect(json).toContain('Nguyễn Ánh')
    for (const key of ['purchaseItem', 'resetProgress', 'ensureDailyMissions', 'screen', 'levelUp', 'achievementQueue', 'onComplete']) expect(json).not.toContain(`"${key}"`)
    expect(validateSave(json).ok).toBe(true)
    expect(migrateImportedSave(json)).toEqual({ ok: true, save: envelope() })
  })
  it('uses the local date for export filenames', () => {
    expect(getBackupFilename(new Date('2026-10-06T17:05:00Z'))).toBe('muu-sinh-save-2026-10-07.json')
  })
  it.each(['', '{broken', 'null', '[]', 'true', '{"format":"other","version":5}', JSON.stringify({ ...envelope(), data: [] }), JSON.stringify({ ...envelope(), version: '5' }), JSON.stringify({ ...envelope(), version: -1 })])('rejects malformed input safely: %s', (value) => {
    const before = current(), raw = localStorage.getItem(SAVE_KEY)
    expect(restoreSave(value)).toEqual({ ok: false, error: 'invalid' })
    expect(current()).toEqual(before)
    expect(localStorage.getItem(SAVE_KEY)).toBe(raw)
    expect(localStorage.getItem(RECOVERY_KEY)).toBeNull()
  })
  it('rejects newer versions with a distinct friendly error, without overwriting anything', () => {
    expect(restoreSave({ ...envelope(), version: 6 })).toEqual({ ok: false, error: 'future' })
    expect(saveErrorMessage('future')).toBe('File sao lưu được tạo bởi phiên bản game mới hơn.')
    expect(saveErrorMessage('invalid')).toBe('File sao lưu không hợp lệ.')
  })
  it.each([-1, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1])('rejects invalid numeric money/XP %s', (value) => {
    for (const key of ['money', 'xp']) {
      const backup = envelope()
      backup.data[key as 'money' | 'xp'] = value
      expect(validateSave(backup)).toEqual({ ok: false, error: 'invalid' })
    }
  })
  it.each(['profile', 'jobStats', 'ownedItemIds', 'dailyMissions', 'soundEnabled', 'xp'])('requires current-v5 payload field %s', (key) => {
    const backup = envelope()
    Reflect.deleteProperty(backup.data, key)
    expect(validateSave(backup).ok).toBe(false)
  })
  it('rejects malformed nested inventory/jobs/achievements/daily fields and impossible dates', () => {
    const malformed: Record<string, unknown>[] = [
      { ownedItemIds: [null] }, { completedJobs: [5] }, { completedTutorials: 'shipper' }, { currentJobId: {} },
      { jobStats: { shipper: { timesPlayed: -1, bestScore: 0, totalScore: 0, totalMoneyEarned: 0 } } },
      { achievements: [{ id: 'first-day', unlockedAt: '2026-02-30' }] },
      { lastCompletedDate: 'invalid' }, { lastDailyRewardDate: '2026-02-30' }, { dailyRewardCycleDay: 8 },
      { dailyMissions: { dateKey: '2026-02-30', missions: [] } },
      { dailyMissions: { dateKey: date, missions: [{ id: 'play-3', progress: -1, claimed: true }] } },
      { dailyMissions: { dateKey: date, missions: [{ id: 'play-3', progress: 1, claimed: 'yes' }] } },
      { profile: { playerName: 'Minh', createdAt: exportedAt, appearance: { shirtId: {} } } },
    ]
    for (const change of malformed) expect(validateSave({ ...envelope(), data: { ...populated(), ...change } }).ok).toBe(false)
    expect(validateSave({ ...envelope(), exportedAt: '2026-02-30T12:00:00Z' }).ok).toBe(false)
  })
  it('normalizes obsolete IDs and prevents unowned paid equipment without granting it on v5', () => {
    const backup = envelope()
    backup.data.ownedItemIds = [...starterItemIds]
    const raw = JSON.parse(JSON.stringify(backup)) as { data: Record<string, unknown> }
    raw.data.completedJobs = ['shipper', 'retired-job']
    raw.data.ownedItemIds = [...starterItemIds, 'retired-item']
    raw.data.achievements = [{ id: 'first-day', unlockedAt: exportedAt }, { id: 'retired-achievement', unlockedAt: exportedAt }]
    raw.data.dailyMissions = { dateKey: date, missions: [{ id: 'retired-mission', progress: 100, claimed: true }] }
    const result = migrateImportedSave(raw)
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('Expected valid normalized backup')
    expect(result.save.data.ownedItemIds).toEqual(starterItemIds)
    expect(result.save.data.profile.appearance.shirtId).toBe(defaultAppearance.shirtId)
    expect(result.save.data.completedJobs).toEqual(['shipper'])
    expect(result.save.data.achievements).toEqual([{ id: 'first-day', unlockedAt: exportedAt }])
    expect(result.save.data.dailyMissions!.missions.every((m) => !m.claimed && m.progress === 0)).toBe(true)
  })
  it('falls back obsolete appearance strings and deduplicates inventory safely', () => {
    const raw = JSON.parse(serializeSave(populated(), exportedAt)) as { data: { profile: { appearance: Record<string, string> }; ownedItemIds: string[] } }
    raw.data.profile.appearance.hairId = 'retired-hair'
    raw.data.ownedItemIds.push('shirt-rose')
    const result = migrateImportedSave(raw)
    if (!result.ok) throw new Error('Expected normalized backup')
    expect(result.save.data.profile.appearance.hairId).toBe(defaultAppearance.hairId)
    expect(result.save.data.ownedItemIds.filter((id) => id === 'shirt-rose')).toHaveLength(1)
  })
  it('accepts UTF-8 BOM, caps file size and rejects unsafe property names', async () => {
    expect(validateSave(`\uFEFF${serializeSave(populated())}`).ok).toBe(true)
    expect(validateSave(' '.repeat(MAX_BACKUP_BYTES + 1)).ok).toBe(false)
    expect(validateSave('{"format":"muu-sinh-save","version":5,"data":{"__proto__":{"polluted":true}}}').ok).toBe(false)
    const file = { size: MAX_BACKUP_BYTES + 1, text: vi.fn() } as unknown as File
    expect(await readBackupFile(file)).toEqual({ ok: false, error: 'invalid' })
    expect(file.text).not.toHaveBeenCalled()
    expect(await readBackupFile({ size: 1, text: () => Promise.reject(new Error('read-failed')) } as unknown as File)).toEqual({ ok: false, error: 'invalid' })
  })
})

describe('migration, restore and recovery', () => {
  it('round-trips current profile/outfit/inventory/Career/achievements/daily state/preferences through store and refresh', async () => {
    const target = populated()
    expect(restoreSave(serializeSave(target, exportedAt))).toEqual({ ok: true })
    expect(current()).toEqual(target)
    expect(getLevelProgress(current().xp).level).toBe(5)
    const stored = localStorage.getItem(SAVE_KEY)!
    useProgressStore.getState().resetProgress()
    localStorage.setItem(SAVE_KEY, stored)
    await useProgressStore.persist.rehydrate()
    expect(current()).toEqual(target)
    expect(typeof useProgressStore.getState().claimMission).toBe('function')
    expect(useProgressStore.getState().claimDailyReward(date).claimed).toBe(false)
    expect(useProgressStore.getState().claimMission(target.dailyMissions!.missions[0].id, date).claimed).toBe(false)
  })
  it('reuses v3 migration to preserve worn legacy paid gear and the former displayed level', () => {
    const { xp: _xp, ownedItemIds: _items, totalMoneySpent: _spent, dailyMissions: _missions,
      totalDailyMissionsClaimed: _claims, dailyRewardCycleDay: _cycle, dailyRewardStreak: _streak, lastDailyRewardDate: _day, ...old } = populated()
    expect([_xp, _items.length, _spent, _claims, _cycle, _streak, _day, _missions !== null]).toEqual([900, 9, 750000, 30, 7, 7, date, true])
    expect(restoreSave({ format: SAVE_FORMAT, version: 3, exportedAt, data: old })).toEqual({ ok: true })
    expect(current().ownedItemIds).toEqual(expect.arrayContaining(['hair-long', 'shirt-rose', 'pants-plum']))
    expect(current().profile).toEqual(old.profile)
    expect(current().totalMoneySpent).toBe(0)
    expect(getLevelProgress(current().xp).level).toBe(5)
    expect(current().dailyMissions).toBeNull()
  })
  it('supports v0/v2 legacy payloads without profile and without fabricated spending', () => {
    for (const version of [0, 2]) {
      expect(restoreSave({ format: SAVE_FORMAT, version, exportedAt, data: { money: 45000, currentJobId: 'shipper', completedJobs: ['shipper'], soundEnabled: false } }).ok).toBe(true)
      expect(current()).toMatchObject({ money: 45000, totalMoneySpent: 0, soundEnabled: false, currentJobId: 'shipper', profile: { playerName: '' } })
    }
  })
  it('writes a normalized recovery slot before restoring; the adapter exposes only portable data', () => {
    const original = current()
    expect(restoreSave(envelope()).ok).toBe(true)
    const slot = migrateImportedSave(localStorage.getItem(RECOVERY_KEY))
    expect(slot.ok && slot.save.data).toEqual(original)
    expect(migrateImportedSave(repository().read()).ok).toBe(true)
    const local = JSON.parse(localStorage.getItem(SAVE_KEY)!) as { state: PlayerSaveData; version: number }
    expect(local.version).toBe(5)
    expect(local.state).toEqual(populated())
  })
  it.each(['writeRecovery', 'write'] as const)('rolls back current memory/storage if %s fails', (method) => {
    useProgressStore.setState({ money: 777 })
    const before = current(), raw = localStorage.getItem(SAVE_KEY)
    const repo = repository()
    vi.spyOn(repo, method).mockImplementation(() => { throw new Error('quota') })
    expect(restoreSave(envelope(), repo)).toEqual({ ok: false, error: 'storage' })
    expect(current()).toEqual(before)
    expect(localStorage.getItem(SAVE_KEY)).toBe(raw)
    expect(getStorageHealth()).toBe('unavailable')
  })
  it('rolls back even when a store subscriber throws before storage commit', () => {
    const before = current(), raw = localStorage.getItem(SAVE_KEY)
    const repo = repository(), write = vi.spyOn(repo, 'write')
    const unsubscribe = useProgressStore.subscribe(() => { throw new Error('bad-observer') })
    expect(restoreSave(envelope(), repo).ok).toBe(false)
    unsubscribe()
    expect(current()).toEqual(before)
    expect(localStorage.getItem(SAVE_KEY)).toBe(raw)
    expect(write).not.toHaveBeenCalled()
  })
  it('reset requires deliberate typed confirmation and keeps one recoverable snapshot', () => {
    useProgressStore.setState(populated())
    const before = current(), raw = localStorage.getItem(SAVE_KEY)
    for (const word of ['', 'yes', 'XOA', 'xóa']) {
      expect(resetSave(word).ok).toBe(false)
      expect(current()).toEqual(before)
      expect(localStorage.getItem(SAVE_KEY)).toBe(raw)
    }
    expect(resetSave('XÓA')).toEqual({ ok: true })
    expect(current()).toEqual(migratePersistedProgress(undefined))
    expect(recoverSave().ok).toBe(true)
    expect(current()).toEqual(before)
  })
  it('creates a recovery slot before legacy local migration', async () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 2, state: { money: 75000, completedJobs: ['shipper'], totalGamesPlayed: 18 } }))
    await useProgressStore.persist.rehydrate()
    const recovery = migrateImportedSave(localStorage.getItem(RECOVERY_KEY))
    expect(recovery.ok && recovery.save.data.money).toBe(75000)
    expect(current().money).toBe(75000)
    expect(JSON.parse(localStorage.getItem(SAVE_KEY)!).version).toBe(5)
  })
  it('recovers a corrupt local save from the last valid slot without crashing', async () => {
    repository().writeRecovery(envelope())
    localStorage.setItem(SAVE_KEY, '{broken')
    await useProgressStore.persist.rehydrate()
    expect(current()).toEqual(populated())
    expect(getStorageHealth()).toBe('recovered')
    useProgressStore.getState().setSoundEnabled(false)
    expect(migrateImportedSave(repository().read()).ok).toBe(true)
  })
  it('uses safe startup defaults without overwriting corrupt/newer local data', async () => {
    for (const raw of ['{broken', JSON.stringify({ state: populated(), version: 6 })]) {
      setStorageHealth('saved')
      useProgressStore.getState().resetProgress()
      localStorage.setItem(SAVE_KEY, raw)
      await useProgressStore.persist.rehydrate()
      useProgressStore.getState().setSoundEnabled(false)
      expect(localStorage.getItem(SAVE_KEY)).toBe(raw)
      expect(getStorageHealth()).toBe(raw === '{broken' ? 'corrupted' : 'newer')
    }
  })
  it('reports storage access failures without crashing gameplay', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    expect(gameStateStorage.getItem(SAVE_KEY)).toBeNull()
    expect(getStorageHealth()).toBe('unavailable')
  })
  it('never grants unowned paid gear when a v5 local save loses its inventory', async () => {
    const { ownedItemIds: _owned, ...damaged } = populated()
    expect(_owned).toHaveLength(9)
    localStorage.setItem(SAVE_KEY, JSON.stringify({ state: damaged, version: 5 }))
    await useProgressStore.persist.rehydrate()
    expect(current().ownedItemIds).toEqual(starterItemIds)
    expect(current().profile.appearance.shirtId).toBe(defaultAppearance.shirtId)
    expect(current().ownedItemIds).not.toContain('shirt-rose')
  })
  it('preserves valid unlocked IDs while repairing broken local timestamps and huge numeric fields', () => {
    const restored = migratePersistedProgress({ ...populated(), xp: 1e308, lastCompletedDate: '2026-02-30',
      profile: { ...populated().profile, createdAt: '2026-02-30' },
      achievements: [{ id: 'first-day', unlockedAt: 'broken' }] }, 5)
    expect(Number.isFinite(getLevelProgress(restored.xp).level)).toBe(true)
    expect(restored.xp).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER)
    expect(restored.lastCompletedDate).toBeNull()
    expect(restored.profile.createdAt).toBe('1970-01-01T00:00:00.000Z')
    expect(restored.achievements).toEqual([{ id: 'first-day', unlockedAt: '1970-01-01T00:00:00.000Z' }])
  })
  it('can target another portable repository without exporting internal storage metadata', () => {
    const stored: string[] = []
    const repo: SaveRepository = { read: () => stored.at(-1) ?? null, write: (save) => { stored.push(JSON.stringify(save)) },
      readRecovery: () => null, writeRecovery: () => undefined }
    expect(restoreSave(envelope(), repo).ok).toBe(true)
    expect(Object.keys(JSON.parse(repo.read()!))).toEqual(['format', 'version', 'exportedAt', 'data'])
    expect(current()).toEqual(populated())
  })
})
