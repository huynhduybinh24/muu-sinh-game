import type { GameResult, GameResultMetadata } from '../types/game'
import type { JobId } from '../types/job'

export function createGameResult(
  jobId: JobId,
  score: number,
  metadata?: GameResultMetadata,
): GameResult {
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.round(score)) : 0

  return {
    jobId,
    score: safeScore,
    earnedMoney: 12_000 + safeScore * 1_250,
    reputationChange: safeScore >= 40 ? 3 : safeScore >= 20 ? 2 : safeScore >= 5 ? 1 : -1,
    completedAt: new Date().toISOString(),
    metadata,
  }
}

export function getResultMessage(score: number): string {
  if (score >= 900) return 'Chủ tịch giả nghèo đi làm thuê!'
  if (score >= 550) return 'Thợ lành nghề xuất hiện!'
  if (score >= 250) return 'Cơ địa khó thất nghiệp!'
  if (score >= 80) return 'Có cố gắng là có lương!'
  return 'Hôm nay hơi cực 😭'
}
