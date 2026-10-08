import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { createGameConfig } from './config/createGameConfig'
import { setGamePaused } from './lifecycle'
import type { GameResult } from '../types/game'
import type { Job } from '../types/job'
import type { PlayerProfile } from '../types/profile'

interface PhaserGameProps {
  job: Job
  onComplete: (result: GameResult) => void
  profile: PlayerProfile
  paused?: boolean
}

export function PhaserGame({ job, onComplete, profile, paused = false }: PhaserGameProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const completionRef = useRef(onComplete)
  const profileRef = useRef(profile)
  const gameRef = useRef<Phaser.Game | null>(null)
  const pausedRef = useRef(paused)
  useEffect(() => {
    pausedRef.current = paused
    const game = gameRef.current
    if (game?.isBooted && (paused || game.isPaused)) setGamePaused(game, paused)
  }, [paused])

  useEffect(() => {
    completionRef.current = onComplete
    profileRef.current = profile
  }, [onComplete, profile])

  useEffect(() => {
    if (!parentRef.current) return

    const game = new Phaser.Game(
      createGameConfig(parentRef.current, job, (result) => completionRef.current(result), profileRef.current),
    )
    gameRef.current = game
    let readyFrame: number | null = null
    const onReady = () => {
      // READY precedes loop.start(); sleep after startup, including a pause during boot.
      if (pausedRef.current) readyFrame = window.requestAnimationFrame(() => {
        if (gameRef.current === game && pausedRef.current) setGamePaused(game, true)
      })
    }
    game.events.once(Phaser.Core.Events.READY, onReady)

    return () => {
      gameRef.current = null
      if (readyFrame !== null) window.cancelAnimationFrame(readyFrame)
      game.events.off(Phaser.Core.Events.READY, onReady)
      game.destroy(true)
      // destroy() is deferred until a frame; a sleeping native game needs a frame to clean up.
      if (!game.loop.running) game.loop.wake()
    }
  }, [job])

  return (
    <div
      ref={parentRef}
      className="game-canvas-frame game-canvas-frame--tall"
      aria-label="Khu vực trò chơi"
    />
  )
}
