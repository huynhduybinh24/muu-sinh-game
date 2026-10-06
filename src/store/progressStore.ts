import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { achievementsById } from '../data/achievements'
import { applyGameCompletion } from '../services/progression'
import { getLocalDateKey } from '../services/dailyChallenge'
import { getPlayerNameError, normalizePlayerName, readAppearance, readPlayerProfile } from '../services/playerProfile'
import type { PlayerAppearance } from '../types/profile'
import type {
  AchievementId,
  AchievementUnlock,
  GameResult,
  JobCareerStats,
  PlayerPreferences,
  PlayerProgress,
} from '../types/game'
import type { JobId } from '../types/job'

const jobIds: readonly JobId[] = ['sugarcane', 'construction', 'shipper']

const emptyJobStats = (): Record<JobId, JobCareerStats> => ({
  sugarcane: { timesPlayed: 0, bestScore: 0, totalScore: 0, totalMoneyEarned: 0 },
  construction: { timesPlayed: 0, bestScore: 0, totalScore: 0, totalMoneyEarned: 0 },
  shipper: { timesPlayed: 0, bestScore: 0, totalScore: 0, totalMoneyEarned: 0 },
})

const initialProgress: PlayerProgress = {
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
  jobStats: emptyJobStats(),
  achievements: [],
}

const initialPreferences: PlayerPreferences = {
  soundEnabled: true,
  completedTutorials: [],
}

interface ProgressStore extends PlayerProgress, PlayerPreferences {
  createProfile: (name: string, appearance: PlayerAppearance) => boolean
  updateAppearance: (appearance: PlayerAppearance) => void
  selectJob: (jobId: JobId) => void
  completeGame: (result: GameResult, localDateKey?: string) => AchievementUnlock[]
  setSoundEnabled: (enabled: boolean) => void
  completeTutorial: (jobId: JobId) => void
  resetProgress: () => void
}

type PersistedProgress = PlayerProgress & PlayerPreferences

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function safeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback
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

export function migratePersistedProgress(value: unknown): PersistedProgress {
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
        .map((item) => ({ id: item.id as AchievementId, unlockedAt: item.unlockedAt as string }))
    : []
  const achievements = [...new Map(
    storedAchievements.map((achievement) => [achievement.id, achievement]),
  ).values()]
  const inferredGames = Object.values(jobStats)
    .reduce((total, stats) => total + stats.timesPlayed, 0)
  const money = safeNumber(source.money, initialProgress.money)
  const currentStreak = safeNumber(source.currentStreak, 0)

  return {
    ...initialProgress,
    ...initialPreferences,
    profile: readPlayerProfile(source.profile),
    money,
    reputation: safeNumber(source.reputation, initialProgress.reputation),
    energy: safeNumber(source.energy, initialProgress.energy),
    currentJobId: isJobId(source.currentJobId) ? source.currentJobId : null,
    previousJobId: isJobId(source.previousJobId) ? source.previousJobId : null,
    completedJobs,
    currentStreak,
    bestStreak: Math.max(safeNumber(source.bestStreak, 0), currentStreak),
    lastCompletedDate: typeof source.lastCompletedDate === 'string'
      ? source.lastCompletedDate
      : null,
    totalDaysWorked: safeNumber(source.totalDaysWorked, 0),
    totalGamesPlayed: safeNumber(source.totalGamesPlayed, inferredGames),
    totalMoneyEarned: safeNumber(source.totalMoneyEarned, money),
    jobStats,
    achievements,
    soundEnabled: typeof source.soundEnabled === 'boolean'
      ? source.soundEnabled
      : initialPreferences.soundEnabled,
    completedTutorials,
  }
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set) => ({
      ...initialProgress,
      ...initialPreferences,
      createProfile: (name, appearance) => {
        if (getPlayerNameError(name)) return false
        set((state) => ({
          profile: {
            playerName: normalizePlayerName(name),
            createdAt: state.profile.createdAt || new Date().toISOString(),
            appearance: readAppearance(appearance),
          },
        }))
        return true
      },
      updateAppearance: (appearance) => set((state) => ({
        profile: { ...state.profile, appearance: readAppearance(appearance) },
      })),
      selectJob: (jobId) =>
        set((state) => ({
          previousJobId: state.currentJobId ?? state.previousJobId,
          currentJobId: jobId,
        })),
      completeGame: (result, localDateKey = getLocalDateKey()) => {
        let newAchievements: AchievementUnlock[] = []
        set((state) => {
          const update = applyGameCompletion(state, result, localDateKey)
          newAchievements = update.newAchievements
          return update.progress
        })
        return newAchievements
      },
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      completeTutorial: (jobId) =>
        set((state) => ({
          completedTutorials: state.completedTutorials.includes(jobId)
            ? state.completedTutorials
            : [...state.completedTutorials, jobId],
        })),
      resetProgress: () => set({
        ...initialProgress,
        jobStats: emptyJobStats(),
        achievements: [],
        ...initialPreferences,
      }),
    }),
    {
      name: 'muu-sinh-player-progress',
      version: 3,
      migrate: (persistedState) => migratePersistedProgress(persistedState),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...migratePersistedProgress(persistedState),
      }),
      partialize: (state): PersistedProgress => ({
        profile: state.profile,
        money: state.money,
        reputation: state.reputation,
        energy: state.energy,
        currentJobId: state.currentJobId,
        previousJobId: state.previousJobId,
        completedJobs: state.completedJobs,
        currentStreak: state.currentStreak,
        bestStreak: state.bestStreak,
        lastCompletedDate: state.lastCompletedDate,
        totalDaysWorked: state.totalDaysWorked,
        totalGamesPlayed: state.totalGamesPlayed,
        totalMoneyEarned: state.totalMoneyEarned,
        jobStats: state.jobStats,
        achievements: state.achievements,
        soundEnabled: state.soundEnabled,
        completedTutorials: state.completedTutorials,
      }),
    },
  ),
)
