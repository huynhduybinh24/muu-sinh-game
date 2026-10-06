import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createGameResult, getResultMessage } from '../src/services/resultCalculator'

describe('result calculation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-06T05:00:00.000Z'))
  })
  afterEach(() => vi.useRealTimers())

  it.each([
    [0, 12_000, -1], [4, 17_000, -1], [5, 18_250, 1],
    [19, 35_750, 1], [20, 37_000, 2], [39, 60_750, 2], [40, 62_000, 3],
  ])('score %s earns %s and reputation %s', (score, money, reputation) => {
    expect(createGameResult('shipper', score)).toMatchObject({
      jobId: 'shipper', score, earnedMoney: money,
      reputationChange: reputation, completedAt: '2026-10-06T05:00:00.000Z',
    })
  })

  it('rounds fractional scores and floors negative scores', () => {
    expect(createGameResult('construction', 12.6).score).toBe(13)
    expect(createGameResult('construction', -50)).toMatchObject({ score: 0, earnedMoney: 12_000 })
  })

  it.each([NaN, Infinity, -Infinity])('handles non-finite score %s safely', (score) => {
    expect(createGameResult('sugarcane', score)).toMatchObject({ score: 0, earnedMoney: 12_000 })
  })

  it('keeps optional metadata backward compatible', () => {
    expect(createGameResult('shipper', 100).metadata).toBeUndefined()
    expect(createGameResult('shipper', 100, { deliveries: 1 }).metadata).toEqual({ deliveries: 1 })
  })

  it.each([
    [0, 'Hôm nay hơi cực 😭'], [79, 'Hôm nay hơi cực 😭'],
    [80, 'Có cố gắng là có lương!'], [249, 'Có cố gắng là có lương!'],
    [250, 'Cơ địa khó thất nghiệp!'], [549, 'Cơ địa khó thất nghiệp!'],
    [550, 'Thợ lành nghề xuất hiện!'], [899, 'Thợ lành nghề xuất hiện!'],
    [900, 'Chủ tịch giả nghèo đi làm thuê!'],
  ])('score tier %s uses its centralized message', (score, message) => {
    expect(getResultMessage(score)).toBe(message)
  })
})
