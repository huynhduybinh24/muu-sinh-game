import { describe, expect, it } from 'vitest'
import { jobs } from '../src/data/jobs'
import { dailyJobEpochs, type DailyJobEpoch } from '../src/data/dailySchedule'
import { getDailyJobId } from '../src/services/dailyChallenge'

describe('frozen daily catalog epochs', () => {
  it('preserves Task 13 six-job mappings', () => {
    for (const [date, id] of [
      ['2026-10-06', 'carwash'], ['2026-10-07', 'sugarcane'], ['2026-10-08', 'construction'],
      ['2026-10-09', 'shipper'], ['2026-10-13', 'noodle'], ['2026-10-14', 'barber'],
    ]) expect(getDailyJobId(date)).toBe(id)
  })
  it('catalog growth/reordering cannot change established dates', () => {
    const epochs: readonly DailyJobEpoch[] = [{ version: 'old', activeFrom: '0000-01-01', jobIds: ['sugarcane', 'construction', 'shipper'] }]
    for (const date of ['2026-10-06', '2026-10-07', '2026-12-31']) {
      expect(getDailyJobId(date, jobs, epochs)).toBe(getDailyJobId(date, jobs.slice(0, 3), epochs))
      expect(getDailyJobId(date, [...jobs].reverse())).toBe(getDailyJobId(date))
    }
  })
  it('new jobs activate only on an appended epoch boundary, never retroactively', () => {
    const next: DailyJobEpoch = { version: 'scheduled', activeFrom: '2027-01-01', jobIds: ['noodle'] }
    const schedule = [...dailyJobEpochs, next]
    expect(getDailyJobId('2026-12-31', jobs, schedule)).toBe(getDailyJobId('2026-12-31'))
    expect(getDailyJobId('2027-01-01', jobs, schedule)).toBe('noodle')
    expect(getDailyJobId('2027-01-02', jobs, schedule)).toBe('noodle')
    expect(getDailyJobId('2026-10-07', jobs, schedule)).toBe('sugarcane')
  })
})
