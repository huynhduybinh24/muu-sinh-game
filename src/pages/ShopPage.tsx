import { useEffect, useRef, useState } from 'react'
import { BottomNav } from '../components/BottomNav'
import { PlayerAvatar } from '../components/PlayerAvatar'
import { ProductArtwork } from '../components/ProductArtwork'
import { LevelProgress } from '../components/LevelProgress'
import { ScreenShell } from '../components/ScreenShell'
import { shopItems, isClothingItem } from '../data/shop'
import { SHOP_CONFIRM_PRICE, priceTier, shopCategories } from '../data/lifestyle'
import { getPurchaseStatus, ownsItem } from '../services/inventory'
import { isProductEquipped } from '../services/lifestyle'
import { defaultShopFilter, filterProducts, previewProduct } from '../services/shopFilters'
import { formatMoney } from '../services/formatters'
import { playAudioCue, primeAudio } from '../services/audioFeedback'
import { useProgressStore } from '../store/progressStore'
import type { AchievementUnlock } from '../types/game'
import type { ItemCategory, ShopItem } from '../types/shop'

interface ShopPageProps {
  wardrobe?: boolean
  initialCategory?: ItemCategory
  onHome: () => void
  onCareer: () => void
  onProfile: () => void
  onAchievements: (unlocks: AchievementUnlock[]) => void
  onLifestyle?: (view: 'devices' | 'garage' | 'room') => void
}
export function ShopPage({ wardrobe = false, initialCategory = 'hair', onHome, onCareer, onProfile, onAchievements, onLifestyle }: ShopPageProps) {
  const progress = useProgressStore()
  const [category, setCategory] = useState<ItemCategory>(initialCategory)
  const [selected, setSelected] = useState<ShopItem | null>(null)
  const [confirmation, setConfirmation] = useState<ShopItem | null>(null)
  const [filter, setFilter] = useState(defaultShopFilter)
  const [message, setMessage] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { if (confirmation) { const element = dialog.current; element?.showModal(); return () => element?.close() } }, [confirmation])
  const preview = selected ? previewProduct(progress.profile, selected) : progress.profile
  const items = filterProducts(shopItems.filter(item => item.category === category && (!wardrobe || ownsItem(progress.ownedItemIds, item.id))), filter, progress.ownedItemIds, progress.money)
  const buy = (item: ShopItem) => {
    const outcome = useProgressStore.getState().purchaseItem(item.id)
    setConfirmation(null)
    if (outcome.status === 'purchased') { setMessage(`Đã mua ${item.name}! Chạm TRANG BỊ để dùng.`); playAudioCue('success'); onAchievements(outcome.newAchievements) }
    else { setMessage(outcome.status === 'owned' ? 'Bạn đã sở hữu món này.' : 'Chưa thể mua món này. Số dư có thể đã thay đổi.'); playAudioCue('error') }
  }
  const act = (item: ShopItem) => {
    primeAudio()
    if (ownsItem(progress.ownedItemIds, item.id)) {
      const before = useProgressStore.getState().achievements
      if (isProductEquipped(progress.profile, item) && !isClothingItem(item)) { progress.unequipItem(item.id); setMessage(`Đã cất ${item.name}.`) }
      else if (progress.equipItem(item.id)) { setMessage(`Đã trang bị ${item.name}.`); playAudioCue('success') }
      onAchievements(useProgressStore.getState().achievements.filter(unlock => !before.some(old => old.id === unlock.id)))
    } else if (!wardrobe) { if (item.price >= SHOP_CONFIRM_PRICE) setConfirmation(item); else buy(item) }
  }
  return <ScreenShell header={<span>Tiền đi làm · Niềm vui của bạn</span>} contentClassName="shop-content"
    footer={<BottomNav active={wardrobe ? 'wardrobe' : 'shop'} onHome={onHome} onCareer={onCareer} onProfile={onProfile} />}>
    <div className="page-heading"><p className="eyebrow">Phố mua sắm · 100 thiết kế riêng</p><h1>{wardrobe ? 'TỦ ĐỒ' : 'CỬA HÀNG'}</h1></div>
    <section className="shop-identity" aria-label="Xem trước nhân vật">
      <PlayerAvatar appearance={preview.appearance} lifestyle={preview.lifestyle} size={95} /><div><strong>{progress.profile.playerName}</strong>
        <p className="shop-money">💵 {formatMoney(progress.money)}</p><LevelProgress xp={progress.xp} /></div>
    </section>
    {onLifestyle && <nav className="lifestyle-links" aria-label="Đồ của tôi"><button onClick={() => onLifestyle('devices')}>THIẾT BỊ</button><button onClick={() => onLifestyle('garage')}>GARA</button><button onClick={() => onLifestyle('room')}>PHÒNG CỦA TÔI</button></nav>}
    {selected && !isClothingItem(selected) && <section className="product-preview" aria-label="Xem thử sản phẩm"><ProductArtwork item={selected} size={145} /><div><strong>{selected.name}</strong><p>{selected.description}</p></div></section>}
    <p className="preview-note">{selected ? isProductEquipped(progress.profile, selected) ? `Đang dùng: ${selected.name}` : `Đang xem thử: ${selected.name} · Chưa đổi đồ đang mặc` : 'Chạm hình để xem thử. Chưa mua thì chưa trừ tiền.'}</p>
    <div className="shop-tabs" role="tablist" aria-label="Loại sản phẩm">
      {(Object.keys(shopCategories) as ItemCategory[]).filter(id => !wardrobe || ['hair','shirt','pants','shoes','accessory','tools'].includes(id)).map(id => <button key={id} type="button" role="tab" id={`tab-${id}`} aria-controls="shop-items" aria-selected={category === id}
        onClick={() => { setCategory(id); setSelected(null); setMessage(''); setFilter(defaultShopFilter) }}>{shopCategories[id]}</button>)}
    </div>
    <details className="shop-filters"><summary>TÌM & LỌC SẢN PHẨM</summary><div>
      <label>Tìm tên<input type="search" value={filter.search} onChange={event => setFilter({ ...filter, search: event.target.value })} placeholder="Tên món đồ…" /></label>
      <label>Sở hữu<select value={filter.owned} onChange={event => setFilter({ ...filter, owned: event.target.value as typeof filter.owned })}><option value="all">Tất cả</option><option value="owned">Đã sở hữu</option><option value="unowned">Chưa sở hữu</option></select></label>
      <label>Mức giá<select value={String(filter.maxPrice)} onChange={event => setFilter({ ...filter, maxPrice: Number(event.target.value) })}><option value="Infinity">Mọi mức giá</option><option value="100000">Đến 100.000đ</option><option value="1000000">Đến 1.000.000đ</option><option value="10000000">Đến 10.000.000đ</option></select></label>
      <label>Sắp xếp<select value={filter.sort} onChange={event => setFilter({ ...filter, sort: event.target.value as typeof filter.sort })}><option value="catalog">Gợi ý của phố</option><option value="low">Giá tăng dần</option><option value="high">Giá giảm dần</option></select></label>
      <label className="shop-affordable"><input type="checkbox" checked={filter.affordable} onChange={event => setFilter({ ...filter, affordable: event.target.checked })} />Vừa túi tiền</label>
    </div></details>
    <p className="shop-status" role="status" aria-live="polite">{message || `${items.length} món trong góc ${shopCategories[category].toLocaleLowerCase('vi-VN')}`}</p>
    <div className="shop-grid" id="shop-items" role="tabpanel" aria-labelledby={`tab-${category}`}>
      {items.map(item => {
        const owned = ownsItem(progress.ownedItemIds, item.id), equipped = isProductEquipped(progress.profile, item), status = getPurchaseStatus(progress, item.id)
        const label = equipped ? isClothingItem(item) ? 'ĐANG DÙNG' : 'CẤT ĐI' : owned ? 'TRANG BỊ' : status === 'level-locked' ? `MỞ Ở LEVEL ${item.unlockLevel}` : status === 'insufficient-money' ? 'KHÔNG ĐỦ TIỀN' : 'MUA'
        return <article key={item.id} className={`shop-item${selected?.id === item.id ? ' shop-item--selected' : ''}${owned ? ' shop-item--owned' : ''}`} data-item-id={item.id}>
          <button className="item-preview" type="button" aria-label={`Xem thử ${item.name}`} aria-pressed={selected?.id === item.id} onClick={() => { setSelected(item); primeAudio(); playAudioCue('click') }}>
            {isClothingItem(item) ? <PlayerAvatar appearance={previewProduct(progress.profile, item).appearance} lifestyle={progress.profile.lifestyle} size={76} state="static" /> : <ProductArtwork item={item} size={110} />}
          </button>
          <span className="item-rarity">{owned ? equipped ? '✓ ĐANG DÙNG' : '✓ ĐÃ SỞ HỮU' : priceTier(item.price)}</span><h2>{item.name}</h2>
          <p>{owned ? 'ĐÃ SỞ HỮU' : formatMoney(item.price)}</p>
          <button className="item-action" type="button" disabled={(equipped && isClothingItem(item)) || (!owned && status !== 'purchased')} onClick={() => act(item)}>{label}</button>
        </article>
      })}
    </div>
    {!items.length && <p className="shop-empty">Chưa có món phù hợp. Thử đổi bộ lọc hoặc ghé Shop mua sắm nhé.</p>}
    <p className="privacy-note">Chỉ dùng tiền trong game. Mọi món đồ đều là phong cách, không tăng điểm hay tốc độ.</p>
    {confirmation && <dialog ref={dialog} className="purchase-dialog" aria-labelledby="purchase-title" onCancel={event => { event.preventDefault(); setConfirmation(null) }}>
      <h2 id="purchase-title">Tự thưởng một món lớn?</h2><ProductArtwork item={confirmation} /><strong>{confirmation.name}</strong><p>{formatMoney(confirmation.price)}</p><p>Số dư sau mua: {formatMoney(Math.max(0, progress.money - confirmation.price))}</p>
      <div><button className="secondary-button" onClick={() => setConfirmation(null)}>ĐỂ SAU</button><button className="primary-button" onClick={() => buy(confirmation)}>XÁC NHẬN MUA</button></div>
    </dialog>}
  </ScreenShell>
}
