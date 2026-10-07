import { achievementsById } from '../data/achievements'
import { jobs } from '../data/jobs'
import { starterItemIds } from '../data/shop'
import { ownedAppearance, readOwnedItems } from './inventory'
import { migrateLegacyXp } from './level'
import { readDailyMissions } from './dailyMissions'
import { isLocalDateKey } from './dailyChallenge'
import { readPlayerProfile } from './playerProfile'
import type { AchievementId, JobCareerStats, PlayerPreferences, PlayerProgress } from '../types/game'
import type { JobId } from '../types/job'
import type { PlayerSaveData } from '../types/save'

const jobIds = jobs.map((job) => job.id)
const epochTimestamp = '1970-01-01T00:00:00.000Z'
const validTimestamp = (value: string) => isLocalDateKey(value.slice(0, 10)) && Number.isFinite(Date.parse(value))

export const emptyJobStats = (): Record<JobId, JobCareerStats> => Object.fromEntries(jobIds.map((id) =>
  [id, { timesPlayed: 0, bestScore: 0, totalScore: 0, totalMoneyEarned: 0 }],
)) as Record<JobId, JobCareerStats>

export const initialProgress: PlayerProgress = {
  profile: readPlayerProfile(undefined),
  money: 0,
  reputation: 0,
  energy: 100,
  currentJobId: null,
  previousJobId: null,
  completedJobs: [],
  currentStreak: 0,
  bestStreak: 0,
  lastCompletedDate: null,
  totalDaysWorked: 0,
  totalGamesPlayed: 0,
  totalMoneyEarned: 0,
  totalMoneySpent: 0,
  ownedItemIds: [...starterItemIds],
  xp: 0,
  dailyMissions: null,
  totalDailyMissionsClaimed: 0,
  dailyRewardStreak: 0,
  dailyRewardCycleDay: 1,
  lastDailyRewardDate: null,
  jobStats: emptyJobStats(),
  achievements: [],
}

export const initialPreferences: PlayerPreferences = {
  soundEnabled: true,
  completedTutorials: [],
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function safeNumber(value: unknown, fallback: number): number {
  const candidate = typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback
  return Number.isFinite(candidate) ? Math.min(Math.max(0, candidate), Number.MAX_SAFE_INTEGER) : 0
}

function isJobId(value: unknown): value is JobId {
  return typeof value === 'string' && jobIds.includes(value as JobId)
}

function isAchievementId(value: unknown): value is AchievementId {
  return typeof value === 'string' && Object.hasOwn(achievementsById, value)
}

function readJobStats(
  value: unknown,
  completedJobs: readonly JobId[],
): Record<JobId, JobCareerStats> {
  const source = isRecord(value) ? value : {}

  return Object.fromEntries(jobIds.map((jobId) => {
    const stored = isRecord(source[jobId]) ? source[jobId] : {}
    return [jobId, {
      timesPlayed: safeNumber(stored.timesPlayed, completedJobs.includes(jobId) ? 1 : 0),
      bestScore: safeNumber(stored.bestScore, 0),
      totalScore: safeNumber(stored.totalScore, 0),
      totalMoneyEarned: safeNumber(stored.totalMoneyEarned, 0),
    }]
  })) as Record<JobId, JobCareerStats>
}

export function migratePersistedProgress(value: unknown, fromVersion?: number): PlayerSaveData {
  const source = isRecord(value) ? value : {}
  const completedJobs = Array.isArray(source.completedJobs)
    ? [...new Set(source.completedJobs.filter(isJobId))]
    : []
  const completedTutorials = Array.isArray(source.completedTutorials)
    ? [...new Set(source.completedTutorials.filter(isJobId))]
    : []
  const jobStats = readJobStats(source.jobStats, completedJobs)
  const storedAchievements = Array.isArray(source.achievements)
    ? source.achievements
        .filter(isRecord)
        .filter((item) => isAchievementId(item.id) && typeof item.unlockedAt === 'string')
        .map((item) => ({ id: item.id as AchievementId, unlockedAt: validTimestamp(item.unlockedAt as string) ? item.unlockedAt as string : epochTimestamp }))
    : []
  const achievements = [...new Map(
    storedAchievements.map((achievement) => [achievement.id, achievement]),
  ).values()]
  const inferredGames = Object.values(jobStats)
    .reduce((total, stats) => total + stats.timesPlayed, 0)
  const money = safeNumber(source.money, initialProgress.money)
  const currentStreak = safeNumber(source.currentStreak, 0)
  const totalGamesPlayed = safeNumber(source.totalGamesPlayed, inferredGames)
  const profile = readPlayerProfile(source.profile)
  if (profile.playerName && !validTimestamp(profile.createdAt)) profile.createdAt = epochTimestamp
  const legacyInventory = fromVersion !== undefined ? fromVersion < 4 : !Array.isArray(source.ownedItemIds)
  const ownedItemIds = readOwnedItems(source.ownedItemIds, legacyInventory ? profile.appearance : undefined)

  return {
    ...initialProgress,
    ...initialPreferences,
    profile: { ...profile, appearance: ownedAppearance(profile.appearance, ownedItemIds) },
    money,
    reputation: safeNumber(source.reputation, initialProgress.reputation),
    energy: safeNumber(source.energy, initialProgress.energy),
    currentJobId: isJobId(source.currentJobId) ? source.currentJobId : null,
    previousJobId: isJobId(source.previousJobId) ? source.previousJobId : null,
    completedJobs,
    currentStreak,
    bestStreak: Math.max(safeNumber(source.bestStreak, 0), currentStreak),
    lastCompletedDate: typeof source.lastCompletedDate === 'string' && isLocalDateKey(source.lastCompletedDate)
      ? source.lastCompletedDate
      : null,
    totalDaysWorked: safeNumber(source.totalDaysWorked, 0),
    totalGamesPlayed,
    totalMoneyEarned: safeNumber(source.totalMoneyEarned, money),
    totalMoneySpent: safeNumber(source.totalMoneySpent, 0),
    ownedItemIds,
    xp: safeNumber(source.xp, migrateLegacyXp(totalGamesPlayed)),
    dailyMissions: readDailyMissions(source.dailyMissions),
    totalDailyMissionsClaimed: Math.floor(safeNumber(source.totalDailyMissionsClaimed, 0)),
    dailyRewardStreak: Math.floor(safeNumber(source.dailyRewardStreak, 0)),
    dailyRewardCycleDay: Math.min(7, Math.max(1, Math.floor(safeNumber(source.dailyRewardCycleDay, 1)))),
    lastDailyRewardDate: typeof source.lastDailyRewardDate === 'string' && isLocalDateKey(source.lastDailyRewardDate)
      ? source.lastDailyRewardDate : null,
    jobStats,
    achievements,
    soundEnabled: typeof source.soundEnabled === 'boolean'
      ? source.soundEnabled
      : initialPreferences.soundEnabled,
    completedTutorials,
  }
}
