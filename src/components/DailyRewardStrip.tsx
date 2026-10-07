import { dailyRewards } from '../data/dailyRewards'

export function DailyRewardStrip({ cycleDay, claimed }: { cycleDay: number; claimed: boolean }) {
  return <ol className="daily-reward-strip" aria-label="Chu kỳ quà 7 ngày">
    {dailyRewards.map((_, index) => {
      const day = index + 1
      const done = day < cycleDay || (claimed && day === cycleDay)
      return <li key={day} className={day === cycleDay ? 'reward-day--today' : ''} aria-current={day === cycleDay ? 'step' : undefined}>
        <span>Ngày {day}</span><strong aria-label={done ? 'Đã nhận' : day === cycleDay ? 'Hôm nay' : 'Chưa tới'}>{done ? '✓' : day === cycleDay ? '↓' : day === 7 ? '🎁' : '·'}</strong>
      </li>
    })}
  </ol>
}
