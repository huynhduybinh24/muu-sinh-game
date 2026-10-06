import { describe, expect, it } from 'vitest'
import { getNewAchievementUnlocks } from '../src/data/achievements'
import type { AchievementId, PlayerProgress } from '../src/types/game'
import { freshProgress } from './fixtures'

const unlockedAt = '2026-10-06T05:00:00.000Z'
interface ThresholdCase {
  id: AchievementId
  threshold: number
  qualify: (progress: PlayerProgress, value: number) => void
}
const thresholds: ThresholdCase[] = [
  { id: 'first-day', threshold: 1, qualify: (progress, value) => { progress.totalDaysWorked = value } },
  { id: 'streak-3', threshold: 3, qualify: (progress, value) => { progress.bestStreak = value } },
  { id: 'streak-7', threshold: 7, qualify: (progress, value) => { progress.bestStreak = value } },
  { id: 'streak-14', threshold: 14, qualify: (progress, value) => { progress.bestStreak = value } },
  { id: 'streak-30', threshold: 30, qualify: (progress, value) => { progress.bestStreak = value } },
  { id: 'score-3000', threshold: 3_000, qualify: (progress, value) => { progress.jobStats.shipper.bestScore = value } },
  { id: 'millionaire', threshold: 1_000_000, qualify: (progress, value) => { progress.totalMoneyEarned = value } },
  { id: 'sugarcane-10', threshold: 10, qualify: (progress, value) => { progress.jobStats.sugarcane.timesPlayed = value } },
  { id: 'construction-10', threshold: 10, qualify: (progress, value) => { progress.jobStats.construction.timesPlayed = value } },
  { id: 'shipper-10', threshold: 10, qualify: (progress, value) => { progress.jobStats.shipper.timesPlayed = value } },
]

describe('achievement thresholds', () => {
  it.each(thresholds)('$id unlocks at its threshold, once', ({ id, threshold, qualify }) => {
    const progress = freshProgress()
    qualify(progress, threshold - 1)
    expect(getNewAchievementUnlocks(progress, unlockedAt).map((achievement) => achievement.id)).not.toContain(id)
    qualify(progress, threshold)
    const newUnlocks = getNewAchievementUnlocks(progress, unlockedAt)
    expect(newUnlocks).toContainEqual({ id, unlockedAt })
    progress.achievements = newUnlocks
    qualify(progress, threshold + 1)
    expect(getNewAchievementUnlocks(progress, unlockedAt).map((achievement) => achievement.id)).not.toContain(id)
  })

  it('requires all three distinct jobs for the collection achievement', () => {
    const progress = freshProgress()
    progress.completedJobs = ['sugarcane', 'construction']
    expect(getNewAchievementUnlocks(progress, unlockedAt)).toEqual([])
    progress.completedJobs.push('shipper')
    expect(getNewAchievementUnlocks(progress, unlockedAt)).toEqual([{ id: 'all-jobs', unlockedAt }])
    progress.achievements = [{ id: 'all-jobs', unlockedAt }]
    expect(getNewAchievementUnlocks(progress, unlockedAt)).toEqual([])
  })

  it('does not re-emit existing achievements when another threshold is reached', () => {
    const progress = freshProgress()
    progress.totalDaysWorked = 3
    progress.bestStreak = 3
    progress.achievements = [{ id: 'first-day', unlockedAt }]
    expect(getNewAchievementUnlocks(progress, unlockedAt)).toEqual([{ id: 'streak-3', unlockedAt }])
  })
})
