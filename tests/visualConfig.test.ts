import { afterEach, describe, expect, it, vi } from 'vitest'
import { jobs } from '../src/data/jobs'
import { reducedMotion, sceneThemes, VISUAL_LIMITS, visualRandom } from '../src/game/visual/sceneTheme'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })
describe('pure visual configuration', () => {
  it('provides a valid palette for all six existing jobs without adding jobs', () => {
    expect(Object.keys(sceneThemes).sort()).toEqual(jobs.map(({ id }) => id).sort())
    for (const palette of Object.values(sceneThemes)) for (const color of Object.values(palette)) {
      expect(Number.isInteger(color)).toBe(true)
      expect(color).toBeGreaterThanOrEqual(0)
      expect(color).toBeLessThanOrEqual(0xffffff)
    }
  })
  it('caps pooled particles and keeps motion/transition budgets small', () => {
    expect(VISUAL_LIMITS.particles).toBeLessThanOrEqual(24)
    expect(VISUAL_LIMITS.burst).toBeLessThanOrEqual(VISUAL_LIMITS.particles)
    expect(VISUAL_LIMITS.shakeMs).toBeLessThanOrEqual(100)
    expect(VISUAL_LIMITS.foamIntervalMs).toBeGreaterThanOrEqual(80)
    expect(VISUAL_LIMITS.transitionMs).toBeLessThanOrEqual(250)
  })
  it('uses deterministic visual randomness without consuming gameplay Math.random', () => {
    const gameplayRandom = vi.spyOn(Math, 'random')
    const a = visualRandom(713), b = visualRandom(713), c = visualRandom(714)
    const sequence = Array.from({ length: 50 }, a)
    expect(sequence).toEqual(Array.from({ length: 50 }, b))
    expect(sequence).not.toEqual(Array.from({ length: 50 }, c))
    expect(sequence.every((value) => value >= 0 && value < 1)).toBe(true)
    expect(gameplayRandom).not.toHaveBeenCalled()
  })
  it('respects reduced motion and falls back safely without matchMedia', () => {
    vi.stubGlobal('window', {})
    expect(reducedMotion()).toBe(false)
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) })
    expect(reducedMotion()).toBe(true)
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) })
    expect(reducedMotion()).toBe(false)
  })
})
