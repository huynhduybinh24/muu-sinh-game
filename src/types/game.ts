import type { JobId } from './job'

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
  jobStats: Record<JobId, JobCareerStats>
  achievements: AchievementUnlock[]
}

export interface PlayerPreferences {
  soundEnabled: boolean
  completedTutorials: JobId[]
}
