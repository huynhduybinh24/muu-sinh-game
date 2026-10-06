import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { createGameConfig } from './config/createGameConfig'
import type { GameResult } from '../types/game'
import type { Job } from '../types/job'

interface PhaserGameProps {
  job: Job
  onComplete: (result: GameResult) => void
}

export function PhaserGame({ job, onComplete }: PhaserGameProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const completionRef = useRef(onComplete)

  useEffect(() => {
    completionRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (!parentRef.current) return

    const game = new Phaser.Game(
      createGameConfig(parentRef.current, job, (result) => completionRef.current(result)),
    )

    return () => {
      game.destroy(true)
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
