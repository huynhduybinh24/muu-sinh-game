import { describe, expect, it } from 'vitest'
import { bouquetOrders, evaluateBouquet } from '../src/game/config/floristConfig'
import { detectionPoints, securityDifficulty } from '../src/game/config/securityConfig'
import { evaluatePhoto, photoSpeed, advancePhotoPhase } from '../src/game/config/photographerConfig'
import { groceries, checkoutTotal, checkoutPayment, checkoutCorrect, changeOptions, cashierDifficulty } from '../src/game/config/cashierConfig'
import { orchardItem, harvestPoints, harvestWaveMs } from '../src/game/config/harvestConfig'

describe('Batch B gameplay rules', () => {
  it.each(bouquetOrders)('bouquets require the requested positions and ribbon', order => {
    expect(evaluateBouquet(order.flowers, order.ribbon, order)).toEqual({ grade: 'perfect', points: 150 })
    expect(evaluateBouquet([null, ...order.flowers.slice(1)], order.ribbon, order).points).toBe(100)
    expect(evaluateBouquet(order.flowers, order.ribbon === 'pink' ? 'gold' : 'pink', order).points).toBe(50)
    expect(evaluateBouquet([null, null, null], order.ribbon, order).points).toBe(-30)
  })
  it('security rewards actual object events and penalizes quiet-time false alarms', () => {
    expect(detectionPoints('door', 'door', 0)).toBe(130)
    expect(detectionPoints('door', 'door', 800)).toBe(115)
    expect(detectionPoints('door', 'door', 2000)).toBe(100)
    expect(detectionPoints('door', 'water', 0)).toBe(-40)
    expect(detectionPoints('door', null, 0)).toBe(-40)
  })
  it.each([[12, .65, 240, 150], [27, .1, 100, 100], [43, -1, 0, 50], [44, 1, 300, 0], [12, 1, 0, 50], [NaN, 1, 300, 0]] as const)('camera evaluates framing, pose and stability', (distance, pose, stable, points) => {
    expect(evaluatePhoto(distance, pose, stable).points).toBe(points)
  })
  it('checkout requires every scan and exact change, with distinct nonnegative choices', () => {
    const total = checkoutTotal(groceries), payment = checkoutPayment(total)
    expect(total).toBe(75000); expect(payment).toBe(100000)
    expect(checkoutCorrect(5, 5, 25000, total, payment)).toBe(true)
    expect(checkoutCorrect(4, 5, 25000, total, payment)).toBe(false)
    expect(checkoutCorrect(5, 5, 20000, total, payment)).toBe(false)
    for (const amount of [0, 45000, 50000, 75000]) {
      const choices = changeOptions(amount, checkoutPayment(amount))
      expect(new Set(choices).size).toBe(3); expect(choices.every(n => n >= 0)).toBe(true)
    }
  })
  it('harvest has distinct fruit/hazard outcomes and a bounded combo bonus', () => {
    expect([0, .54, .55, .87, .88, 1].map(orchardItem)).toEqual(['ripe', 'ripe', 'unripe', 'unripe', 'hazard', 'hazard'])
    expect([1, 2, 7, 100].map(n => harvestPoints(true, n))).toEqual([40, 43, 58, 58])
    expect(harvestPoints(false, 10)).toBe(-20)
  })
  it('difficulty stays fair and capped', () => {
    expect(securityDifficulty(0)).toEqual({ wait: 1200, window: 4400 })
    expect(securityDifficulty(100)).toEqual({ wait: 650, window: 2600 })
    expect(photoSpeed(0)).toBe(.8); expect(photoSpeed(100)).toBe(1.5)
    expect(cashierDifficulty(0)).toEqual({ count: 2, seconds: 15 })
    expect(cashierDifficulty(100)).toEqual({ count: 4, seconds: 9 })
    expect(harvestWaveMs(0)).toBe(2300); expect(harvestWaveMs(100)).toBe(1200)
  })
  it('camera difficulty changes velocity without jumping the subject position', () => {
    expect(advancePhotoPhase(20, 0, 100)).toBe(20)
    expect(advancePhotoPhase(20, 16, 0)).toBeCloseTo(20.0128)
    expect(advancePhotoPhase(20, 16, 100)).toBeCloseTo(20.024)
    expect(advancePhotoPhase(20, -16, 100)).toBe(20)
  })
})
