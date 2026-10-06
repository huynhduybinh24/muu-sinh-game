import type { GameResult } from '../types/game'
import type { JobId } from '../types/job'

export interface ShareCardTheme {
  accent: string
  accentSoft: string
  dark: string
  statLabel: string
  metadataKey: 'customersServed' | 'successfulBricks' | 'deliveries'
  fallbackSymbol: string
}

export const shareCardThemes: Record<JobId, ShareCardTheme> = {
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

export function getViralStat(result: GameResult): { label: string; value: number } {
  const theme = shareCardThemes[result.jobId]
  const storedValue = result.metadata?.[theme.metadataKey]
  return {
    label: theme.statLabel,
    value: storedValue ?? Math.max(0, Math.floor(result.score / 100)),
  }
}
