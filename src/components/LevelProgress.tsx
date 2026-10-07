import { getLevelProgress } from '../services/level'

export function LevelProgress({ xp }: { xp: number }) {
  const progress = getLevelProgress(xp)
  return <div className="level-progress">
    <span className="level-badge">CẤP {progress.level}</span>
    <span className="xp-label">{progress.current.toLocaleString('vi-VN')} / {progress.required.toLocaleString('vi-VN')} XP</span>
    <div className="xp-track" role="progressbar" aria-label="Tiến độ XP" aria-valuemin={0} aria-valuemax={progress.required} aria-valuenow={progress.current}>
      <span style={{ width: `${progress.percent}%` }} />
    </div>
  </div>
}
