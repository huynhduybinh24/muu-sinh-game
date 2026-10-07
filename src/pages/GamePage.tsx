import { useCallback, useState } from 'react'
import { GameStartOverlay } from '../components/GameStartOverlay'
import { ScreenShell } from '../components/ScreenShell'
import { PhaserGame } from '../game/PhaserGame'
import { useProgressStore } from '../store/progressStore'
import { tutorials } from '../data/tutorials'
import type { GameResult } from '../types/game'
import type { Job } from '../types/job'
import { GameIcon } from '../components/GameIcon'

interface GamePageProps {
  job: Job
  onComplete: (result: GameResult) => void
}

export function GamePage({ job, onComplete }: GamePageProps) {
  const profile = useProgressStore((state) => state.profile)
  const [isPlaying, setIsPlaying] = useState(false)
  const startGame = useCallback(() => setIsPlaying(true), [])
  const subtitle =
    job.id === 'sugarcane'
      ? 'Phục vụ khách thật nhanh'
      : job.id === 'construction'
        ? 'Xây tháp thật vững'
        : job.id === 'shipper' ? 'Giao hàng khắp phố' : tutorials[job.id].objective
  const instructions =
    job.id === 'sugarcane'
      ? 'Pha đúng món, ép mía rồi giao trước khi khách hết kiên nhẫn.'
      : job.id === 'construction'
        ? 'Chạm vào khu vực chơi để thả gạch đúng vị trí.'
        : job.id === 'shipper' ? 'Giữ nút điều hướng để lấy hàng, né chướng ngại và giao đúng khách.'
          : tutorials[job.id].steps.join(' → ')

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
          <GameIcon name={job.id} />
        </span>
        <div>
          <h1>{job.name}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      {isPlaying ? (
        <PhaserGame job={job} onComplete={onComplete} profile={profile} />
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
