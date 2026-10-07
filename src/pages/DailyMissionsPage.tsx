import { useState } from 'react'
import { ScreenShell } from '../components/ScreenShell'
import { BottomNav } from '../components/BottomNav'
import { LevelProgress } from '../components/LevelProgress'
import { getMissionViews } from '../services/dailyMissions'
import { formatMoney } from '../services/formatters'
import { useProgressStore } from '../store/progressStore'
import type { MissionId } from '../types/daily'

interface DailyMissionsPageProps {
  dateKey: string
  onHome: () => void
  onCareer: () => void
  onProfile: () => void
  onClaim: (id: MissionId) => boolean
}
export function DailyMissionsPage({ dateKey, onHome, onCareer, onProfile, onClaim }: DailyMissionsPageProps) {
  const progress = useProgressStore()
  const [message, setMessage] = useState('')
  const missions = getMissionViews(progress.dailyMissions, dateKey)
  return <ScreenShell header={<span>Nhiệm vụ · {dateKey}</span>} contentClassName="missions-content"
    footer={<BottomNav active="missions" onHome={onHome} onCareer={onCareer} onProfile={onProfile} />}>
    <div className="page-heading"><p className="eyebrow">Mỗi ca một bước tiến</p><h1>NHIỆM VỤ HÔM NAY</h1></div>
    <div className="mission-wallet"><strong>💵 {formatMoney(progress.money)}</strong><LevelProgress xp={progress.xp} /></div>
    <p className="privacy-note">3 nhiệm vụ cố định mỗi ngày. Chơi lại vẫn tính; nhận thưởng trước khi sang ngày mới.</p>
    <div className="daily-mission-list">
      {missions.map((mission) => <article key={`${dateKey}:${mission.id}`} data-mission-id={mission.id}
        className={`daily-mission-card${mission.completed ? ' daily-mission-card--complete' : ''}${mission.claimed ? ' daily-mission-card--claimed' : ''}`}>
        <h2>🎯 {mission.title}</h2><p>{mission.description}</p>
        <div className="mission-meter" role="progressbar" aria-label={mission.title} aria-valuemin={0} aria-valuemax={mission.target} aria-valuenow={mission.progress}>
          <span style={{ width: `${mission.progress / mission.target * 100}%` }} />
        </div>
        <div className="mission-progress-label"><span>{mission.progress.toLocaleString('vi-VN')} / {mission.target.toLocaleString('vi-VN')}</span>
          {mission.completed ? <strong>{mission.claimed ? '✓ ĐÃ NHẬN' : '✓ HOÀN THÀNH'}</strong> : null}</div>
        <div className="mission-prize">+{formatMoney(mission.rewardMoney)} <span>+{mission.rewardXp} XP</span></div>
        <button className="secondary-button" type="button" disabled={!mission.completed || mission.claimed}
          onClick={() => { if (onClaim(mission.id)) setMessage(`Đã nhận thưởng: ${mission.title}!`) }}>
          {mission.claimed ? '✓ ĐÃ NHẬN' : 'NHẬN THƯỞNG'}
        </button>
      </article>)}
    </div>
    <p className="daily-claim-status" role="status" aria-live="polite">{message}</p>
  </ScreenShell>
}
