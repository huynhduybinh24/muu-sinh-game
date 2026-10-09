import type { GameResult, GameResultMetadata } from '../types/game'
import type { JobId } from '../types/job'

export interface ShareCardTheme {
  accent: string
  accentSoft: string
  dark: string
  statLabel: string
  metadataKey: keyof GameResultMetadata
  fallbackSymbol: string
}

export const shareCardThemes: Record<JobId, ShareCardTheme> = {
  it: { accent: '#527fa5', accentSoft: '#f1ecd9', dark: '#304f4b', statLabel: 'Bug đã sửa', metadataKey: 'bugsFixed', fallbackSymbol: 'LẬP TRÌNH VIÊN' },
  accountant: { accent: '#548f7f', accentSoft: '#f1ecd9', dark: '#304f4b', statLabel: 'Phiếu đã xử lý', metadataKey: 'invoicesProcessed', fallbackSymbol: 'KẾ TOÁN' },
  police: { accent: '#517497', accentSoft: '#f1ecd9', dark: '#304f4b', statLabel: 'Lượt xe giải quyết', metadataKey: 'incidentsResolved', fallbackSymbol: 'CÔNG AN' },
  doctor: { accent: '#66a7a1', accentSoft: '#f1ecd9', dark: '#304f4b', statLabel: 'Khách đã giúp', metadataKey: 'patientsHelped', fallbackSymbol: 'BÁC SĨ' },
  teacher: { accent: '#a18152', accentSoft: '#f1ecd9', dark: '#304f4b', statLabel: 'Tiết học hoàn thành', metadataKey: 'lessonsCompleted', fallbackSymbol: 'GIÁO VIÊN' },
  taxi: { accent: '#c39e54', accentSoft: '#f1ecd9', dark: '#304f4b', statLabel: 'Chuyến đã hoàn thành', metadataKey: 'tripsCompleted', fallbackSymbol: 'TÀI XẾ' },
  banhmi: { accent: '#c68b48', accentSoft: '#f5ecd3', dark: '#304f4b', statLabel: 'Bánh mì', metadataKey: 'customersServed', fallbackSymbol: 'BÁN BÁNH MÌ' },
  gas: { accent: '#cf7958', accentSoft: '#f5ecd3', dark: '#304f4b', statLabel: 'Xăng', metadataKey: 'vehiclesServed', fallbackSymbol: 'ĐỔ XĂNG' },
  cargo: { accent: '#83975d', accentSoft: '#f5ecd3', dark: '#304f4b', statLabel: 'Kiện hàng', metadataKey: 'packagesSorted', fallbackSymbol: 'BỐC HÀNG' },
  cleaning: { accent: '#559989', accentSoft: '#f5ecd3', dark: '#304f4b', statLabel: 'Đoạn phố sạch', metadataKey: 'streetsCleaned', fallbackSymbol: 'QUÉT ĐƯỜNG' },
  electrician: { accent: '#d1a347', accentSoft: '#f5ecd3', dark: '#304f4b', statLabel: 'Mạch đã sửa', metadataKey: 'circuitsFixed', fallbackSymbol: 'THỢ ĐIỆN' },
  florist: { accent: '#b76e95', accentSoft: '#f5ecd3', dark: '#304f4b', statLabel: 'Bó hoa', metadataKey: 'bouquetsMade', fallbackSymbol: 'BÁN HOA' },
  security: { accent: '#647e9b', accentSoft: '#f5ecd3', dark: '#304f4b', statLabel: 'Sự cố phát hiện', metadataKey: 'correctDetections', fallbackSymbol: 'BẢO VỆ' },
  photographer: { accent: '#647fb0', accentSoft: '#f5ecd3', dark: '#304f4b', statLabel: 'Ảnh đã chụp', metadataKey: 'photosTaken', fallbackSymbol: 'CHỤP ẢNH' },
  cashier: { accent: '#5d9980', accentSoft: '#f5ecd3', dark: '#304f4b', statLabel: 'Khách thanh toán', metadataKey: 'customersServed', fallbackSymbol: 'THU NGÂN' },
  harvest: { accent: '#b39a43', accentSoft: '#f5ecd3', dark: '#304f4b', statLabel: 'Quả đã hái', metadataKey: 'fruitsHarvested', fallbackSymbol: 'THU HOẠCH TRÁI CÂY' },
  rubber: { accent: '#59885a', accentSoft: '#e3f0cf', dark: '#324f36', statLabel: 'Cây đã cạo', metadataKey: 'treesTapped', fallbackSymbol: 'CAO SU' },
  mechanic: { accent: '#55859a', accentSoft: '#dfedf2', dark: '#324854', statLabel: 'Xe đã sửa', metadataKey: 'vehiclesRepaired', fallbackSymbol: 'CỜ LÊ' },
  coffee: { accent: '#99705a', accentSoft: '#f8e9cc', dark: '#594036', statLabel: 'Ly cà phê đã phục vụ', metadataKey: 'customersServed', fallbackSymbol: 'PHIN' },
  fishing: { accent: '#468c98', accentSoft: '#daf0ec', dark: '#2b555c', statLabel: 'Cá đã bắt', metadataKey: 'fishCaught', fallbackSymbol: 'CÁ' },
  noodle: { accent: '#be7130', accentSoft: '#fff0ca', dark: '#603711', statLabel: 'Khách phục vụ', metadataKey: 'customersServed', fallbackSymbol: 'HỦ TIẾU' },
  barber: { accent: '#8258a6', accentSoft: '#eee0fa', dark: '#382252', statLabel: 'Khách cắt tóc', metadataKey: 'customersServed', fallbackSymbol: 'KÉO' },
  carwash: { accent: '#168e98', accentSoft: '#d6f6f7', dark: '#10474d', statLabel: 'Xe đã rửa', metadataKey: 'vehiclesWashed', fallbackSymbol: 'XE SẠCH' },
  sugarcane: {
    accent: '#3b8d4d',
    accentSoft: '#dff1c8',
    dark: '#173f27',
    statLabel: 'Khách phục vụ',
    metadataKey: 'customersServed',
    fallbackSymbol: 'LY MÍA',
  },
  construction: {
    accent: '#df6a32',
    accentSoft: '#ffe0b5',
    dark: '#55301d',
    statLabel: 'Gạch thành công',
    metadataKey: 'successfulBricks',
    fallbackSymbol: 'GẠCH',
  },
  shipper: {
    accent: '#3279a8',
    accentSoft: '#d5ebf1',
    dark: '#183b55',
    statLabel: 'Đơn giao thành công',
    metadataKey: 'deliveries',
    fallbackSymbol: 'GIAO',
  },
}

export function getViralStat(result: GameResult): { label: string; value: number; detail?: string } {
  const theme = shareCardThemes[result.jobId]
  const storedValue = result.metadata?.[theme.metadataKey]
  const stat = {
    label: theme.statLabel,
    value: typeof storedValue === 'number' && Number.isFinite(storedValue) && storedValue >= 0
      ? Math.floor(storedValue) : Math.max(0, Math.floor(result.score / 100)),
  }
  if (result.jobId !== 'coffee') return stat
  const perfect = result.metadata?.perfectBrews
  return { ...stat, detail: `Pha chuẩn: ${typeof perfect === 'number' && Number.isFinite(perfect) && perfect >= 0 ? Math.floor(perfect) : 0}` }
}
