import { getViralStat, shareCardThemes } from '../data/shareCard'
import { getLocalDateKey } from './dailyChallenge'
import { formatMoney } from './formatters'
import { getResultMessage } from './resultCalculator'
import type { GameResult } from '../types/game'
import type { Job } from '../types/job'
import { isNativePlatform } from './platform'
import { shareNativeFile, saveNativeFile } from './nativeFiles'

const CARD_WIDTH = 1080
const CARD_HEIGHT = 1350

export type ShareOutcome = 'shared' | 'text-shared' | 'unsupported' | 'cancelled'

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  context.beginPath()
  context.roundRect(x, y, width, height, radius)
}

function drawCenteredWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
): void {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word
    if (context.measureText(candidate).width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = candidate
    }
  })
  if (currentLine) lines.push(currentLine)

  lines.forEach((line, index) => context.fillText(line, centerX, startY + index * lineHeight))
}

function drawFallbackSymbol(
  context: CanvasRenderingContext2D,
  jobId: Job['id'],
  accent: string,
): void {
  context.save()
  context.strokeStyle = accent
  context.fillStyle = accent
  context.lineWidth = 16

  if (jobId === 'sugarcane') {
    context.strokeRect(440, 300, 200, 205)
    context.fillRect(458, 425, 164, 60)
    context.beginPath()
    context.moveTo(590, 300)
    context.lineTo(640, 235)
    context.stroke()
  } else if (jobId === 'construction') {
    context.fillRect(400, 300, 132, 74)
    context.fillRect(548, 300, 132, 74)
    context.fillRect(474, 390, 132, 74)
  } else if (jobId === 'noodle') {
    context.beginPath()
    context.ellipse(540, 380, 140, 55, 0, 0, Math.PI * 2)
    context.stroke()
    context.beginPath()
    context.arc(540, 365, 132, 0, Math.PI)
    context.stroke()
    context.fillRect(575, 255, 12, 130)
    context.fillRect(615, 255, 12, 130)
  } else if (jobId === 'barber') {
    context.beginPath()
    context.arc(466, 444, 38, 0, Math.PI * 2)
    context.moveTo(652, 444)
    context.arc(614, 444, 38, 0, Math.PI * 2)
    context.moveTo(490, 415)
    context.lineTo(628, 275)
    context.moveTo(590, 415)
    context.lineTo(452, 275)
    context.stroke()
  } else if (jobId === 'rubber') {
    context.fillRect(480, 280, 120, 225)
    context.beginPath(); context.moveTo(480, 365); context.lineTo(600, 423); context.stroke()
    context.strokeRect(597, 441, 55, 64)
  } else if (jobId === 'coffee') {
    context.strokeRect(445, 350, 190, 155); context.fillRect(463, 265, 154, 70); context.fillRect(436, 251, 208, 18)
  } else if (jobId === 'mechanic') {
    context.beginPath(); context.arc(478, 445, 28, 0, Math.PI * 2); context.moveTo(497, 420); context.lineTo(608, 285); context.stroke()
    context.strokeRect(575, 278, 65, 60)
  } else if (jobId === 'fishing') {
    context.beginPath(); context.ellipse(540, 411, 105, 50, 0, 0, Math.PI * 2); context.fill()
    context.beginPath(); context.moveTo(437, 411); context.lineTo(373, 367); context.lineTo(373, 455); context.closePath(); context.fill()
  } else {
    context.fillRect(410, 330, 190, 105)
    context.fillRect(595, 365, 65, 70)
    context.beginPath()
    context.arc(460, 462, 34, 0, Math.PI * 2)
    context.arc(610, 462, 34, 0, Math.PI * 2)
    context.fill()
  }
  context.restore()
}

