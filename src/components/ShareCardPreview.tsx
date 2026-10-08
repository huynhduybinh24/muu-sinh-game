import type { CSSProperties } from 'react'
import { getViralStat, shareCardThemes } from '../data/shareCard'
import { formatMoney } from '../services/formatters'
import { getResultMessage } from '../services/resultCalculator'
import type { GameResult } from '../types/game'
import type { Job } from '../types/job'

interface ShareCardPreviewProps {
  job: Job
  result: GameResult
}

type ShareCardStyle = CSSProperties & {
  '--share-accent': string
  '--share-soft': string
  '--share-dark': string
}

export function ShareCardPreview({ job, result }: ShareCardPreviewProps) {
  const theme = shareCardThemes[job.id]
  const viralStat = getViralStat(result)
  const reputation = result.reputationChange >= 0
    ? `+${result.reputationChange}`
    : `${result.reputationChange}`
  const style: ShareCardStyle = {
    '--share-accent': theme.accent,
    '--share-soft': theme.accentSoft,
    '--share-dark': theme.dark,
  }

  return (
    <article className="share-card-preview" style={style} aria-label="Thẻ kết quả chia sẻ">
      <div className="share-card-brand">
        <strong>MƯU SINH</strong>
        <span>MỖI NGÀY 1 NGHỀ</span>
      </div>
      <div className="share-card-icon" aria-hidden="true">{job.icon}</div>
      <span className="share-card-label">NGHỀ HÔM NAY</span>
      <h1>{job.name}</h1>
      <div className="share-card-stats">
        <div><span>⭐ ĐIỂM</span><strong>{result.score.toLocaleString('vi-VN')}</strong></div>
        <div><span>💰 THU NHẬP</span><strong>+{formatMoney(result.earnedMoney)}</strong></div>
        <div><span>📈 DANH TIẾNG</span><strong>{reputation}</strong></div>
      </div>
      <div className="share-card-viral-stat">{viralStat.label}: {viralStat.value}{viralStat.detail ? ` · ${viralStat.detail}` : ''}</div>
      <blockquote>“{getResultMessage(result.score)}”</blockquote>
      <footer>Hôm nay bạn làm nghề gì?</footer>
    </article>
  )
}
