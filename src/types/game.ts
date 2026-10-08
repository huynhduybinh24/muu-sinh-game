import type { JobId } from './job'
import type { PlayerProfile } from './profile'
import type { ItemId } from './shop'
import type { DailyMissions } from './daily'

// Ephemeral navigation context; not a persistent/portable save field.
export type GameRunMode = 'daily' | 'free-play' | 'replay'

export type AchievementId =
  | 'first-day'
  | 'streak-3'
  | 'streak-7'
  | 'streak-14'
  | 'streak-30'
  | 'all-jobs'
  | 'score-3000'
  | 'millionaire'
  | 'sugarcane-10'
  | 'construction-10'
  | 'shipper-10'
  | 'noodle-10'
  | 'barber-10'
  | 'carwash-10'
  | 'fashion-5'
  | 'wardrobe-10'
  | 'shopping-500k'
  | 'missions-day'
  | 'missions-30'
  | 'reward-7'
  | 'rubber-10'
  | 'mechanic-10'
  | 'coffee-10'
  | 'fishing-10'

export interface AchievementUnlock {
  id: AchievementId
  unlockedAt: string
}

export interface JobCareerStats {
  timesPlayed: number
  bestScore: number
  totalScore: number
  totalMoneyEarned: number
}

export interface GameResultMetadata {
  customersServed?: number
  successfulBricks?: number
  deliveries?: number
  perfectHaircuts?: number
  vehiclesWashed?: number
  treesTapped?: number
  perfectTaps?: number
  vehiclesRepaired?: number
  correctRepairs?: number
  perfectBrews?: number
  fishCaught?: number
  rareFishCaught?: number
}

export interface GameResult {
  jobId: JobId
  score: number
  earnedMoney: number
  reputationChange: number
  completedAt: string
  metadata?: GameResultMetadata
}

export interface PlayerProgress {
  profile: PlayerProfile
  money: number
  reputation: number
  energy: number
  currentJobId: JobId | null
  previousJobId: JobId | null
  completedJobs: JobId[]
  currentStreak: number
  bestStreak: number
  lastCompletedDate: string | null
  totalDaysWorked: number
  totalGamesPlayed: number
  totalMoneyEarned: number
  totalMoneySpent: number
  ownedItemIds: ItemId[]
  xp: number
  dailyMissions: DailyMissions | null
  totalDailyMissionsClaimed: number
  dailyRewardStreak: number
  dailyRewardCycleDay: number
  lastDailyRewardDate: string | null
  jobStats: Record<JobId, JobCareerStats>
  achievements: AchievementUnlock[]
}

export interface PlayerPreferences {
  soundEnabled: boolean
  completedTutorials: JobId[]
}
