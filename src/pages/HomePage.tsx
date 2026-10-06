import { ScreenShell } from '../components/ScreenShell'
import { PlayerAvatar } from '../components/PlayerAvatar'
import { BottomNav } from '../components/BottomNav'
import { formatMoney } from '../services/formatters'
import { getPlayerLevel } from '../services/playerProfile'
import { useProgressStore } from '../store/progressStore'
import type { Job } from '../types/job'

interface HomePageProps {
  dailyJob: Job
  localDateKey: string
  canInstall: boolean
  showIosInstallHint: boolean
  onStart: () => void
  onCareer: () => void
  onProfile: () => void
  onInstall: () => Promise<void>
}

export function HomePage({ dailyJob, localDateKey, canInstall, showIosInstallHint, onStart, onCareer, onProfile, onInstall }: HomePageProps) {
  const progress = useProgressStore()
  const completedToday = progress.lastCompletedDate === localDateKey

  return (
    <ScreenShell header={<h1 className="home-brand" aria-label="MƯU SINH">MƯU SINH<span> Mỗi ngày một nghề</span></h1>}
      contentClassName="home-content"
      footer={<>
        <BottomNav active="home" onHome={() => undefined} onCareer={onCareer} onProfile={onProfile} />
        {canInstall ? <button className="install-button" type="button" onClick={() => void onInstall()}>↓ CÀI GAME</button> : null}
        {showIosInstallHint ? <p className="ios-install-hint">Trên Safari: Chia sẻ → Thêm vào Màn hình chính</p> : null}
        {import.meta.env.DEV ? <button className="dev-reset" type="button" onClick={progress.resetProgress}>Reset Progress (dev)</button> : null}
      </>}>
      <section className="home-player" aria-label="Người chơi">
        <button className="avatar-link" type="button" onClick={onProfile} aria-label="Mở hồ sơ của bạn">
          <PlayerAvatar appearance={progress.profile.appearance} size={105} />
        </button>
        <div><p className="eyebrow">Hôm nay, mình cùng cố lên!</p><h2>{progress.profile.playerName}</h2>
          <span className="level-badge">CẤP {getPlayerLevel(progress.totalGamesPlayed)}</span></div>
        <span className="player-spark" aria-hidden="true">✦</span>
      </section>
      <div className="home-wallet" aria-label="Tiến trình người chơi">
        <div><span>💵 TIỀN</span><strong>{formatMoney(progress.money)}</strong></div>
        <div><span>⭐ DANH TIẾNG</span><strong>{progress.reputation.toLocaleString('vi-VN')} <small>điểm</small></strong></div>
      </div>
      <div className="home-streak">
        <span className="streak-flame" aria-hidden="true">🔥</span>
        <div><strong>{progress.currentStreak} ngày liên tiếp</strong><span>Kỷ lục: {progress.bestStreak} ngày</span></div>
        <span className="streak-note">Mỗi ngày<br />một bước tiến</span>
      </div>
      <section className="daily-job-card home-daily-card" aria-labelledby="daily-job-title">
        <div className="daily-card-heading"><span className="daily-job-label">NGHỀ HÔM NAY</span><span className="daily-date">{localDateKey}</span></div>
        <div className="daily-card-body"><span className="daily-job-icon" aria-hidden="true">{dailyJob.icon}</span>
          <div><h2 id="daily-job-title">{dailyJob.name}</h2><p>{dailyJob.description}</p></div></div>
        {completedToday ? <strong className="daily-complete">✓ ĐÃ ĐI LÀM HÔM NAY</strong> : null}
        <button className="primary-button" type="button" onClick={onStart}>{completedToday ? 'CHƠI LẠI' : 'ĐI LÀM'} →</button>
      </section>
      <p className="home-signoff">Một ca làm nhỏ, một câu chuyện mới. ✨</p>
    </ScreenShell>
  )
}
