import { BottomNav } from '../components/BottomNav'
import { PlayerAvatar } from '../components/PlayerAvatar'
import { ScreenShell } from '../components/ScreenShell'
import { StatCard } from '../components/StatCard'
import { formatMoney } from '../services/formatters'
import { getPlayerLevel } from '../services/playerProfile'
import { useProgressStore } from '../store/progressStore'

interface ProfilePageProps {
  onHome: () => void
  onCareer: () => void
  onEdit: () => void
}

export function ProfilePage({ onHome, onCareer, onEdit }: ProfilePageProps) {
  const progress = useProgressStore()
  return (
    <ScreenShell header={<span>Góc riêng của bạn</span>} contentClassName="profile-content"
      footer={<BottomNav active="profile" onHome={onHome} onCareer={onCareer} onProfile={() => undefined} />}>
      <div className="page-heading"><p className="eyebrow">Một nhân vật · Nhiều câu chuyện</p><h1>HỒ SƠ</h1></div>
      <section className="profile-identity">
        <div className="avatar-stage"><PlayerAvatar appearance={progress.profile.appearance} size={115} /></div>
        <h2>{progress.profile.playerName}</h2>
        <span className="level-badge">CẤP {getPlayerLevel(progress.totalGamesPlayed)}</span>
        <div className="wallet-row"><span>💵 {formatMoney(progress.money)}</span><span>⭐ {progress.reputation} điểm</span></div>
      </section>
      <div className="stats-grid profile-stats" aria-label="Thống kê hồ sơ">
        <StatCard icon="🎮" label="Tổng số ca" value={progress.totalGamesPlayed.toLocaleString('vi-VN')} />
        <StatCard icon="📅" label="Ngày đã làm" value={progress.totalDaysWorked.toLocaleString('vi-VN')} />
        <StatCard icon="🔥" label="Chuỗi tốt nhất" value={`${progress.bestStreak} ngày`} />
        <StatCard icon="💰" label="Tổng thu nhập" value={formatMoney(progress.totalMoneyEarned)} />
      </div>
      <button className="primary-button profile-edit" type="button" onClick={onEdit}>CHỈNH SỬA NHÂN VẬT</button>
      <p className="privacy-note">Đổi diện mạo, giữ nguyên thành tích.<br />Hồ sơ lưu trên thiết bị này.</p>
    </ScreenShell>
  )
}
