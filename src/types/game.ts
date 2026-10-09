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
  | 'banhmi-10'
  | 'gas-10'
  | 'cargo-10'
  | 'cleaning-10'
  | 'electrician-10'
  | 'florist-10'
  | 'security-10'
  | 'photographer-10'
  | 'cashier-10'
  | 'harvest-10'
  | 'it-10'
  | 'accountant-10'
  | 'police-10'
  | 'doctor-10'
  | 'teacher-10'
  | 'taxi-10'
  | 'first-purchase'
  | 'complete-outfit'
  | 'first-vehicle'
  | 'first-smartphone'
  | 'furnished-room'
  | 'collector-30'

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
  bugsFixed?: number
  perfectFixes?: number
  invoicesProcessed?: number
  perfectBalances?: number
  incidentsResolved?: number
  safeDecisions?: number
  patientsHelped?: number
  perfectCare?: number
  lessonsCompleted?: number
  correctAnswers?: number
  tripsCompleted?: number
  fiveStarTrips?: number
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
  vehiclesServed?: number
  perfectFills?: number
  packagesSorted?: number
  perfectSorts?: number
  streetsCleaned?: number
  trashCollected?: number
  circuitsFixed?: number
  perfectCircuits?: number
  bouquetsMade?: number
  perfectBouquets?: number
  incidentsHandled?: number
  correctDetections?: number
  photosTaken?: number
  perfectPhotos?: number
  correctCheckouts?: number
  fruitsHarvested?: number
  basketsCompleted?: number
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
