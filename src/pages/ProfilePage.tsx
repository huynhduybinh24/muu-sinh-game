import { BottomNav } from '../components/BottomNav'
import { PlayerAvatar } from '../components/PlayerAvatar'
import { ScreenShell } from '../components/ScreenShell'
import { StatCard } from '../components/StatCard'
import { formatMoney } from '../services/formatters'
import { LevelProgress } from '../components/LevelProgress'
import { useProgressStore } from '../store/progressStore'
import { SaveDataPanel } from '../components/SaveDataPanel'
import { ProductArtwork } from '../components/ProductArtwork'
import { getShopItem } from '../data/shop'
import { getLifestyle } from '../services/lifestyle'

interface ProfilePageProps {
  onHome: () => void
  onCareer: () => void
  onEdit: () => void
  onWardrobe: () => void
  onReinitialize: () => void
  onLifestyle: (view: 'devices' | 'garage' | 'room') => void
}

export function ProfilePage({ onHome, onCareer, onEdit, onWardrobe, onReinitialize, onLifestyle }: ProfilePageProps) {
  const progress = useProgressStore()
  const life = getLifestyle(progress.profile)
  return (
    <ScreenShell header={<span>Góc riêng của bạn</span>} contentClassName="profile-content"
      footer={<BottomNav active="profile" onHome={onHome} onCareer={onCareer} onProfile={() => undefined} />}>
      <div className="page-heading"><p className="eyebrow">Một nhân vật · Nhiều câu chuyện</p><h1>HỒ SƠ</h1></div>
      <section className="profile-identity">
        <div className="avatar-stage"><PlayerAvatar appearance={progress.profile.appearance} lifestyle={progress.profile.lifestyle} size={115} /></div>
        <h2>{progress.profile.playerName}</h2>
        <LevelProgress xp={progress.xp} />
        <div className="wallet-row"><span>💵 {formatMoney(progress.money)}</span><span>⭐ {progress.reputation} điểm</span></div>
      </section>
      <div className="stats-grid profile-stats" aria-label="Thống kê hồ sơ">
        <StatCard icon="🎮" label="Tổng số ca" value={progress.totalGamesPlayed.toLocaleString('vi-VN')} />
        <StatCard icon="📅" label="Ngày đã làm" value={progress.totalDaysWorked.toLocaleString('vi-VN')} />
        <StatCard icon="🔥" label="Chuỗi tốt nhất" value={`${progress.bestStreak} ngày`} />
        <StatCard icon="💰" label="Tổng thu nhập" value={formatMoney(progress.totalMoneyEarned)} />
      </div>
      <div className="profile-outfit-actions">
        <button className="primary-button profile-edit" type="button" onClick={onEdit}>CHỈNH SỬA NHÂN VẬT</button>
        <button className="secondary-button" type="button" onClick={onWardrobe}>TỦ ĐỒ</button>
      </div>
      <SaveDataPanel onReinitialize={onReinitialize} />
      <nav className="lifestyle-links" aria-label="Góc riêng"><button onClick={() => onLifestyle('devices')}>THIẾT BỊ</button><button onClick={() => onLifestyle('garage')}>GARA</button><button onClick={() => onLifestyle('room')}>PHÒNG CỦA TÔI</button></nav>
      {[life.phone,life.computer,life.vehicle].some(id => id !== null) && <section className="profile-lifestyle" aria-label="Đồ đang dùng">{[life.phone,life.computer,life.vehicle].filter(id => id !== null).map(id => {
        const item = getShopItem(id)!
        return <div key={id}><ProductArtwork item={item} size={85} /><strong>{item.name}</strong></div>
      })}</section>}
    </ScreenShell>
  )
}
