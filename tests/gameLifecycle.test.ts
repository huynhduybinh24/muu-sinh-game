import { describe, expect, it, vi } from 'vitest'
import type Phaser from 'phaser'
import { setGamePaused } from '../src/game/lifecycle'

describe('native Phaser lifecycle boundary', () => {
  function fixture() {
    const input = { emit: vi.fn(), resetPointers: vi.fn(), keyboard: { resetKeys: vi.fn() } }
    const game = { scene: { getScenes: vi.fn(() => [{ input }]) }, pause: vi.fn(), resume: vi.fn(), loop: { sleep: vi.fn(), wake: vi.fn() } }
    return { input, game, phaser: game as unknown as Phaser.Game }
  }
  it('cancels interrupted gestures and sleeps the engine without rewriting scores/timers', () => {
    const { game, input, phaser } = fixture()
    setGamePaused(phaser, true)
    expect(input.emit).toHaveBeenCalledExactlyOnceWith('nativepause')
    expect(input.resetPointers).toHaveBeenCalledOnce()
    expect(input.keyboard.resetKeys).toHaveBeenCalledOnce()
    expect(game.pause).toHaveBeenCalledOnce()
    expect(game.loop.sleep).toHaveBeenCalledOnce()
    expect(game.resume).not.toHaveBeenCalled()
  })
  it('resets loop timing and resumes the same game instead of making another instance', () => {
    const { game, input, phaser } = fixture()
    setGamePaused(phaser, false)
    expect(game.loop.wake).toHaveBeenCalledOnce()
    expect(game.resume).toHaveBeenCalledOnce()
    expect(input.emit).not.toHaveBeenCalled()
  })
})
