import { afterEach, describe, expect, it, vi } from 'vitest'
import { getViralStat, shareCardThemes } from '../src/data/shareCard'
import { jobsById } from '../src/data/jobs'
import { formatMoney } from '../src/services/formatters'
import { createGameResult } from '../src/services/resultCalculator'
import { getShareFilename, getShareText } from '../src/services/shareCardImage'

afterEach(() => vi.useRealTimers())

describe('share card helpers', () => {
  it.each([
    ['sugarcane', 'customersServed', 'Khách phục vụ'],
    ['construction', 'successfulBricks', 'Gạch thành công'],
    ['shipper', 'deliveries', 'Đơn giao thành công'],
    ['noodle', 'customersServed', 'Khách phục vụ'],
    ['barber', 'customersServed', 'Khách cắt tóc'],
    ['carwash', 'vehiclesWashed', 'Xe đã rửa'],
  ] as const)('%s uses correct typed metadata and label', (jobId, key, label) => {
    expect(shareCardThemes[jobId].metadataKey).toBe(key)
    const result = createGameResult(jobId, 2350, { [key]: 9 })
    expect(getViralStat(result)).toEqual({ label, value: 9 })
    expect(getViralStat(createGameResult(jobId, 0, { [key]: 0 })).value).toBe(0)
  })

  it('provides distinct centralized accents and keeps all job names/icons', () => {
    expect(new Set(Object.values(shareCardThemes).map((theme) => theme.accent)).size).toBe(6)
    Object.values(jobsById).forEach((job) => {
      expect(job.name).not.toBe('')
      expect(job.icon).not.toBe('')
      expect(shareCardThemes[job.id].accent).toMatch(/^#[0-9a-f]{6}$/)
    })
  })

  it('supports results stored before metadata existed', () => {
    expect(getViralStat(createGameResult('construction', 235)).value).toBe(2)
    expect(getViralStat(createGameResult('construction', 0)).value).toBe(0)
  })

  it('uses a valid filename and local completion date instead of UTC', () => {
    const result = { ...createGameResult('shipper', 2350), completedAt: '2026-10-05T17:15:00.000Z' }
    expect(getShareFilename(result)).toBe('muu-sinh-shipper-2026-10-06.png')
  })

  it('uses a controlled local date if an old completion timestamp is invalid', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-05T17:15:00.000Z'))
    expect(getShareFilename({ ...createGameResult('sugarcane', 0), completedAt: 'invalid' }))
      .toBe('muu-sinh-sugarcane-2026-10-06.png')
  })

  it('formats the actual job, score, and income in Vietnamese', () => {
    const result = createGameResult('shipper', 2350)
    expect(getShareText(result, jobsById.shipper)).toContain('Shipper')
    expect(getShareText(result, jobsById.shipper)).toContain('2.350 điểm')
    expect(formatMoney(320_000)).toBe('320.000đ')
  })
})
