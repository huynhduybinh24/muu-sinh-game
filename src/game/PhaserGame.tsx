import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { createGameConfig } from './config/createGameConfig'
import type { GameResult } from '../types/game'
import type { Job } from '../types/job'
import type { PlayerProfile } from '../types/profile'

interface PhaserGameProps {
  job: Job
  onComplete: (result: GameResult) => void
  profile: PlayerProfile
}

export function PhaserGame({ job, onComplete, profile }: PhaserGameProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const completionRef = useRef(onComplete)
  const profileRef = useRef(profile)

  useEffect(() => {
    completionRef.current = onComplete
    profileRef.current = profile
  }, [onComplete, profile])

  useEffect(() => {
    if (!parentRef.current) return

    const game = new Phaser.Game(
      createGameConfig(parentRef.current, job, (result) => completionRef.current(result), profileRef.current),
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
