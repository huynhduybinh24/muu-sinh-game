import type { JobId } from '../types/job'

export interface DailyJobEpoch { version: string; activeFrom: string; jobIds: readonly JobId[] }
// Append a NEW epoch with a future activation date when expanding the catalog.
// Never edit an existing epoch's ordered IDs or activation date: historical mappings stay fixed.
// Freeze Task 13's six-job hash mappings for every previously supported date.
export const dailyJobEpochs: readonly DailyJobEpoch[] = [{
  version: 'six-jobs-v1', activeFrom: '0000-01-01',
  jobIds: ['sugarcane', 'construction', 'shipper', 'noodle', 'barber', 'carwash'],
}, {
  version: 'ten-jobs-v2', activeFrom: '2026-11-01',
  jobIds: ['sugarcane', 'construction', 'shipper', 'noodle', 'barber', 'carwash', 'rubber', 'mechanic', 'coffee', 'fishing'],
}]
