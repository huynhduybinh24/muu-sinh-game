import { ScreenShell } from '../components/ScreenShell'
import { BottomNav } from '../components/BottomNav'
import { achievements } from '../data/achievements'
import { jobs } from '../data/jobs'
import { formatMoney } from '../services/formatters'
import { useProgressStore } from '../store/progressStore'
import { GameIcon } from '../components/GameIcon'

interface CareerPageProps {
  onBack: () => void
  onProfile: () => void
}

function formatUnlockDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN')
}

export function CareerPage({ onBack, onProfile }: CareerPageProps) {
  const progress = useProgressStore()
  const unlockedById = new Map(
    progress.achievements.map((achievement) => [achievement.id, achievement]),
  )

  return (
    <ScreenShell
      header={<span className="day-pill">Sự nghiệp</span>}
      contentClassName="career-content"
      footer={
        <>
        <button className="secondary-button" type="button" onClick={onBack}>
          ← VỀ TRANG CHỦ
        </button>
        <BottomNav active="career" onHome={onBack} onCareer={() => undefined} onProfile={onProfile} />
        </>
      }
    >
      <section className="career-section" aria-labelledby="career-jobs-title">
        <p className="eyebrow">Bộ sưu tập nghề</p>
        <h1 id="career-jobs-title">SỰ NGHIỆP</h1>
        <div className="career-summary">
          <span><strong>{progress.totalGamesPlayed}</strong> ca đã làm</span>
          <span><strong>{progress.totalDaysWorked}</strong> ngày mưu sinh</span>
          <span><strong>{formatMoney(progress.totalMoneyEarned)}</strong> đã kiếm</span>
        </div>
        <div className="career-job-list">
          {jobs.map((job) => {
            const stats = progress.jobStats[job.id]
            return (
              <article className="career-job-card" key={job.id}>
                <span className="career-job-icon" aria-hidden="true"><GameIcon name={job.id} size={42} /></span>
                <div>
                  <h2>{job.name}</h2>
                  {stats.timesPlayed === 0 ? (
                    <p className="career-untried">CHƯA THỬ NGHỀ NÀY</p>
                  ) : (
                    <dl>
                      <div><dt>Đã làm</dt><dd>{stats.timesPlayed} lần</dd></div>
                      <div><dt>Kỷ lục</dt><dd>{stats.bestScore.toLocaleString('vi-VN')}</dd></div>
                      <div><dt>Thu nhập</dt><dd>{formatMoney(stats.totalMoneyEarned)}</dd></div>
                    </dl>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="career-section achievement-section" aria-labelledby="achievements-title">
        <p className="eyebrow">Cột mốc mưu sinh</p>
        <h2 id="achievements-title">THÀNH TỰU</h2>
        <div className="achievement-list">
          {achievements.map((achievement) => {
            const unlock = unlockedById.get(achievement.id)
            const achievementProgress = achievement.getProgress(progress)
            const percentage = Math.min(
              100,
              (achievementProgress.current / achievementProgress.target) * 100,
            )
            return (
              <article
                className={`achievement-card${unlock ? ' achievement-card--unlocked' : ''}`}
                key={achievement.id}
              >
                <span className="achievement-icon" aria-hidden="true">{unlock ? '🏆' : '🔒'}</span>
                <div>
                  <h3>{achievement.title}</h3>
                  <p>{achievement.description}</p>
                  {unlock ? (
                    <small>Mở khóa {formatUnlockDate(unlock.unlockedAt)}</small>
                  ) : (
                    <>
                      <div className="achievement-progress" aria-hidden="true">
                        <span style={{ width: `${percentage}%` }} />
                      </div>
                      <small>{achievementProgress.label}</small>
                    </>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </ScreenShell>
  )
}
