import { describe, expect, it } from 'vitest'
import { jobs } from '../src/data/jobs'
import {
  getDailyJobId,
  getLocalDateKey,
  getPreviousLocalDateKey,
  isYesterday,
} from '../src/services/dailyChallenge'

describe('daily challenge', () => {
  it.each([
    ['2026-10-06', 'shipper'],
    ['2026-10-07', 'sugarcane'],
    ['2026-10-08', 'construction'],
  ])('keeps the deterministic job for %s with the original catalog', (date, expectedJob) => {
    expect(getDailyJobId(date, jobs.slice(0, 3))).toBe(expectedJob)
    expect(getDailyJobId(date)).toBe(getDailyJobId(date))
  })

  it('keeps the same job throughout a local calendar day', () => {
    const morning = new Date(2026, 9, 6, 0, 1)
    const evening = new Date(2026, 9, 6, 23, 59)
    expect(getDailyJobId(getLocalDateKey(morning))).toBe(getDailyJobId(getLocalDateKey(evening)))
  })

  it('returns valid jobs across month, year, and leap-day boundaries', () => {
    for (const date of ['2024-02-29', '2026-01-01', '2026-12-31', '2027-01-01']) {
      expect(jobs.map((job) => job.id)).toContain(getDailyJobId(date))
    }
  })

  it('uses the local date rather than the previous UTC date near midnight', () => {
    const date = new Date('2026-10-05T17:05:00.000Z')
    expect(date.getHours()).toBe(0)
    expect(getLocalDateKey(date)).toBe('2026-10-06')
    expect(date.toISOString().slice(0, 10)).toBe('2026-10-05')
  })

  it.each([
    [new Date(2026, 0, 1), '2025-12-31'],
    [new Date(2024, 2, 1), '2024-02-29'],
    [new Date(2026, 2, 1), '2026-02-28'],
  ])('calculates previous calendar day for %s', (date, previous) => {
    expect(getPreviousLocalDateKey(date)).toBe(previous)
    expect(isYesterday(previous, getLocalDateKey(date))).toBe(true)
  })

  it.each(['2026-02-30', 'invalid', '2026-13-01'])('rejects impossible date %s', (date) => {
    expect(isYesterday('2026-02-28', date)).toBe(false)
  })

  it('handles a single available job and rejects an empty catalog', () => {
    expect(getDailyJobId('2026-10-06', [jobs[0]])).toBe('sugarcane')
    expect(() => getDailyJobId('2026-10-06', [])).toThrow('daily-job-list-empty')
  })
})
