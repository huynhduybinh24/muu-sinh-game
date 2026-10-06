import { describe, expect, it } from 'vitest'
import { migratePersistedProgress } from '../src/store/progressStore'

describe('persisted progress migration', () => {
  it.each([undefined, null, 'invalid', []])('defaults a missing or invalid save: %s', (value) => {
    expect(migratePersistedProgress(value)).toMatchObject({
      money: 0, reputation: 0, energy: 100, currentStreak: 0,
      totalDaysWorked: 0, totalGamesPlayed: 0, completedJobs: [],
      achievements: [], completedTutorials: [], soundEnabled: true,
    })
  })

  it('preserves an old foundation save while initializing later fields', () => {
    const legacy = {
      day: 8, money: 350_000, reputation: 14, energy: 60,
      currentJobId: 'shipper', previousJobId: 'construction',
      completedJobs: ['sugarcane', 'shipper'],
      completedTutorials: ['sugarcane'], soundEnabled: false,
    }
    const migrated = migratePersistedProgress(legacy)
    expect(migrated).toMatchObject({
      money: 350_000, reputation: 14, energy: 60,
      currentJobId: 'shipper', previousJobId: 'construction',
      completedJobs: ['sugarcane', 'shipper'],
      completedTutorials: ['sugarcane'], soundEnabled: false,
      totalGamesPlayed: 2, totalMoneyEarned: 350_000,
      currentStreak: 0, bestStreak: 0, totalDaysWorked: 0,
    })
    expect(migrated.jobStats.sugarcane.timesPlayed).toBe(1)
    expect(migrated.jobStats.construction.timesPlayed).toBe(0)
    expect(legacy.money).toBe(350_000)
  })

  it('preserves all compatible current statistics, settings, and achievements', () => {
    const initial = migratePersistedProgress(undefined)
    const saved = {
      ...initial, money: 900_000, reputation: 25, currentStreak: 3, bestStreak: 7,
      totalGamesPlayed: 22, totalDaysWorked: 12, totalMoneyEarned: 1_500_000,
      lastCompletedDate: '2026-10-06', soundEnabled: false,
      completedTutorials: ['sugarcane', 'construction'],
      achievements: [{ id: 'first-day', unlockedAt: '2026-10-01T05:00:00.000Z' }],
      jobStats: { ...initial.jobStats, shipper: { timesPlayed: 4, bestScore: 900, totalScore: 2500, totalMoneyEarned: 400_000 } },
    }
    expect(migratePersistedProgress(saved)).toEqual(saved)
  })

  it('filters unknown/duplicate jobs and tutorials and defaults invalid numbers', () => {
    const saved = migratePersistedProgress({
      money: -1, reputation: NaN, energy: Infinity,
      completedJobs: ['shipper', 'missing', 'shipper'],
      completedTutorials: ['construction', 'construction', 'missing'],
      jobStats: { shipper: { timesPlayed: -2, bestScore: 100, totalScore: null } },
    })
    expect(saved.money).toBe(0)
    expect(saved.reputation).toBe(0)
    expect(saved.energy).toBe(100)
    expect(saved.completedJobs).toEqual(['shipper'])
    expect(saved.completedTutorials).toEqual(['construction'])
    expect(saved.jobStats.shipper).toEqual({ timesPlayed: 1, bestScore: 100, totalScore: 0, totalMoneyEarned: 0 })
  })

  it('deduplicates valid unlocks and rejects inherited object keys as achievements', () => {
    const saved = migratePersistedProgress({ achievements: [
      { id: 'first-day', unlockedAt: '2026-10-01' },
      { id: 'first-day', unlockedAt: '2026-10-01' },
      { id: 'toString', unlockedAt: '2026-10-01' },
      { id: 'missing', unlockedAt: '2026-10-01' },
    ] })
    expect(saved.achievements).toEqual([{ id: 'first-day', unlockedAt: '2026-10-01' }])
  })

  it('never lowers best streak below a valid current streak', () => {
    expect(migratePersistedProgress({ currentStreak: 7, bestStreak: 3 }).bestStreak).toBe(7)
  })
})
