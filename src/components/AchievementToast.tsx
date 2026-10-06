import { useEffect } from 'react'
import { achievementsById } from '../data/achievements'
import type { AchievementId } from '../types/game'

interface AchievementToastProps {
  achievementId: AchievementId
  onDismiss: () => void
}

export function AchievementToast({ achievementId, onDismiss }: AchievementToastProps) {
  const achievement = achievementsById[achievementId]

  useEffect(() => {
    const timeoutId = window.setTimeout(onDismiss, 3_800)
    return () => window.clearTimeout(timeoutId)
  }, [achievementId, onDismiss])

  return (
    <aside className="achievement-toast" role="status" aria-live="polite">
      <span aria-hidden="true">🏆</span>
      <div>
        <small>THÀNH TỰU MỚI</small>
        <strong>{achievement.title}</strong>
        <p>{achievement.description}</p>
      </div>
      <button type="button" onClick={onDismiss} aria-label="Đóng thông báo thành tựu">×</button>
    </aside>
  )
}
