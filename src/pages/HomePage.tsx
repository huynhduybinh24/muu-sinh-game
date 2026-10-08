import { ScreenShell } from '../components/ScreenShell'
import { PlayerAvatar } from '../components/PlayerAvatar'
import { BottomNav } from '../components/BottomNav'
import { formatMoney } from '../services/formatters'
import { LevelProgress } from '../components/LevelProgress'
import { useProgressStore } from '../store/progressStore'
import { getMissionViews } from '../services/dailyMissions'
import { getDailyRewardStatus } from '../services/dailyRewards'
import type { Job } from '../types/job'
import { GameIcon } from '../components/GameIcon'

interface HomePageProps {
  dailyJob: Job
  localDateKey: string
  canInstall: boolean
  showIosInstallHint: boolean
  onStart: () => void
  onCareer: () => void
  onProfile: () => void
  onInstall: () => Promise<void>
  onShop: () => void
  onMissions: () => void
  onReward: () => void
  onTown: () => void
}

export function HomePage({ dailyJob, localDateKey, canInstall, showIosInstallHint, onStart, onCareer, onProfile, onInstall, onShop, onMissions, onReward, onTown }: HomePageProps) {
  const progress = useProgressStore()
  const completedToday = progress.lastCompletedDate === localDateKey
  const missions = getMissionViews(progress.dailyMissions, localDateKey)
  const reward = getDailyRewardStatus(progress, localDateKey)

  return (
    <ScreenShell header={<><h1 className="home-brand" aria-label="MƯU SINH">MƯU SINH<span> Mỗi ngày một nghề</span></h1>
      <button className="home-shop-link" type="button" onClick={onShop}>CỬA HÀNG</button></>}
      contentClassName="home-content"
      footer={<>
        <BottomNav active="home" onHome={() => undefined} onCareer={onCareer} onProfile={onProfile} />
        {canInstall ? <button className="install-button" type="button" onClick={() => void onInstall()}>↓ CÀI GAME</button> : null}
        {showIosInstallHint ? <p className="ios-install-hint">Trên Safari: Chia sẻ → Thêm vào Màn hình chính</p> : null}
        {import.meta.env.DEV ? <button className="dev-reset" type="button" onClick={onProfile} title="Mở quản lý dữ liệu để xác nhận xóa">Reset Progress (dev)</button> : null}
      </>}>
      <section className="home-player" aria-label="Người chơi">
        <button className="avatar-link" type="button" onClick={onProfile} aria-label="Mở hồ sơ của bạn">
          <PlayerAvatar appearance={progress.profile.appearance} size={105} />
        </button>
        <div><p className="eyebrow">Hôm nay, mình cùng cố lên!</p><h2>{progress.profile.playerName}</h2>
          <LevelProgress xp={progress.xp} /></div>
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
        <div className="daily-card-body"><span className="daily-job-icon" aria-hidden="true"><GameIcon name={dailyJob.id} size={52} /></span>
          <div><h2 id="daily-job-title">{dailyJob.name}</h2><p>{dailyJob.description}</p></div></div>
        {completedToday ? <strong className="daily-complete">✓ ĐÃ ĐI LÀM HÔM NAY</strong> : null}
        <div className="home-job-actions"><button className="primary-button" type="button" onClick={onStart}>{completedToday ? 'CHƠI LẠI' : 'ĐI LÀM'} →</button>
          <button className="home-town-button" type="button" onClick={onTown} aria-label="KHÁM PHÁ THỊ TRẤN"><GameIcon name="home" size={26} /><span>KHÁM PHÁ<br />THỊ TRẤN</span></button></div>
      </section>
      <section className="home-daily-extras" aria-label="Nhiệm vụ và quà hôm nay">
        <div className="home-missions-preview">
          <div><h2>NHIỆM VỤ HÔM NAY</h2><button type="button" onClick={onMissions}>XEM TẤT CẢ</button></div>
          <p>{missions.filter((mission) => mission.claimed).length} / 3 đã nhận · {missions.filter((mission) => mission.completed && !mission.claimed).length} thưởng sẵn sàng</p>
          <div className="home-mission-dots">{missions.map((mission) => <span key={mission.id} className={mission.completed ? 'mission-dot--complete' : ''}>
            {mission.claimed ? '✓' : '🎯'} {Math.round(mission.progress / mission.target * 100)}%
          </span>)}</div>
        </div>
        <div className="home-reward-entry"><div><strong>🎁 QUÀ HÔM NAY · {reward.cycleDay}/7</strong><small>{reward.eligible ? `+${formatMoney(reward.reward.money)}${reward.reward.xp ? ` · +${reward.reward.xp} XP` : ''}` : '✓ ĐÃ NHẬN QUÀ HÔM NAY'}</small></div>
          <button type="button" onClick={onReward} disabled={!reward.eligible}>{reward.eligible ? 'NHẬN QUÀ' : 'ĐÃ NHẬN'}</button></div>
      </section>
      <p className="home-signoff">Một ca làm nhỏ, một câu chuyện mới. ✨</p>
    </ScreenShell>
  )
}
