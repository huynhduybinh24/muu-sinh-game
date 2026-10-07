import { useEffect, useRef, useState } from 'react'
import { tutorials } from '../data/tutorials'
import { playAudioCue, primeAudio } from '../services/audioFeedback'
import { useProgressStore } from '../store/progressStore'
import type { Job } from '../types/job'
import { GameIcon } from './GameIcon'

type StartPhase = 'tutorial' | 'intro' | 'countdown'

const countdownSteps = ['3', '2', '1', 'LÀM THÔI!'] as const

interface GameStartOverlayProps {
  job: Job
  onReady: () => void
}

export function GameStartOverlay({ job, onReady }: GameStartOverlayProps) {
  const completedTutorials = useProgressStore((state) => state.completedTutorials)
  const completeTutorial = useProgressStore((state) => state.completeTutorial)
  const tutorial = tutorials[job.id]
  const [phase, setPhase] = useState<StartPhase>(() =>
    completedTutorials.includes(job.id) ? 'intro' : 'tutorial',
  )
  const [dontShowAgain, setDontShowAgain] = useState(true)
  const [countdownIndex, setCountdownIndex] = useState(0)
  const playedCountdownRef = useRef(-1)

  useEffect(() => {
    if (phase !== 'intro') return
    const timer = window.setTimeout(() => {
      setCountdownIndex(0)
      setPhase('countdown')
    }, 1_050)
    return () => window.clearTimeout(timer)
  }, [phase])

  useEffect(() => {
    if (phase !== 'countdown') return
    if (playedCountdownRef.current !== countdownIndex) {
      playAudioCue(countdownIndex === countdownSteps.length - 1 ? 'success' : 'countdown')
      playedCountdownRef.current = countdownIndex
    }
    const timer = window.setTimeout(() => {
      if (countdownIndex === countdownSteps.length - 1) {
        onReady()
      } else {
        setCountdownIndex((index) => index + 1)
      }
    }, 650)
    return () => window.clearTimeout(timer)
  }, [countdownIndex, onReady, phase])

  const handleStart = () => {
    primeAudio()
    playAudioCue('click')
    if (dontShowAgain) completeTutorial(job.id)
    setPhase('intro')
  }

  if (phase === 'tutorial') {
    return (
      <div className="game-start-overlay tutorial-overlay" role="dialog" aria-modal="true">
        <span className="tutorial-icon" aria-hidden="true"><GameIcon name={job.id} size={64} /></span>
        <p className="eyebrow">Hướng dẫn nhanh</p>
        <h2>{tutorial.title}</h2>
        <ol>
          {tutorial.steps.map((step) => <li key={step}>{step}</li>)}
        </ol>
        <label className="tutorial-checkbox">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(event) => setDontShowAgain(event.target.checked)}
          />
          Không hiện lại
        </label>
        <button className="primary-button" type="button" onClick={handleStart}>
          BẮT ĐẦU
        </button>
      </div>
    )
  }

  if (phase === 'intro') {
    return (
      <div className="game-start-overlay intro-overlay">
        <span aria-hidden="true"><GameIcon name={job.id} size={82} /></span>
        <h2>{tutorial.title}</h2>
        <p>{tutorial.objective}</p>
      </div>
    )
  }

  return (
    <div className="game-start-overlay countdown-overlay" aria-live="assertive">
      <strong key={countdownIndex}>{countdownSteps[countdownIndex]}</strong>
    </div>
  )
}
