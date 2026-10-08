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
