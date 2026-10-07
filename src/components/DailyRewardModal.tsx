import { useEffect, useRef } from 'react'
import { DailyRewardStrip } from './DailyRewardStrip'
import { formatMoney } from '../services/formatters'
import type { DailyReward } from '../types/daily'
import { GameIcon } from './GameIcon'

export function DailyRewardModal({ cycleDay, reward, onClaim, onClose }: {
  cycleDay: number; reward: DailyReward; onClaim: () => void; onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])
  return <dialog ref={dialog} className="daily-reward-modal" aria-labelledby="reward-modal-title" aria-describedby="reward-modal-description"
    onCancel={(event) => { event.preventDefault(); onClose() }}>
    <button className="reward-close" type="button" aria-label="Đóng quà hôm nay" onClick={onClose}>×</button>
    <span className="reward-hero" aria-hidden="true"><GameIcon name="gift" size={64} /></span><h2 id="reward-modal-title">QUÀ HÔM NAY</h2>
    <p className="eyebrow">NGÀY {cycleDay} / 7</p>
    <div className="reward-prize"><strong>💰 +{formatMoney(reward.money)}</strong>{reward.xp > 0 ? <strong>⭐ +{reward.xp} XP</strong> : null}</div>
    <DailyRewardStrip cycleDay={cycleDay} claimed={false} />
    <p id="reward-modal-description" className="privacy-note">Một món quà nhỏ để bắt đầu ngày mới. Chuỗi nhận quà riêng, không thay đổi chuỗi đi làm.</p>
    <button className="primary-button" type="button" onClick={onClaim}>NHẬN QUÀ</button>
    <button className="text-button" type="button" onClick={onClose}>ĐỂ SAU</button>
  </dialog>
}
