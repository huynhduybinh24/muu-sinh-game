import { beforeEach, describe, expect, it } from 'vitest'
import { avatarOptions, defaultAppearance } from '../src/data/avatar'
import { getPlayerLevel, getPlayerNameError, normalizePlayerName, readAppearance, readPlayerProfile } from '../src/services/playerProfile'
import { migratePersistedProgress, useProgressStore } from '../src/store/progressStore'
import { dailyResult } from './fixtures'
import { getLevelThreshold } from '../src/services/level'

const storageKey = 'muu-sinh-player-progress'
beforeEach(() => useProgressStore.getState().resetProgress())

describe('player name validation', () => {
  it.each(['', '   ', 'A', 'a'.repeat(21)])('rejects required/length violations: %s', (name) => {
    expect(getPlayerNameError(name)).not.toBeNull()
  })
  it.each(['An', 'Nguyễn Ánh', 'a'.repeat(20), '😀'.repeat(20)])('accepts 2–20 Unicode characters: %s', (name) => {
    expect(getPlayerNameError(name)).toBeNull()
  })
  it('trims whitespace and normalizes decomposed Vietnamese letters before counting', () => {
    const decomposed = '  Nguyễn Ánh  '.normalize('NFD')
    expect(normalizePlayerName(decomposed)).toBe('Nguyễn Ánh')
    expect(getPlayerNameError(decomposed)).toBeNull()
    expect(getPlayerNameError('😀'.repeat(21))).not.toBeNull()
  })
})

describe('appearance defaults and recovery', () => {
  it.each([undefined, null, [], 'invalid', {}])('defaults missing/malformed appearance: %s', (value) => {
    expect(readAppearance(value)).toEqual(defaultAppearance)
  })
  it('keeps valid fields and replaces only invalid option IDs', () => {
    expect(readAppearance({ gender: 'female', skinToneId: 'invalid', hairId: 'bun', shirtId: 'mint', pantsId: 'invalid' }))
      .toEqual({ ...defaultAppearance, gender: 'female', hairId: 'bun', shirtId: 'mint' })
  })
  it('has the requested option counts with no duplicate IDs', () => {
    expect(Object.values(avatarOptions).map((options) => options.length)).toEqual([2, 4, 6, 10, 6])
    for (const options of Object.values(avatarOptions)) {
      expect(new Set(options.map((option) => option.id)).size).toBe(options.length)
    }
  })
  it('invalid names re-enter setup; valid profile timestamps and appearances survive', () => {
    expect(readPlayerProfile({ playerName: 'A' }).playerName).toBe('')
    expect(readPlayerProfile({ playerName: 'An', createdAt: '2026-10-01T05:00:00.000Z', appearance: defaultAppearance }))
      .toEqual({ playerName: 'An', createdAt: '2026-10-01T05:00:00.000Z', appearance: defaultAppearance })
    expect(readPlayerProfile({ playerName: 'An', createdAt: 'invalid' }).createdAt).toBe('1970-01-01T00:00:00.000Z')
  })
})

describe('profile migration and persistence', () => {
  it('adds an unnamed profile without altering a version-2 save', async () => {
    const current = migratePersistedProgress(undefined)
    const { profile, xp: _xp, totalMoneySpent: _spent, ownedItemIds: _owned, ...legacy } = current
    expect([_xp, _spent, _owned.length]).toEqual([0, 0, 6])
    expect(profile.playerName).toBe('')
    const oldSave = {
      ...legacy, money: 450_000, reputation: 30, energy: 40,
      currentJobId: 'shipper', previousJobId: 'construction', completedJobs: ['shipper'],
      currentStreak: 3, bestStreak: 8, totalGamesPlayed: 18, totalDaysWorked: 12,
      lastCompletedDate: '2026-10-06', totalMoneyEarned: 900_000,
      soundEnabled: false, completedTutorials: ['construction'],
      achievements: [{ id: 'first-day', unlockedAt: '2026-10-01T05:00:00.000Z' }],
      jobStats: { ...legacy.jobStats, shipper: { timesPlayed: 18, bestScore: 600, totalScore: 3500, totalMoneyEarned: 900_000 } },
    }
    localStorage.setItem(storageKey, JSON.stringify({ version: 2, state: oldSave }))
    await useProgressStore.persist.rehydrate()
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as { version: number; state: Record<string, unknown> }
    const { profile: migratedProfile, xp, totalMoneySpent, ownedItemIds, ...remaining } = saved.state
    expect(saved.version).toBe(5)
    expect(remaining).toEqual(oldSave)
    expect(xp).toBe(getLevelThreshold(2))
    expect(totalMoneySpent).toBe(0)
    expect(ownedItemIds).toHaveLength(6)
    expect(migratedProfile).toEqual(readPlayerProfile(undefined))
  })
  it('rejects invalid creation without writing a new profile or affecting progress', () => {
    const before = localStorage.getItem(storageKey)
    expect(useProgressStore.getState().createProfile('A', defaultAppearance)).toBe(false)
    expect(localStorage.getItem(storageKey)).toBe(before)
  })
  it('persists profile, name, creation time, appearance and progress through rehydration', async () => {
    useProgressStore.getState().completeGame(dailyResult('2026-10-06'), '2026-10-06')
    useProgressStore.getState().setSoundEnabled(false)
    useProgressStore.getState().completeTutorial('shipper')
    expect(useProgressStore.getState().createProfile('  Nguyễn Ánh  ', { ...defaultAppearance, gender: 'female', hairId: 'bob' })).toBe(true)
    const snapshot = localStorage.getItem(storageKey)
    const profile = useProgressStore.getState().profile
    expect(profile.playerName).toBe('Nguyễn Ánh')
    expect(Number.isFinite(Date.parse(profile.createdAt))).toBe(true)
    useProgressStore.getState().resetProgress()
    localStorage.setItem(storageKey, snapshot ?? '')
    await useProgressStore.persist.rehydrate()
    expect(useProgressStore.getState().profile).toEqual(profile)
    expect(localStorage.getItem(storageKey)).toBe(snapshot)
    expect(useProgressStore.getState()).toMatchObject({ totalGamesPlayed: 1, totalDaysWorked: 1, soundEnabled: false, completedTutorials: ['shipper'] })
  })
  it('editing appearance preserves every progression/preference field and identity', () => {
    useProgressStore.getState().completeGame(dailyResult('2026-10-06', 400), '2026-10-06')
    useProgressStore.getState().createProfile('Minh', defaultAppearance)
    useProgressStore.setState({ xp: getLevelThreshold(2) })
    expect(useProgressStore.getState().purchaseItem('pants-forest').status).toBe('purchased')
    const before = migratePersistedProgress(useProgressStore.getState())
    const appearance = { ...defaultAppearance, shirtId: 'mint', pantsId: 'forest' } as const
    useProgressStore.getState().updateAppearance(appearance)
    const after = migratePersistedProgress(useProgressStore.getState())
    expect(after).toEqual({ ...before, profile: { ...before.profile, appearance } })
    useProgressStore.getState().completeGame(dailyResult('2026-10-07', 200), '2026-10-07')
    expect(useProgressStore.getState().profile).toEqual(after.profile)
  })
  it('retains the legacy displayed-level formula for migration', () => {
    expect([0, 9, 10, 25].map(getPlayerLevel)).toEqual([1, 1, 2, 3])
  })
})
