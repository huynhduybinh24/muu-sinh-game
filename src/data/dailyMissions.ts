import type { MissionDefinition, MissionId, MissionType } from '../types/daily'
import type { JobId } from '../types/job'

// Definitions belong to this schedule version. Change balance/templates in a FUTURE epoch,
// never reorder old pools or mutate established templates to reshuffle existing dates.
export const missionTemplates: Record<MissionId, MissionDefinition> = {
  'play-3': { id: 'play-3', type: 'PLAY_GAMES', title: 'Ba ca khởi động', description: 'Hoàn thành 3 ca làm bất kỳ, kể cả chơi lại.', target: 3, rewardMoney: 7_500, rewardXp: 25 },
  'earn-75k': { id: 'earn-75k', type: 'EARN_MONEY', title: 'Tiền công đầu ngày', description: 'Kiếm 75.000đ từ các ca làm hôm nay.', target: 75_000, rewardMoney: 10_000, rewardXp: 30 },
  'daily-shifts': { id: 'daily-shifts', type: 'PLAY_JOB', title: 'Quen tay nghề hôm nay', description: 'Hoàn thành 3 ca nghề hôm nay.', target: 3, rewardMoney: 15_000, rewardXp: 40 },
  'daily-work': { id: 'daily-work', type: 'SERVE_CUSTOMERS', title: 'Tay nghề chăm chỉ', description: 'Tích lũy kết quả nghề hôm nay.', target: 18, rewardMoney: 15_000, rewardXp: 40 },
  'score-6000': { id: 'score-6000', type: 'SCORE_TOTAL', title: 'Góp điểm thành tài', description: 'Tích lũy 6.000 điểm từ các ca làm hôm nay.', target: 6_000, rewardMoney: 25_000, rewardXp: 60 },
  'score-1500': { id: 'score-1500', type: 'SCORE_SINGLE', title: 'Một ca thật chất', description: 'Đạt 1.500 điểm trong một ca hôm nay.', target: 1_500, rewardMoney: 20_000, rewardXp: 50 },
  'play-8': { id: 'play-8', type: 'PLAY_GAMES', title: 'Siêng làm siêng có', description: 'Hoàn thành 8 ca hôm nay, kể cả chơi lại.', target: 8, rewardMoney: 25_000, rewardXp: 60 },
}
export const jobMissionMetrics: Record<JobId, { type: MissionType; target: number; description: string }> = {
  sugarcane: { type: 'SERVE_CUSTOMERS', target: 18, description: 'Phục vụ 18 khách nước mía.' },
  construction: { type: 'SUCCESSFUL_BRICKS', target: 30, description: 'Xếp thành công 30 viên gạch.' },
  shipper: { type: 'DELIVERIES', target: 15, description: 'Giao thành công 15 đơn hàng.' },
  noodle: { type: 'SERVE_CUSTOMERS', target: 18, description: 'Phục vụ 18 khách hủ tiếu.' },
  barber: { type: 'SERVE_CUSTOMERS', target: 18, description: 'Cắt tóc cho 18 khách.' },
  carwash: { type: 'WASH_VEHICLES', target: 12, description: 'Rửa xong 12 chiếc xe.' },
}
export interface MissionEpoch { version: string; activeFrom: string; pools: readonly (readonly MissionId[])[] }
export const dailyMissionEpochs: readonly MissionEpoch[] = [{
  version: 'missions-v1', activeFrom: '0000-01-01',
  pools: [['play-3', 'earn-75k'], ['daily-shifts', 'daily-work'], ['score-6000', 'score-1500', 'play-8']],
}]
