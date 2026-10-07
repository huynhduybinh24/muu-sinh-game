import { useState } from 'react'
import { BottomNav } from '../components/BottomNav'
import { PlayerAvatar } from '../components/PlayerAvatar'
import { LevelProgress } from '../components/LevelProgress'
import { ScreenShell } from '../components/ScreenShell'
import { itemCategories, itemRarities, isItemEquipped, shopItems, withItem } from '../data/shop'
import { getPurchaseStatus, ownsItem } from '../services/inventory'
import { formatMoney } from '../services/formatters'
import { playAudioCue, primeAudio } from '../services/audioFeedback'
import { useProgressStore } from '../store/progressStore'
import type { AchievementUnlock } from '../types/game'
import type { ItemCategory, ShopItem } from '../types/shop'

interface ShopPageProps {
  wardrobe?: boolean
  onHome: () => void
  onCareer: () => void
  onProfile: () => void
  onAchievements: (unlocks: AchievementUnlock[]) => void
}
export function ShopPage({ wardrobe = false, onHome, onCareer, onProfile, onAchievements }: ShopPageProps) {
  const progress = useProgressStore()
  const [category, setCategory] = useState<ItemCategory>('hair')
  const [selected, setSelected] = useState<ShopItem | null>(null)
  const [message, setMessage] = useState('')
  const preview = selected ? withItem(progress.profile.appearance, selected) : progress.profile.appearance
  const items = shopItems.filter((item) => item.category === category && (!wardrobe || ownsItem(progress.ownedItemIds, item.id)))
  const act = (item: ShopItem) => {
    primeAudio()
    if (ownsItem(progress.ownedItemIds, item.id)) {
      if (progress.equipItem(item.id)) { setMessage(`Đã trang bị ${item.name}.`); playAudioCue('success') }
      return
    }
    if (wardrobe) return
    const outcome = progress.purchaseItem(item.id)
    if (outcome.status === 'purchased') {
      setMessage(`Đã mua ${item.name}! Chạm TRANG BỊ để dùng.`)
      playAudioCue('success')
      onAchievements(outcome.newAchievements)
    } else { setMessage('Chưa thể mua món này.'); playAudioCue('error') }
  }
  return <ScreenShell header={<span>{wardrobe ? 'Phong cách của bạn' : 'Mua sắm bằng tiền đi làm'}</span>}
    contentClassName="shop-content"
    footer={<BottomNav active={wardrobe ? 'wardrobe' : 'shop'} onHome={onHome} onCareer={onCareer} onProfile={onProfile} />}>
    <div className="page-heading"><p className="eyebrow">Mặc đẹp · Làm vui</p><h1>{wardrobe ? 'TỦ ĐỒ' : 'CỬA HÀNG'}</h1></div>
    <section className="shop-identity" aria-label="Xem trước nhân vật">
      <PlayerAvatar appearance={preview} size={95} /><div><strong>{progress.profile.playerName}</strong>
        <p className="shop-money">💵 {formatMoney(progress.money)}</p><LevelProgress xp={progress.xp} />
      </div>
    </section>
    <p className="preview-note">{selected ? isItemEquipped(progress.profile.appearance, selected)
      ? `Đang mặc: ${selected.name}` : `Đang xem thử: ${selected.name} · Chưa đổi đồ đang mặc` : 'Chạm vào hình món đồ để xem thử.'}</p>
    <div className="shop-tabs" role="tablist" aria-label="Loại trang phục">
      {(Object.keys(itemCategories) as ItemCategory[]).map((id) => <button key={id} type="button" role="tab"
        id={`tab-${id}`} aria-controls="shop-items" aria-selected={category === id}
        onClick={() => { setCategory(id); setSelected(null); setMessage('') }}>{itemCategories[id].label}</button>)}
    </div>
    <p className="shop-status" role="status" aria-live="polite">{message}</p>
    <div className="shop-grid" id="shop-items" role="tabpanel" aria-labelledby={`tab-${category}`}>
      {items.map((item) => {
        const owned = ownsItem(progress.ownedItemIds, item.id)
        const equipped = isItemEquipped(progress.profile.appearance, item)
        const status = getPurchaseStatus(progress, item.id)
        const label = equipped ? 'ĐANG DÙNG' : owned ? 'TRANG BỊ' : status === 'level-locked' ? `MỞ Ở LEVEL ${item.unlockLevel}`
          : status === 'insufficient-money' ? 'KHÔNG ĐỦ TIỀN' : 'MUA'
        return <article key={item.id} className={`shop-item${selected?.id === item.id ? ' shop-item--selected' : ''}`} data-item-id={item.id}>
          <button className="item-preview" type="button" aria-label={`Xem thử ${item.name}`} aria-pressed={selected?.id === item.id}
            onClick={() => { setSelected(item); playAudioCue('click') }}>
            <PlayerAvatar appearance={withItem(progress.profile.appearance, item)} size={76} state="static" />
          </button>
          <h2>{item.name}</h2><span className="item-rarity" style={{ color: itemRarities[item.rarity].color }}>{itemRarities[item.rarity].label}</span>
          <p>{owned ? 'ĐÃ SỞ HỮU' : formatMoney(item.price)}</p>
          <button className="item-action" type="button" disabled={equipped || (!owned && status !== 'purchased')}
            onClick={() => act(item)}>{label}</button>
        </article>
      })}
    </div>
    <p className="privacy-note">{wardrobe ? 'Chỉ hiện đồ bạn sở hữu. Trang bị không tốn tiền.' : 'Mua bằng tiền trong game. Không thanh toán tiền thật.'}</p>
  </ScreenShell>
}
