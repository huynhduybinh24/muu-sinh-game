import { ScreenShell } from '../components/ScreenShell'
import { StatCard } from '../components/StatCard'
import { formatMoney } from '../services/formatters'
import { useProgressStore } from '../store/progressStore'
import type { Job } from '../types/job'

interface HomePageProps {
  dailyJob: Job
  localDateKey: string
  canInstall: boolean
  showIosInstallHint: boolean
  onStart: () => void
  onCareer: () => void
  onInstall: () => Promise<void>
}

export function HomePage({
  dailyJob,
  localDateKey,
  canInstall,
  showIosInstallHint,
  onStart,
  onCareer,
  onInstall,
}: HomePageProps) {
  const money = useProgressStore((state) => state.money)
  const reputation = useProgressStore((state) => state.reputation)
  const currentStreak = useProgressStore((state) => state.currentStreak)
  const bestStreak = useProgressStore((state) => state.bestStreak)
  const lastCompletedDate = useProgressStore((state) => state.lastCompletedDate)
  const totalDaysWorked = useProgressStore((state) => state.totalDaysWorked)
  const resetProgress = useProgressStore((state) => state.resetProgress)
  const completedToday = lastCompletedDate === localDateKey

  return (
    <ScreenShell
      header={
        <>
          <span>Nhật ký mưu sinh</span>
          <span className="day-pill">{localDateKey}</span>
        </>
      }
      footer={
        <>
          <button className="primary-button" type="button" onClick={onStart}>
            {completedToday ? 'CHƠI LẠI' : 'ĐI LÀM'} →
          </button>
          <button className="secondary-button home-career-button" type="button" onClick={onCareer}>
            XEM SỰ NGHIỆP
          </button>
          {canInstall ? (
            <button className="install-button" type="button" onClick={() => void onInstall()}>
              ↓ CÀI GAME
            </button>
          ) : null}
          {showIosInstallHint ? (
            <p className="ios-install-hint">Trên Safari: Chia sẻ → Thêm vào Màn hình chính</p>
          ) : null}
          {import.meta.env.DEV ? (
            <button className="dev-reset" type="button" onClick={resetProgress}>
              Reset Progress (dev)
            </button>
          ) : null}
        </>
      }
    >
      <div>
        <p className="eyebrow">Mỗi ngày một nghề</p>
        <h1 className="brand-title brand-title--compact">MƯU <span>SINH</span></h1>
      </div>

      <section className="daily-job-card" aria-labelledby="daily-job-title">
        <span className="daily-job-label">NGHỀ HÔM NAY</span>
        <span className="daily-job-icon" aria-hidden="true">{dailyJob.icon}</span>
        <h2 id="daily-job-title">{dailyJob.name}</h2>
        <p>{dailyJob.description}</p>
        {completedToday ? <strong className="daily-complete">✓ ĐÃ ĐI LÀM HÔM NAY</strong> : null}
      </section>

      <div className="streak-banner">
        <strong>🔥 {currentStreak} NGÀY LIÊN TIẾP</strong>
        <span>Kỷ lục: {bestStreak} ngày</span>
      </div>

      <div className="stats-grid" aria-label="Tiến trình người chơi">
        <StatCard icon="💵" label="Tiền" value={formatMoney(money)} />
        <StatCard icon="⭐" label="Danh tiếng" value={`${reputation} điểm`} />
        <StatCard icon="📅" label="Ngày đã làm" value={`${totalDaysWorked} ngày`} />
        <StatCard icon="🏆" label="Kỷ lục chuỗi" value={`${bestStreak} ngày`} />
      </div>
    </ScreenShell>
  )
}
