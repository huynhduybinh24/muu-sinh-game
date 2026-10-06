import { getNewAchievementUnlocks } from '../data/achievements'
import { getDailyJobId, isYesterday } from './dailyChallenge'
import type { AchievementUnlock, GameResult, PlayerProgress } from '../types/game'

export interface GameCompletionUpdate {
  progress: PlayerProgress
  newAchievements: AchievementUnlock[]
  completedDailyChallenge: boolean
}

export function applyGameCompletion(
  progress: PlayerProgress,
  result: GameResult,
  localDateKey: string,
): GameCompletionUpdate {
  const previousJobStats = progress.jobStats[result.jobId]
  const nextJobStats = {
    timesPlayed: previousJobStats.timesPlayed + 1,
    bestScore: Math.max(previousJobStats.bestScore, result.score),
    totalScore: previousJobStats.totalScore + result.score,
    totalMoneyEarned: previousJobStats.totalMoneyEarned + result.earnedMoney,
  }
  const completedJobs = progress.completedJobs.includes(result.jobId)
    ? progress.completedJobs
    : [...progress.completedJobs, result.jobId]

  const isDailyJob = result.jobId === getDailyJobId(localDateKey)
  const completedDailyChallenge = isDailyJob && progress.lastCompletedDate !== localDateKey
  let currentStreak = progress.currentStreak
  let bestStreak = progress.bestStreak
  let lastCompletedDate = progress.lastCompletedDate
  let totalDaysWorked = progress.totalDaysWorked

  if (completedDailyChallenge) {
    currentStreak = lastCompletedDate && isYesterday(lastCompletedDate, localDateKey)
      ? currentStreak + 1
      : 1
    bestStreak = Math.max(bestStreak, currentStreak)
    lastCompletedDate = localDateKey
    totalDaysWorked += 1
  }

  const nextProgress: PlayerProgress = {
    ...progress,
    money: progress.money + result.earnedMoney,
    reputation: Math.max(0, progress.reputation + result.reputationChange),
    energy: Math.max(0, progress.energy - 20),
    completedJobs,
    currentStreak,
    bestStreak,
    lastCompletedDate,
    totalDaysWorked,
    totalGamesPlayed: progress.totalGamesPlayed + 1,
    totalMoneyEarned: progress.totalMoneyEarned + result.earnedMoney,
    jobStats: {
      ...progress.jobStats,
      [result.jobId]: nextJobStats,
    },
  }
  const unlockedAt = Number.isNaN(new Date(result.completedAt).getTime())
    ? new Date().toISOString()
    : result.completedAt
  const newAchievements = getNewAchievementUnlocks(nextProgress, unlockedAt)

  return {
    progress: {
      ...nextProgress,
      achievements: [...nextProgress.achievements, ...newAchievements],
    },
    newAchievements,
    completedDailyChallenge,
  }
}
