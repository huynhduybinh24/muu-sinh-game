import type { JobId } from './job'

export type MissionType = 'PLAY_GAMES' | 'PLAY_JOB' | 'SCORE_TOTAL' | 'SCORE_SINGLE' | 'EARN_MONEY'
  | 'SERVE_CUSTOMERS' | 'SUCCESSFUL_BRICKS' | 'DELIVERIES' | 'WASH_VEHICLES'
  | 'TAP_TREES' | 'REPAIR_VEHICLES' | 'CATCH_FISH'
export type MissionId = 'play-3' | 'earn-75k' | 'daily-shifts' | 'daily-work' | 'score-6000' | 'score-1500' | 'play-8'
export interface MissionDefinition {
  id: MissionId
  type: MissionType
  title: string
  description: string
  target: number
  rewardMoney: number
  rewardXp: number
  jobId?: JobId
}
export interface MissionStatus { id: MissionId; progress: number; claimed: boolean }
export interface DailyMissions { dateKey: string; missions: MissionStatus[] }
export interface MissionView extends MissionDefinition { progress: number; completed: boolean; claimed: boolean }
export interface DailyReward { money: number; xp: number }
