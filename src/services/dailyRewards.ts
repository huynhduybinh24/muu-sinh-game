import { dailyRewards } from '../data/dailyRewards'
import { isYesterday } from './dailyChallenge'
import type { PlayerProgress } from '../types/game'

export function getDailyRewardStatus(progress: Pick<PlayerProgress, 'lastDailyRewardDate' | 'dailyRewardCycleDay' | 'dailyRewardStreak'>, dateKey: string) {
  const claimed = progress.lastDailyRewardDate === dateKey
  const consecutive = Boolean(progress.lastDailyRewardDate && isYesterday(progress.lastDailyRewardDate, dateKey))
  const cycleDay = claimed ? progress.dailyRewardCycleDay : consecutive ? progress.dailyRewardCycleDay % dailyRewards.length + 1 : 1
  return { eligible: !claimed, cycleDay, streak: claimed ? progress.dailyRewardStreak : consecutive ? progress.dailyRewardStreak + 1 : 1,
    reward: dailyRewards[cycleDay - 1] }
}
export function claimDailyReward(progress: PlayerProgress, dateKey: string): PlayerProgress {
  const status = getDailyRewardStatus(progress, dateKey)
  if (!status.eligible) return progress
  return { ...progress, money: progress.money + status.reward.money, xp: progress.xp + status.reward.xp,
    dailyRewardStreak: status.streak, dailyRewardCycleDay: status.cycleDay, lastDailyRewardDate: dateKey }
}
