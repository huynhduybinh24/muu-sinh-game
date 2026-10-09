import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { getNewAchievementUnlocks } from '../data/achievements'
import { starterItemIds } from '../data/shop'
import { emptyJobStats, initialProgress, initialPreferences, migratePersistedProgress } from '../services/saveMigration'
import { gameStateStorage } from '../services/saveStorage'
import { SAVE_VERSION, SAVE_KEY } from '../data/save'
import { equipItem as applyEquipment, ownedAppearance, purchaseItem as applyPurchase } from '../services/inventory'
import { removeEquipment } from '../services/lifestyle'
import { claimMission as applyMissionClaim, syncDailyMissions } from '../services/dailyMissions'
import { claimDailyReward as applyDailyRewardClaim } from '../services/dailyRewards'
import type { PurchaseStatus } from '../types/shop'
import { applyGameCompletion } from '../services/progression'
import { getLocalDateKey } from '../services/dailyChallenge'
import { getPlayerNameError, normalizePlayerName, readAppearance } from '../services/playerProfile'
import type { PlayerAppearance } from '../types/profile'
import type {
  AchievementUnlock,
  GameResult,
  GameRunMode,
  PlayerPreferences,
  PlayerProgress,
} from '../types/game'
import type { JobId } from '../types/job'

export { migratePersistedProgress } from '../services/saveMigration'

interface ProgressStore extends PlayerProgress, PlayerPreferences {
  ensureDailyMissions: (dateKey?: string) => void
  claimMission: (id: string, dateKey?: string) => { claimed: boolean; newAchievements: AchievementUnlock[] }
  claimDailyReward: (dateKey?: string) => { claimed: boolean; newAchievements: AchievementUnlock[] }
  purchaseItem: (id: string) => { status: PurchaseStatus; newAchievements: AchievementUnlock[] }
  equipItem: (id: string) => boolean
  unequipItem: (id: string) => boolean
  createProfile: (name: string, appearance: PlayerAppearance) => boolean
  updateAppearance: (appearance: PlayerAppearance) => void
  selectJob: (jobId: JobId) => void
  completeGame: (result: GameResult, localDateKey?: string, mode?: GameRunMode) => AchievementUnlock[]
  setSoundEnabled: (enabled: boolean) => void
  completeTutorial: (jobId: JobId) => void
  resetProgress: () => void
}

type PersistedProgress = PlayerProgress & PlayerPreferences

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set) => ({
      ...initialProgress,
      ...initialPreferences,
      ensureDailyMissions: (dateKey = getLocalDateKey()) => set((state) => syncDailyMissions(state, dateKey)),
      claimMission: (id, dateKey = getLocalDateKey()) => {
        let outcome: { claimed: boolean; newAchievements: AchievementUnlock[] } = { claimed: false, newAchievements: [] }
        set((state) => {
          const progress = applyMissionClaim(state, id, dateKey)
          if (progress.totalDailyMissionsClaimed === state.totalDailyMissionsClaimed) return progress
          const newAchievements = getNewAchievementUnlocks(progress, new Date().toISOString())
          outcome = { claimed: true, newAchievements }
          return { ...progress, achievements: [...progress.achievements, ...newAchievements] }
        })
        return outcome
      },
      claimDailyReward: (dateKey = getLocalDateKey()) => {
        let outcome: { claimed: boolean; newAchievements: AchievementUnlock[] } = { claimed: false, newAchievements: [] }
        set((state) => {
          const progress = applyDailyRewardClaim(state, dateKey)
          if (progress === state) return state
          const newAchievements = getNewAchievementUnlocks(progress, new Date().toISOString())
          outcome = { claimed: true, newAchievements }
          return { ...progress, achievements: [...progress.achievements, ...newAchievements] }
        })
        return outcome
      },
      purchaseItem: (id) => {
        let outcome: { status: PurchaseStatus; newAchievements: AchievementUnlock[] } = { status: 'invalid-item', newAchievements: [] }
        set((state) => {
          const purchase = applyPurchase(state, id)
          if (purchase.status !== 'purchased') { outcome.status = purchase.status; return state }
          const newAchievements = getNewAchievementUnlocks(purchase.progress, new Date().toISOString())
          outcome = { status: purchase.status, newAchievements }
          return { ...purchase.progress, achievements: [...purchase.progress.achievements, ...newAchievements] }
        })
        return outcome
      },
      equipItem: (id) => {
        let equipped = false
        set((state) => {
          const updated = applyEquipment(state, id)
          equipped = updated !== state
          if (!equipped) return state
          const newAchievements = getNewAchievementUnlocks(updated, new Date().toISOString())
          return { ...updated, achievements: [...updated.achievements, ...newAchievements] }
        })
        return equipped
      },
      unequipItem: (id) => {
        let removed = false
        set((state) => { const updated = removeEquipment(state, id); removed = updated !== state; return updated })
        return removed
      },
      createProfile: (name, appearance) => {
        if (getPlayerNameError(name)) return false
        set((state) => ({
          profile: {
            ...state.profile,
            playerName: normalizePlayerName(name),
            createdAt: state.profile.createdAt || new Date().toISOString(),
            appearance: ownedAppearance(readAppearance(appearance), state.ownedItemIds),
          },
        }))
        return true
      },
      updateAppearance: (appearance) => set((state) => ({
        profile: { ...state.profile, appearance: ownedAppearance(readAppearance(appearance), state.ownedItemIds) },
      })),
      selectJob: (jobId) =>
        set((state) => ({
          previousJobId: state.currentJobId ?? state.previousJobId,
          currentJobId: jobId,
        })),
      completeGame: (result, localDateKey = getLocalDateKey(), mode = 'daily') => {
        let newAchievements: AchievementUnlock[] = []
        set((state) => {
          const update = applyGameCompletion(state, result, localDateKey, mode)
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
        ownedItemIds: [...starterItemIds],
        achievements: [],
        ...initialPreferences,
      }),
    }),
    {
      name: SAVE_KEY,
      version: SAVE_VERSION,
      storage: createJSONStorage(() => gameStateStorage),
      migrate: (persistedState, version) => migratePersistedProgress(persistedState, version),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...migratePersistedProgress(persistedState, SAVE_VERSION),
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
        totalMoneySpent: state.totalMoneySpent,
        ownedItemIds: state.ownedItemIds,
        xp: state.xp,
        dailyMissions: state.dailyMissions,
        totalDailyMissionsClaimed: state.totalDailyMissionsClaimed,
        dailyRewardStreak: state.dailyRewardStreak,
        dailyRewardCycleDay: state.dailyRewardCycleDay,
        lastDailyRewardDate: state.lastDailyRewardDate,
        jobStats: state.jobStats,
        achievements: state.achievements,
        soundEnabled: state.soundEnabled,
        completedTutorials: state.completedTutorials,
      }),
    },
  ),
)
