import { BottomNav } from '../components/BottomNav'
import { ScreenShell } from '../components/ScreenShell'
import { ProductArtwork } from '../components/ProductArtwork'
import { RoomArtwork } from '../components/RoomArtwork'
import { shopItems, isClothingItem } from '../data/shop'
import { roomSlots } from '../data/lifestyle'
import { getLifestyle, isProductEquipped } from '../services/lifestyle'
import { formatMoney } from '../services/formatters'
import { playAudioCue, primeAudio } from '../services/audioFeedback'
import { useProgressStore } from '../store/progressStore'
import type { ItemCategory, RoomSlot } from '../types/shop'
import type { AchievementUnlock } from '../types/game'

export type LifestyleView = 'devices' | 'garage' | 'room'
interface Props { view: LifestyleView; onHome: () => void; onCareer: () => void; onProfile: () => void; onShop: (category: ItemCategory) => void; onView: (view: LifestyleView) => void; onAchievements: (unlocks: AchievementUnlock[]) => void }
export function LifestylePage({ view, onHome, onCareer, onProfile, onShop, onView, onAchievements }: Props) {
  const progress = useProgressStore(), life = getLifestyle(progress.profile)
  const category = view === 'garage' ? 'vehicle' : view === 'room' ? 'home' : 'phone'
  const items = shopItems.filter(item => progress.ownedItemIds.includes(item.id) && (view === 'devices' ? item.category === 'phone' || item.category === 'electronics' : item.category === category))
  const title = view === 'garage' ? 'GARA CỦA TÔI' : view === 'room' ? 'PHÒNG CỦA TÔI' : 'THIẾT BỊ CỦA TÔI'
  const selectItem = (id: string, remove = false) => {
    const before = useProgressStore.getState().achievements
    primeAudio(); if (remove) progress.unequipItem(id); else progress.equipItem(id)
    playAudioCue('success')
    onAchievements(useProgressStore.getState().achievements.filter(unlock => !before.some(old => old.id === unlock.id)))
  }
  return <ScreenShell header={<button type="button" className="town-home" onClick={onProfile}>← HỒ SƠ</button>} contentClassName="life-content"
    footer={<BottomNav active="profile" onHome={onHome} onCareer={onCareer} onProfile={onProfile} />}>
    <div className="page-heading"><p className="eyebrow">Làm chăm chỉ · Sống theo cách mình</p><h1>{title}</h1></div>
    <nav className="lifestyle-links" aria-label="Góc sống"><button onClick={() => onView('devices')}>THIẾT BỊ</button><button onClick={() => onView('garage')}>GARA</button><button onClick={() => onView('room')}>PHÒNG CỦA TÔI</button></nav>
    <section className="life-intro"><strong>{items.length} món đã sở hữu · {formatMoney(progress.money)}</strong><p>{view === 'garage' ? 'Chọn xe yêu thích. Town/Garage hiện mẫu xe; Shipper dùng màu xe máy/tay ga, Taxi dùng màu ô tô. Xe không hợp loại sẽ dùng xe mặc định. Tốc độ, va chạm và lương giữ nguyên.' : view === 'room' ? 'Đặt đồ vào từng góc cố định. Mỗi vị trí một món, đổi/cất miễn phí. Thiết bị đang chọn xuất hiện trên bàn khi có bàn.' : 'Bộ sưu tập thiết bị của riêng bạn. Chọn một điện thoại và một thiết bị cá nhân để khoe ở Hồ sơ và phòng riêng. Không tăng điểm hay thu nhập.'}</p>
      <button className="primary-button" onClick={() => onShop(category)}>GHÉ SHOP →</button>
      {view === 'devices' && <button className="text-button" onClick={() => onShop('electronics')}>XEM MÁY TÍNH & ĐIỆN TỬ</button>}
    </section>
    {view === 'room' ? <><RoomArtwork profile={progress.profile} /><div className="room-slots">
      {(Object.keys(roomSlots) as RoomSlot[]).map(slot => <label key={slot}>{roomSlots[slot]}<select aria-label={`Đặt ${roomSlots[slot]}`} value={life.room[slot] ?? ''} onChange={event => {
        if (event.target.value) selectItem(event.target.value)
        else if (life.room[slot]) selectItem(life.room[slot]!, true)
      }}><option value="">Chưa đặt</option>{items.filter(item => !isClothingItem(item) && item.slot === slot).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>)}
    </div></> : null}
    <div className="life-grid">{items.map(item => <article key={item.id} className="life-card" data-owned-item={item.id}>
      <ProductArtwork item={item} /><h2>{item.name}</h2><small>{isProductEquipped(progress.profile,item) ? '✓ ĐANG DÙNG' : 'ĐÃ SỞ HỮU'}</small>
      <button onClick={() => selectItem(item.id, isProductEquipped(progress.profile,item))}>{isProductEquipped(progress.profile,item) ? 'CẤT ĐI' : view === 'room' ? 'ĐẶT VÀO PHÒNG' : 'CHỌN DÙNG'}</button>
    </article>)}</div>
    {!items.length && <p className="shop-empty">Góc này còn trống. Đi làm, tiết kiệm rồi chọn món bạn thật sự thích nhé!</p>}
  </ScreenShell>
}
