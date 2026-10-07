import { useEffect } from 'react'
import { shopItems } from '../data/shop'

export function LevelUpToast({ previousLevel, level, onDismiss }: { previousLevel: number; level: number; onDismiss: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 3200)
    return () => window.clearTimeout(timer)
  }, [onDismiss, level])
  const unlocked = shopItems.filter((item) => item.price > 0 && item.unlockLevel > previousLevel && item.unlockLevel <= level).length
  return <aside className="level-up-toast" role="status" aria-live="polite">
    <span aria-hidden="true">🎉</span><div><strong>LÊN CẤP! LEVEL {level}</strong>
      {unlocked > 0 ? <p>Mở khóa {unlocked} món mới trong cửa hàng!</p> : <p>Thêm một bước trưởng thành!</p>}
    </div><button type="button" onClick={onDismiss} aria-label="Đóng thông báo lên cấp">×</button>
  </aside>
}