export function createShareCardBlob(result: GameResult, job: Job): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const context = canvas.getContext('2d')
  if (!context) return Promise.reject(new Error('canvas-unavailable'))

  const theme = shareCardThemes[job.id]
  const viralStat = getViralStat(result)
  const reputation = result.reputationChange >= 0
    ? `+${result.reputationChange}`
    : `${result.reputationChange}`

  context.fillStyle = '#fff8e7'
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
  context.fillStyle = theme.accentSoft
  context.beginPath()
  context.arc(930, 90, 245, 0, Math.PI * 2)
  context.fill()
  context.beginPath()
  context.arc(90, 1230, 210, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = theme.accent
  context.fillRect(0, 0, 26, CARD_HEIGHT)

  context.textAlign = 'center'
  context.fillStyle = theme.dark
  context.font = '900 88px Arial, sans-serif'
  context.fillText('MƯU SINH', 540, 130)
  context.fillStyle = theme.accent
  context.font = '800 34px Arial, sans-serif'
  context.fillText('MỖI NGÀY 1 NGHỀ', 540, 182)

  context.fillStyle = '#ffffff'
  roundedRect(context, 362, 230, 356, 310, 92)
  context.fill()
  context.strokeStyle = theme.dark
  context.lineWidth = 8
  context.stroke()
  drawFallbackSymbol(context, job.id, theme.accent)
  context.font = '96px "Segoe UI Emoji", "Apple Color Emoji", sans-serif'
  context.fillText(job.icon, 540, 415)

  context.fillStyle = '#756e60'
  context.font = '800 28px Arial, sans-serif'
  context.fillText('NGHỀ HÔM NAY', 540, 590)
  context.fillStyle = theme.dark
  context.font = '900 62px Arial, sans-serif'
  context.fillText(job.name.toLocaleUpperCase('vi-VN'), 540, 660)

  const statCards = [
    { label: 'ĐIỂM', value: new Intl.NumberFormat('vi-VN').format(result.score) },
    { label: 'THU NHẬP', value: `+${formatMoney(result.earnedMoney)}` },
    { label: 'DANH TIẾNG', value: `${reputation} điểm` },
  ]
  statCards.forEach((stat, index) => {
    const x = 82 + index * 318
    context.fillStyle = index === 0 ? theme.dark : '#ffffff'
    roundedRect(context, x, 710, 282, 160, 34)
    context.fill()
    context.fillStyle = index === 0 ? theme.accentSoft : '#786f60'
    context.font = '800 22px Arial, sans-serif'
    context.fillText(stat.label, x + 141, 758)
    context.fillStyle = index === 0 ? '#ffffff' : theme.dark
    context.font = '900 32px Arial, sans-serif'
    context.fillText(stat.value, x + 141, 820)
  })

  context.fillStyle = theme.accent
  roundedRect(context, 205, 910, 670, 100, 30)
  context.fill()
  context.fillStyle = '#ffffff'
  context.font = '800 29px Arial, sans-serif'
  context.font = `800 ${viralStat.detail ? 25 : 29}px Arial, sans-serif`
  context.fillText(`${viralStat.label}: ${viralStat.value}${viralStat.detail ? ` · ${viralStat.detail}` : ''}`, 540, 973)

  context.fillStyle = theme.dark
  context.font = 'italic 800 38px Arial, sans-serif'
  drawCenteredWrappedText(
    context,
    `“${getResultMessage(result.score)}”`,
    540,
    1090,
    810,
    50,
  )

  context.fillStyle = '#756e60'
  context.font = '700 30px Arial, sans-serif'
  context.fillText('Hôm nay bạn làm nghề gì?', 540, 1268)
  context.fillStyle = theme.accent
  context.fillRect(390, 1305, 300, 8)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('png-generation-failed'))
    }, 'image/png')
  })
}

export function getShareFilename(result: GameResult): string {
  const parsedDate = new Date(result.completedAt)
  const safeDate = Number.isNaN(parsedDate.getTime())
    ? getLocalDateKey()
    : getLocalDateKey(parsedDate)
  return `muu-sinh-${result.jobId}-${safeDate}.png`
}

export function getShareText(result: GameResult, job: Job): string {
  const score = new Intl.NumberFormat('vi-VN').format(result.score)
  return `Hôm nay tôi làm nghề ${job.name} và đạt ${score} điểm trong MƯU SINH 😎\nBạn thử xem hôm nay ra nghề gì?`
}

export async function downloadShareCard(blob: Blob, filename: string): Promise<boolean> {
  if (isNativePlatform()) {
    const outcome = await saveNativeFile(blob, filename)
    if (outcome === 'unsupported') throw new Error('native-file-export-unavailable')
    return outcome !== 'cancelled'
  }
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  try {
    document.body.append(anchor)
    anchor.click()
  } finally {
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000)
  }
  return true
}

export async function shareResultCard(
  blob: Blob,
  result: GameResult,
  job: Job,
): Promise<ShareOutcome> {
  if (isNativePlatform()) return shareNativeFile(blob, getShareFilename(result), getShareText(result, job))
  if (!navigator.share) return 'unsupported'

  const text = getShareText(result, job)

  try {
    let fileShareData: ShareData | null = null
    let canShareFile = false
    try {
      const file = new File([blob], getShareFilename(result), { type: 'image/png' })
      fileShareData = { title: 'MƯU SINH', text, files: [file] }
      canShareFile = navigator.canShare?.(fileShareData) ?? false
    } catch {
      canShareFile = false
    }

    if (canShareFile && fileShareData) {
      await navigator.share(fileShareData)
      return 'shared'
    }
    await navigator.share({ title: 'MƯU SINH', text })
    return 'text-shared'
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return 'cancelled'
    throw error
  }
}
