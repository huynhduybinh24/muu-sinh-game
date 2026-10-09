import { describe, expect, it } from 'vitest'
import { breadOrders, breadIngredients, emptySandwich, evaluateSandwich, breadPatience } from '../src/game/config/banhmiConfig'
import { evaluateFuel, fuelRate, GAS_CONFIG } from '../src/game/config/gasConfig'
import { cargoDrop, cargoPoints, cargoPatience } from '../src/game/config/cargoConfig'
import { cleaningPoints, cleaningDifficulty, sweepDistance } from '../src/game/config/cleaningConfig'
import { circuitPoints, circuitDifficulty } from '../src/game/config/electricianConfig'

describe('Batch A gameplay rules', () => {
  it.each(breadOrders)('sandwich $name requires every requested ingredient and no extras', order => {
    const sandwich = emptySandwich()
    order.ingredients.forEach(id => { sandwich[id] = true })
    expect(evaluateSandwich(sandwich, order.ingredients)).toBe(true)
    for (const id of breadIngredients) expect(evaluateSandwich({ ...sandwich, [id]: !sandwich[id] }, order.ingredients)).toBe(false)
  })
  it.each([[6, 'perfect', 120], [6.4, 'good', 80], [6.9, 'ok', 40], [9, 'wrong', -40]] as const)('fuel amount %s grades %s', (amount, grade, points) => {
    expect(evaluateFuel('E5', 'E5', amount, 6)).toEqual({ grade, points })
    expect(evaluateFuel('RON95', 'E5', amount, 6).points).toBe(-40)
  })
  it('invalid fuel targets and non-finite fills do not score', () => {
    for (const amount of [NaN, Infinity, -1]) expect(evaluateFuel('E5', 'E5', amount, 6).points).toBe(-40)
    expect(evaluateFuel('E5', 'E5', 6, 0).points).toBe(-40)
  })
  it('cargo drops require a real truck, with bounded combo bonuses', () => {
    expect([60, 180, 300].map(x => cargoDrop(x, 510))).toEqual(['river', 'market', 'garden'])
    for (const [x, y] of [[120, 510], [180, 270], [-1, 510], [180, 560]]) expect(cargoDrop(x, y)).toBeNull()
    expect(cargoPoints(true, 1)).toBe(90); expect(cargoPoints(true, 2)).toBe(95)
    expect(cargoPoints(true, 1000)).toBe(120); expect(cargoPoints(false, 8)).toBe(-35)
  })
  it('sweeping uses the full drag segment, not only sampled pixels, and penalties reduce bonuses', () => {
    expect(sweepDistance({x: 50,y: 20}, {x: 0,y: 0}, {x: 100,y: 0})).toBe(20)
    expect(sweepDistance({x: 3,y: 4}, {x: 0,y: 0}, {x: 0,y: 0})).toBe(5)
    expect([0, 1, 4, 20].map(cleaningPoints)).toEqual([140, 130, 100, 100])
  })
  it('circuits have complete/perfect, correct, mistake and invalid outcomes', () => {
    expect([0, 1, 2, 5].map(n => circuitPoints(n, true))).toEqual([120, 80, 40, 40])
    expect(circuitPoints(0, false)).toBe(-30)
  })
  it('difficulty increases but stays capped for all five games', () => {
    expect(breadPatience(100)).toBe(7); expect(breadPatience(0)).toBe(13)
    expect(fuelRate(100)).toBe(GAS_CONFIG.maximumRate); expect(fuelRate(0)).toBe(GAS_CONFIG.initialRate)
    expect(cargoPatience(0)).toBe(9); expect(cargoPatience(100)).toBe(5)
    expect(cleaningDifficulty(0)).toEqual({ count: 8, seconds: 15 })
    expect(cleaningDifficulty(100)).toEqual({ count: 12, seconds: 10 })
    expect(circuitDifficulty(0)).toEqual({ count: 3, seconds: 14 })
    expect(circuitDifficulty(100)).toEqual({ count: 4, seconds: 9 })
  })
})
