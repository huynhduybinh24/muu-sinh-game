import { useState } from 'react'
import { ScreenShell } from '../components/ScreenShell'
import { ShareCardPreview } from '../components/ShareCardPreview'
import { playAudioCue, primeAudio } from '../services/audioFeedback'
import {
  createShareCardBlob,
  downloadShareCard,
  getShareFilename,
  shareResultCard,
} from '../services/shareCardImage'
import type { GameResult } from '../types/game'
import type { Job } from '../types/job'

interface ResultPageProps {
  job: Job
  result: GameResult
  onHome: () => void
  onReplay: () => void
}

export function ResultPage({ job, result, onHome, onReplay }: ResultPageProps) {
  const [busyAction, setBusyAction] = useState<'share' | 'download' | null>(null)
  const [statusMessage, setStatusMessage] = useState('')

  const handleNavigation = (action: () => void) => {
    primeAudio()
    playAudioCue('click')
    action()
  }

  const handleShare = async () => {
    setStatusMessage('')
    primeAudio()
    playAudioCue('click')

    if (!navigator.share) {
      setStatusMessage('Trình duyệt chưa hỗ trợ chia sẻ. Bạn vẫn có thể lưu ảnh.')
      return
    }

    setBusyAction('share')
    try {
      const blob = await createShareCardBlob(result, job)
      const outcome = await shareResultCard(blob, result, job)
      if (outcome === 'shared') setStatusMessage('Đã mở chia sẻ kết quả!')
      if (outcome === 'text-shared') setStatusMessage('Đã chia sẻ nội dung. Bạn có thể lưu ảnh riêng.')
      if (outcome === 'unsupported') {
        setStatusMessage('Trình duyệt chưa hỗ trợ chia sẻ. Bạn vẫn có thể lưu ảnh.')
      }
    } catch {
      setStatusMessage('Chưa thể chia sẻ lúc này. Thử lưu ảnh nhé!')
    } finally {
      setBusyAction(null)
    }
  }

  const handleDownload = async () => {
    setBusyAction('download')
    setStatusMessage('')
    primeAudio()
    playAudioCue('click')
    try {
      const blob = await createShareCardBlob(result, job)
      downloadShareCard(blob, getShareFilename(result))
      setStatusMessage('Đã chuẩn bị ảnh kết quả!')
    } catch {
      setStatusMessage('Chưa thể lưu ảnh. Bạn thử lại nhé!')
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <ScreenShell
      header={<span className="day-pill">Tan ca!</span>}
      contentClassName="result-content result-share-content"
      footer={
        <div className="result-actions">
          <div className="share-actions">
            <button
              className="primary-button"
              type="button"
              onClick={handleShare}
              disabled={busyAction !== null}
            >
              {busyAction === 'share' ? 'ĐANG TẠO ẢNH…' : 'CHIA SẺ KẾT QUẢ'}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={handleDownload}
              disabled={busyAction !== null}
            >
              {busyAction === 'download' ? 'ĐANG LƯU…' : 'LƯU ẢNH'}
            </button>
          </div>
          <div className="button-row result-navigation-actions">
            <button className="secondary-button" type="button" onClick={() => handleNavigation(onReplay)}>
              CHƠI LẠI
            </button>
            <button className="primary-button" type="button" onClick={() => handleNavigation(onHome)}>
              VỀ TRANG CHỦ →
            </button>
          </div>
        </div>
      }
    >
      <p className="eyebrow">Kết quả hôm nay</p>
      <ShareCardPreview job={job} result={result} />
      <p className="share-status" role="status" aria-live="polite">{statusMessage}</p>
    </ScreenShell>
  )
}
