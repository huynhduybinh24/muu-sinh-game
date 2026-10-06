import type {
  AchievementId,
  AchievementUnlock,
  PlayerProgress,
} from '../types/game'
import type { JobId } from '../types/job'

export interface AchievementProgress {
  current: number
  target: number
  label: string
}

export interface AchievementDefinition {
  id: AchievementId
  title: string
  description: string
  getProgress: (progress: PlayerProgress) => AchievementProgress
}

const boundedProgress = (
  current: number,
  target: number,
  label: string,
): AchievementProgress => ({
  current: Math.min(current, target),
  target,
  label,
})

const jobCountProgress = (
  progress: PlayerProgress,
  jobId: JobId,
): AchievementProgress => {
  const current = progress.jobStats[jobId].timesPlayed
  return boundedProgress(current, 10, `${current} / 10 lần`)
}

export const achievements: readonly AchievementDefinition[] = [
  {
    id: 'first-day',
    title: 'Bắt đầu mưu sinh',
    description: 'Hoàn thành ngày làm việc đầu tiên.',
    getProgress: (progress) => boundedProgress(
      progress.totalDaysWorked,
      1,
      `${progress.totalDaysWorked} / 1 ngày`,
    ),
  },
  {
    id: 'streak-3',
    title: 'Cơ địa khó thất nghiệp',
    description: '3 ngày đi làm liên tục!',
    getProgress: (progress) => boundedProgress(
      progress.bestStreak,
      3,
      `${progress.bestStreak} / 3 ngày`,
    ),
  },
  {
    id: 'streak-7',
    title: 'Đi làm không nghỉ',
    description: 'Giữ chuỗi đi làm 7 ngày.',
    getProgress: (progress) => boundedProgress(
      progress.bestStreak,
      7,
      `${progress.bestStreak} / 7 ngày`,
    ),
  },
  {
    id: 'streak-14',
    title: 'Nhân viên chuyên cần',
    description: 'Giữ chuỗi đi làm 14 ngày.',
    getProgress: (progress) => boundedProgress(
      progress.bestStreak,
      14,
      `${progress.bestStreak} / 14 ngày`,
    ),
  },
  {
    id: 'streak-30',
    title: 'Một tháng mưu sinh',
    description: 'Giữ chuỗi đi làm 30 ngày.',
    getProgress: (progress) => boundedProgress(
      progress.bestStreak,
      30,
      `${progress.bestStreak} / 30 ngày`,
    ),
  },
  {
    id: 'all-jobs',
    title: 'Đa ngành đa nghề',
    description: 'Thử sức với cả 3 nghề.',
    getProgress: (progress) => boundedProgress(
      progress.completedJobs.length,
      3,
      `${progress.completedJobs.length} / 3 nghề`,
    ),
  },
  {
    id: 'score-3000',
    title: 'Thợ lành nghề',
    description: 'Đạt ít nhất 3.000 điểm trong một ca.',
    getProgress: (progress) => {
      const bestScore = Math.max(...Object.values(progress.jobStats).map((stats) => stats.bestScore))
      return boundedProgress(bestScore, 3_000, `${bestScore.toLocaleString('vi-VN')} / 3.000 điểm`)
    },
  },
  {
    id: 'millionaire',
    title: 'Đại gia mưu sinh',
    description: 'Kiếm tổng cộng 1.000.000đ.',
    getProgress: (progress) => boundedProgress(
      progress.totalMoneyEarned,
      1_000_000,
      `${progress.totalMoneyEarned.toLocaleString('vi-VN')} / 1.000.000đ`,
    ),
  },
  {
    id: 'sugarcane-10',
    title: 'Bậc thầy nước mía',
    description: 'Hoàn thành 10 ca bán nước mía.',
    getProgress: (progress) => jobCountProgress(progress, 'sugarcane'),
  },
  {
    id: 'construction-10',
    title: 'Thợ xây chính hiệu',
    description: 'Hoàn thành 10 ca phụ hồ.',
    getProgress: (progress) => jobCountProgress(progress, 'construction'),
  },
  {
    id: 'shipper-10',
    title: 'Shipper quốc dân',
    description: 'Hoàn thành 10 ca giao hàng.',
    getProgress: (progress) => jobCountProgress(progress, 'shipper'),
  },
]

export const achievementsById = Object.fromEntries(
  achievements.map((achievement) => [achievement.id, achievement]),
) as Record<AchievementId, AchievementDefinition>

export function getNewAchievementUnlocks(
  progress: PlayerProgress,
  unlockedAt: string,
): AchievementUnlock[] {
  const unlockedIds = new Set(progress.achievements.map((achievement) => achievement.id))
  return achievements
    .filter((achievement) => {
      const achievementProgress = achievement.getProgress(progress)
      return (
        !unlockedIds.has(achievement.id)
        && achievementProgress.current >= achievementProgress.target
      )
    })
    .map((achievement) => ({ id: achievement.id, unlockedAt }))
}
