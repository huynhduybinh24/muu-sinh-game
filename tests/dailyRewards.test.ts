import { beforeEach, describe, expect, it } from 'vitest'
import { dailyRewards } from '../src/data/dailyRewards'
import { claimDailyReward, getDailyRewardStatus } from '../src/services/dailyRewards'
import { getLevelProgress } from '../src/services/level'
import { migratePersistedProgress, useProgressStore } from '../src/store/progressStore'
import { getNewAchievementUnlocks } from '../src/data/achievements'
import type { PlayerProgress } from '../src/types/game'

const date = '2026-10-07'
const fresh = () => migratePersistedProgress(undefined)
beforeEach(() => useProgressStore.getState().resetProgress())
describe('separate seven-day rewards', () => {
  it('claims first day once, preserving all work/career/shop values', () => {
    const before = { ...fresh(), currentStreak: 4, bestStreak: 10, totalDaysWorked: 12, lastCompletedDate: '2026-10-06', totalMoneyEarned: 1_000_000, totalMoneySpent: 80_000 }
    const after = claimDailyReward(before, date)
    expect(after).toEqual({ ...before, money: 5_000, dailyRewardStreak: 1, dailyRewardCycleDay: 1, lastDailyRewardDate: date })
    expect(claimDailyReward(after, date)).toBe(after)
    expect(getDailyRewardStatus(after, date).eligible).toBe(false)
  })
  it('advances across consecutive calendar/month/year/leap days and wraps after day seven', () => {
    for (const pair of [['2026-12-31', '2027-01-01'], ['2024-02-29', '2024-03-01'], ['2026-10-31', '2026-11-01']]) {
      const after = claimDailyReward(claimDailyReward(fresh(), pair[0]), pair[1])
      expect(after.dailyRewardCycleDay).toBe(2)
      expect(after.dailyRewardStreak).toBe(2)
      expect(after.money).toBe(12_500)
    }
    let progress: PlayerProgress = fresh()
    for (let day = 1; day <= 8; day++) progress = claimDailyReward(progress, `2026-10-${String(day).padStart(2, '0')}`)
    expect(progress.dailyRewardCycleDay).toBe(1)
    expect(progress.dailyRewardStreak).toBe(8)
    expect(progress.money).toBe(dailyRewards.reduce((sum, r) => sum + r.money, 0) + 5_000)
    expect(progress.xp).toBe(60)
  })
  it('resets missed days to day one, without touching work streak', () => {
    let progress: PlayerProgress = { ...fresh(), currentStreak: 20, bestStreak: 20 }
    progress = claimDailyReward(progress, '2026-10-01')
    progress = claimDailyReward(progress, '2026-10-02')
    const after = claimDailyReward(progress, '2026-10-04')
    expect(after.dailyRewardStreak).toBe(1)
    expect(after.dailyRewardCycleDay).toBe(1)
    expect(after.money - progress.money).toBe(5_000)
    expect(after.currentStreak).toBe(20)
  })
  it('awards day-seven XP through existing level thresholds and unlocks achievement once', () => {
    const before = { ...fresh(), xp: 140, lastDailyRewardDate: '2026-10-06', dailyRewardCycleDay: 6, dailyRewardStreak: 6 }
    useProgressStore.setState(before)
    const outcome = useProgressStore.getState().claimDailyReward(date)
    expect(outcome.claimed).toBe(true)
    expect(outcome.newAchievements.map(({ id }) => id)).toContain('reward-7')
    expect(useProgressStore.getState().xp).toBe(200)
    expect(getLevelProgress(useProgressStore.getState().xp).level).toBe(2)
    expect(useProgressStore.getState().money).toBe(30_000)
    expect(getNewAchievementUnlocks(useProgressStore.getState(), date)).toEqual([])
  })
  it('blocks rapid double claims and refresh claims using actual store/persistence', async () => {
    const store = useProgressStore.getState()
    expect(store.claimDailyReward(date).claimed).toBe(true)
    expect(store.claimDailyReward(date).claimed).toBe(false)
    const snapshot = localStorage.getItem('muu-sinh-player-progress')!
    store.resetProgress()
    localStorage.setItem('muu-sinh-player-progress', snapshot)
    await useProgressStore.persist.rehydrate()
    expect(useProgressStore.getState().claimDailyReward(date).claimed).toBe(false)
    expect(useProgressStore.getState().money).toBe(5_000)
  })
})
describe('v5 save migration', () => {
  it('preserves every v4 profile/economy/progression/preference field and adds safe daily defaults', async () => {
    const current = { ...fresh(), money: 120_000, xp: 420, totalMoneySpent: 80_000, totalGamesPlayed: 18,
      soundEnabled: false, currentStreak: 4, bestStreak: 8, lastCompletedDate: '2026-10-06', totalDaysWorked: 12 }
    current.ownedItemIds.push('shirt-blue')
    current.profile.appearance.shirtId = 'blue'
    const { dailyMissions: _missions, totalDailyMissionsClaimed: _claims, dailyRewardStreak: _streak, dailyRewardCycleDay: _day, lastDailyRewardDate: _date, ...legacy } = current
    expect([_missions, _claims, _streak, _day, _date]).toEqual([null, 0, 0, 1, null])
    localStorage.setItem('muu-sinh-player-progress', JSON.stringify({ version: 4, state: legacy }))
    await useProgressStore.persist.rehydrate()
    expect(useProgressStore.getState()).toMatchObject(current)
    expect(JSON.parse(localStorage.getItem('muu-sinh-player-progress')!).version).toBe(5)
  })
  it('safely normalizes broken daily fields while keeping valid existing claims', () => {
    const before = fresh()
    const migrated = migratePersistedProgress({ ...before, dailyMissions: { dateKey: 'invalid' }, totalDailyMissionsClaimed: -4,
      dailyRewardStreak: Infinity, dailyRewardCycleDay: 99, lastDailyRewardDate: '2026-02-30' }, 5)
    expect(migrated.dailyMissions).toBeNull()
    expect(migrated.totalDailyMissionsClaimed).toBe(0)
    expect(migrated.dailyRewardStreak).toBe(0)
    expect(migrated.dailyRewardCycleDay).toBe(7)
    expect(migrated.lastDailyRewardDate).toBeNull()
  })
})
