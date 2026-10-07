import { ScreenShell } from '../components/ScreenShell'
import { playAudioCue, primeAudio } from '../services/audioFeedback'
import type { Job } from '../types/job'
import { GameIcon } from '../components/GameIcon'

interface JobRevealPageProps {
  job: Job
  onPlay: () => void
}

export function JobRevealPage({ job, onPlay }: JobRevealPageProps) {
  const handlePlay = () => {
    primeAudio()
    playAudioCue('click')
    onPlay()
  }

  return (
    <ScreenShell
      header={<span className="day-pill">Bốc nghề thành công</span>}
      contentClassName="reveal-content"
      footer={
        <button className="primary-button" type="button" onClick={handlePlay}>
          ĐI LÀM →
        </button>
      }
    >
      <p className="eyebrow">Mỗi ngày 1 nghề</p>
      <article className="job-card">
        <div className="job-icon" aria-hidden="true">
          <GameIcon name={job.id} size={102} />
        </div>
        <h1 className="job-name">{job.name}</h1>
        <p className="job-description">{job.description}</p>
        <div className="job-meta">
          <span className="meta-pill">Độ khó: {job.difficulty}</span>
          <span className="meta-pill">⏱ {job.duration}s</span>
        </div>
      </article>
    </ScreenShell>
  )
}
