import { useCallback, useState } from 'react'
import { GameStartOverlay } from '../components/GameStartOverlay'
import { ScreenShell } from '../components/ScreenShell'
import { PhaserGame } from '../game/PhaserGame'
import type { GameResult } from '../types/game'
import type { Job } from '../types/job'

interface GamePageProps {
  job: Job
  onComplete: (result: GameResult) => void
}

export function GamePage({ job, onComplete }: GamePageProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const startGame = useCallback(() => setIsPlaying(true), [])
  const subtitle =
    job.id === 'sugarcane'
      ? 'Phục vụ khách thật nhanh'
      : job.id === 'construction'
        ? 'Xây tháp thật vững'
        : 'Giao hàng khắp phố'
  const instructions =
    job.id === 'sugarcane'
      ? 'Pha đúng món, ép mía rồi giao trước khi khách hết kiên nhẫn.'
      : job.id === 'construction'
        ? 'Chạm vào khu vực chơi để thả gạch đúng vị trí.'
        : 'Giữ nút điều hướng để lấy hàng, né chướng ngại và giao đúng khách.'

  return (
    <ScreenShell
      header={
        <>
          <span>Ca làm đang chạy</span>
          <span className="day-pill">{job.duration} giây</span>
        </>
      }
      contentClassName="game-content"
    >
      <div className="game-heading">
        <span className="game-heading-icon" aria-hidden="true">
          {job.icon}
        </span>
        <div>
          <h1>{job.name}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      {isPlaying ? (
        <PhaserGame job={job} onComplete={onComplete} />
      ) : (
        <div className="game-canvas-frame game-canvas-frame--tall">
          <GameStartOverlay job={job} onReady={startGame} />
        </div>
      )}
      <p className="game-note">
        {instructions}
      </p>
    </ScreenShell>
  )
}
