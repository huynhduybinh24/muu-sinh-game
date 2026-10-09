import type {
  AchievementId,
  AchievementUnlock,
  PlayerProgress,
} from '../types/game'
import type { JobId } from '../types/job'
import { shopItems } from './shop'
import { getLifestyle } from '../services/lifestyle'

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

// Keep this existing achievement's ten-job requirement and previous unlocks stable.
const collectionJobs: readonly JobId[] = ['sugarcane', 'construction', 'shipper', 'noodle', 'barber', 'carwash', 'rubber', 'mechanic', 'coffee', 'fishing']

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
    description: 'Thử sức với cả 10 nghề đầu tiên.',
    getProgress: (progress) => boundedProgress(
      collectionJobs.filter((id) => progress.completedJobs.includes(id)).length,
      collectionJobs.length,
      `${collectionJobs.filter((id) => progress.completedJobs.includes(id)).length} / ${collectionJobs.length} nghề`,
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
    { id: 'banhmi-10', title: 'Lành nghề bán bánh mì', description: 'Hoàn thành 10 ca bán bánh mì.', getProgress: (progress: PlayerProgress) => jobCountProgress(progress, 'banhmi') },
    { id: 'gas-10', title: 'Lành nghề đổ xăng', description: 'Hoàn thành 10 ca đổ xăng.', getProgress: (progress: PlayerProgress) => jobCountProgress(progress, 'gas') },
    { id: 'cargo-10', title: 'Lành nghề bốc hàng', description: 'Hoàn thành 10 ca bốc hàng.', getProgress: (progress: PlayerProgress) => jobCountProgress(progress, 'cargo') },
    { id: 'cleaning-10', title: 'Lành nghề quét đường', description: 'Hoàn thành 10 ca quét đường.', getProgress: (progress: PlayerProgress) => jobCountProgress(progress, 'cleaning') },
    { id: 'electrician-10', title: 'Lành nghề thợ điện', description: 'Hoàn thành 10 ca thợ điện.', getProgress: (progress: PlayerProgress) => jobCountProgress(progress, 'electrician') },
    { id: 'florist-10', title: 'Lành nghề bán hoa', description: 'Hoàn thành 10 ca bán hoa.', getProgress: (progress: PlayerProgress) => jobCountProgress(progress, 'florist') },
    { id: 'security-10', title: 'Lành nghề bảo vệ', description: 'Hoàn thành 10 ca bảo vệ.', getProgress: (progress: PlayerProgress) => jobCountProgress(progress, 'security') },
    { id: 'photographer-10', title: 'Lành nghề chụp ảnh', description: 'Hoàn thành 10 ca chụp ảnh.', getProgress: (progress: PlayerProgress) => jobCountProgress(progress, 'photographer') },
    { id: 'cashier-10', title: 'Lành nghề thu ngân', description: 'Hoàn thành 10 ca thu ngân.', getProgress: (progress: PlayerProgress) => jobCountProgress(progress, 'cashier') },
    { id: 'harvest-10', title: 'Lành nghề thu hoạch trái cây', description: 'Hoàn thành 10 ca thu hoạch trái cây.', getProgress: (progress: PlayerProgress) => jobCountProgress(progress, 'harvest') },
  ] satisfies AchievementDefinition[]),
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
  { id: 'it-10', title: 'Lành nghề lập trình viên', description: 'Hoàn thành 10 ca lập trình viên.', getProgress: (progress) => jobCountProgress(progress, 'it') },
  { id: 'accountant-10', title: 'Lành nghề kế toán', description: 'Hoàn thành 10 ca kế toán.', getProgress: (progress) => jobCountProgress(progress, 'accountant') },
  { id: 'police-10', title: 'Lành nghề công an', description: 'Hoàn thành 10 ca công an.', getProgress: (progress) => jobCountProgress(progress, 'police') },
  { id: 'doctor-10', title: 'Lành nghề bác sĩ', description: 'Hoàn thành 10 ca bác sĩ.', getProgress: (progress) => jobCountProgress(progress, 'doctor') },
  { id: 'teacher-10', title: 'Lành nghề giáo viên', description: 'Hoàn thành 10 ca giáo viên.', getProgress: (progress) => jobCountProgress(progress, 'teacher') },
  { id: 'taxi-10', title: 'Lành nghề tài xế', description: 'Hoàn thành 10 ca tài xế.', getProgress: (progress) => jobCountProgress(progress, 'taxi') },
  { id: 'first-purchase', title: 'Tự thưởng từ tiền công', description: 'Mua món đầu tiên bằng tiền đi làm.', getProgress: p => boundedProgress(p.totalMoneySpent > 0 ? 1 : 0, 1, 'Một lần mua sắm') },
  { id: 'complete-outfit', title: 'Lên đồ đi phố', description: 'Trang bị áo, quần và đôi giày bạn sở hữu.', getProgress: p => boundedProgress(getLifestyle(p.profile).equipment.shoes ? 1 : 0, 1, 'Áo + quần + giày') },
  { id: 'first-vehicle', title: 'Xe của riêng mình', description: 'Sở hữu một phương tiện.', getProgress: p => boundedProgress(shopItems.some(i => i.category === 'vehicle' && p.ownedItemIds.includes(i.id)) ? 1 : 0, 1, 'Một chiếc xe') },
  { id: 'first-smartphone', title: 'Kết nối phố nhỏ', description: 'Sở hữu chiếc smartphone đầu tiên.', getProgress: p => boundedProgress(shopItems.some(i => i.category === 'phone' && i.style === 'smartphone' && p.ownedItemIds.includes(i.id)) ? 1 : 0, 1, 'Một smartphone') },
  { id: 'furnished-room', title: 'Góc nhà ấm áp', description: 'Đặt giường, bàn, ghế và một món trang trí.', getProgress: p => {
    const room = getLifestyle(p.profile).room
    return boundedProgress([room.bed,room.desk,room.seat,room.plant || room.light || room.decor].filter(Boolean).length, 4, 'Bốn góc đã có đồ')
  } },
  { id: 'collector-30', title: 'Bộ sưu tập cuộc sống', description: 'Sở hữu 30 món trả phí, không tính đồ khởi đầu.', getProgress: p => boundedProgress(shopItems.filter(i => i.price > 0 && p.ownedItemIds.includes(i.id)).length, 30, '30 món đã mua') },
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
