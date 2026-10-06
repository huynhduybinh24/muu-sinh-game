import { describe, expect, it } from 'vitest'
import { applyGameCompletion } from '../src/services/progression'
import { createGameResult } from '../src/services/resultCalculator'
import { dailyResult, freshProgress } from './fixtures'

describe('progression', () => {
  it('counts a first daily completion, even at zero score', () => {
    const update = applyGameCompletion(freshProgress(), dailyResult('2026-10-06', 0), '2026-10-06')
    expect(update.completedDailyChallenge).toBe(true)
    expect(update.progress).toMatchObject({
      currentStreak: 1, bestStreak: 1, totalDaysWorked: 1,
      totalGamesPlayed: 1, lastCompletedDate: '2026-10-06',
    })
    expect(update.newAchievements.map((achievement) => achievement.id)).toContain('first-day')
  })

  it('awards replay rewards without counting an extra working day or streak', () => {
    const result = dailyResult('2026-10-06')
    const first = applyGameCompletion(freshProgress(), result, '2026-10-06').progress
    const replay = applyGameCompletion(first, result, '2026-10-06')
    expect(replay.completedDailyChallenge).toBe(false)
    expect(replay.progress.currentStreak).toBe(1)
    expect(replay.progress.totalDaysWorked).toBe(1)
    expect(replay.progress.totalGamesPlayed).toBe(2)
    expect(replay.progress.money).toBe(result.earnedMoney * 2)
    expect(replay.progress.totalMoneyEarned).toBe(result.earnedMoney * 2)
    expect(replay.newAchievements.map((achievement) => achievement.id)).not.toContain('first-day')
  })

  it.each([
    ['2026-10-06', '2026-10-07'],
    ['2026-12-31', '2027-01-01'],
    ['2024-02-29', '2024-03-01'],
  ])('extends streak across %s → %s', (firstDay, secondDay) => {
    const first = applyGameCompletion(freshProgress(), dailyResult(firstDay), firstDay).progress
    const second = applyGameCompletion(first, dailyResult(secondDay), secondDay).progress
    expect(second.currentStreak).toBe(2)
    expect(second.bestStreak).toBe(2)
    expect(second.totalDaysWorked).toBe(2)
  })

  it('resets after a missed day without losing the best streak', () => {
    const previous = { ...freshProgress(), currentStreak: 7, bestStreak: 9, lastCompletedDate: '2026-10-06' }
    const update = applyGameCompletion(previous, dailyResult('2026-10-08'), '2026-10-08')
    expect(update.progress.currentStreak).toBe(1)
    expect(update.progress.bestStreak).toBe(9)
  })

  it('does not count a non-daily job as a daily completion', () => {
    const update = applyGameCompletion(freshProgress(), createGameResult('construction', 100), '2026-10-06')
    expect(update.completedDailyChallenge).toBe(false)
    expect(update.progress.totalDaysWorked).toBe(0)
    expect(update.progress.currentStreak).toBe(0)
    expect(update.progress.totalGamesPlayed).toBe(1)
  })

  it('accumulates per-job and global statistics without mutating the input', () => {
    const initial = freshProgress()
    const snapshot = structuredClone(initial)
    const results = [
      createGameResult('sugarcane', 200),
      createGameResult('sugarcane', 50),
      createGameResult('construction', 300),
    ]
    const final = results.reduce((progress, result) =>
      applyGameCompletion(progress, result, '2026-10-06').progress, initial)
    expect(initial).toEqual(snapshot)
    expect(final.jobStats.sugarcane).toEqual({
      timesPlayed: 2, bestScore: 200, totalScore: 250,
      totalMoneyEarned: results[0].earnedMoney + results[1].earnedMoney,
    })
    expect(final.jobStats.construction).toMatchObject({ timesPlayed: 1, bestScore: 300, totalScore: 300 })
    expect(final.jobStats.shipper.timesPlayed).toBe(0)
    expect(final.completedJobs).toEqual(['sugarcane', 'construction'])
    expect(final.totalGamesPlayed).toBe(3)
    expect(final.totalMoneyEarned).toBe(results.reduce((sum, result) => sum + result.earnedMoney, 0))
  })

  it('keeps energy and reputation from becoming negative', () => {
    const previous = { ...freshProgress(), reputation: 0, energy: 5 }
    const next = applyGameCompletion(previous, dailyResult('2026-10-06', 0), '2026-10-06').progress
    expect(next.reputation).toBe(0)
    expect(next.energy).toBe(0)
    expect(next.money).toBe(12_000)
  })
})
