import type {
  AchievementId,
  AchievementUnlock,
  PlayerProgress,
} from '../types/game'
import type { JobId } from '../types/job'
import { jobs } from './jobs'
import { shopItems } from './shop'

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
    description: `Thử sức với cả ${jobs.length} nghề hiện có.`,
    getProgress: (progress) => boundedProgress(
      jobs.filter((job) => progress.completedJobs.includes(job.id)).length,
      jobs.length,
      `${jobs.filter((job) => progress.completedJobs.includes(job.id)).length} / ${jobs.length} nghề`,
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
  { id: 'noodle-10', title: 'Vua hủ tiếu', description: 'Hoàn thành 10 ca bán hủ tiếu.', getProgress: (progress) => jobCountProgress(progress, 'noodle') },
  { id: 'barber-10', title: 'Tay kéo vàng', description: 'Hoàn thành 10 ca cắt tóc.', getProgress: (progress) => jobCountProgress(progress, 'barber') },
  { id: 'carwash-10', title: 'Thánh rửa xe', description: 'Hoàn thành 10 ca rửa xe.', getProgress: (progress) => jobCountProgress(progress, 'carwash') },
  { id: 'rubber-10', title: 'Bàn tay vàng', description: 'Hoàn thành 10 ca cạo cao su.', getProgress: (progress) => jobCountProgress(progress, 'rubber') },
  { id: 'mechanic-10', title: 'Thợ máy lành nghề', description: 'Hoàn thành 10 ca sửa xe.', getProgress: (progress) => jobCountProgress(progress, 'mechanic') },
  { id: 'coffee-10', title: 'Barista đường phố', description: 'Hoàn thành 10 ca pha cà phê.', getProgress: (progress) => jobCountProgress(progress, 'coffee') },
  { id: 'fishing-10', title: 'Cần thủ mưu sinh', description: 'Hoàn thành 10 ca đánh cá.', getProgress: (progress) => jobCountProgress(progress, 'fishing') },
  ...([
    { id: 'fashion-5', title: 'Tín đồ thời trang', target: 5 },
    { id: 'wardrobe-10', title: 'Tủ đồ có gu', target: 10 },
  ] as const).map(({ id, title, target }): AchievementDefinition => ({
    id, title, description: `Sở hữu ${target} món mua trong cửa hàng (không tính đồ khởi đầu).`,
    getProgress: (progress) => {
      const count = shopItems.filter((item) => item.price > 0 && progress.ownedItemIds.includes(item.id)).length
      return boundedProgress(count, target, `${count} / ${target} món`)
    },
  })),
  {
    id: 'shopping-500k', title: 'Đại gia mua sắm', description: 'Chi tổng cộng 500.000đ cho phong cách của bạn.',
    getProgress: (progress) => boundedProgress(progress.totalMoneySpent, 500_000,
      `${progress.totalMoneySpent.toLocaleString('vi-VN')} / 500.000đ`),
  },
  {
    id: 'missions-day', title: 'Chăm chỉ mỗi ngày', description: 'Nhận thưởng cả 3 nhiệm vụ trong một ngày.',
    getProgress: (progress) => {
      const count = progress.dailyMissions?.missions.filter((mission) => mission.claimed).length ?? 0
      return boundedProgress(count, 3, `${count} / 3 nhiệm vụ`)
    },
  },
  {
    id: 'missions-30', title: 'Chiến thần nhiệm vụ', description: 'Nhận thưởng 30 nhiệm vụ hằng ngày.',
    getProgress: (progress) => boundedProgress(progress.totalDailyMissionsClaimed, 30, `${progress.totalDailyMissionsClaimed} / 30 nhiệm vụ`),
  },
  {
    id: 'reward-7', title: 'Quà không sót ngày nào', description: 'Nhận quà ngày 7 trong chuỗi nhận quà liên tiếp.',
    getProgress: (progress) => boundedProgress(progress.dailyRewardStreak, 7, `${progress.dailyRewardStreak} / 7 ngày`),
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
