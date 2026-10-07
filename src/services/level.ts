import { getPlayerLevel } from './playerProfile'

export const XP_CONFIG = { basePerGame: 30, scorePerXp: 20, maximumScoreXp: 120, baseThreshold: 150, thresholdGrowth: 50 } as const

export function getGameXp(score: number): number {
  const safeScore = Number.isFinite(score) ? Math.max(0, score) : 0
  return XP_CONFIG.basePerGame + Math.min(XP_CONFIG.maximumScoreXp, Math.floor(safeScore / XP_CONFIG.scorePerXp))
}
export function getLevelThreshold(level: number): number {
  const steps = Math.max(0, Math.floor(level) - 1)
  return XP_CONFIG.baseThreshold * steps + XP_CONFIG.thresholdGrowth * steps * (steps - 1) / 2
}
export function getLevelProgress(totalXp: number) {
  const xp = Number.isFinite(totalXp) ? Math.max(0, Math.floor(totalXp)) : 0
  // Invert the quadratic threshold, then correct rounding at exact boundaries.
  const a = XP_CONFIG.thresholdGrowth / 2
  const b = XP_CONFIG.baseThreshold - a
  let level = Math.floor((-b + Math.sqrt(b * b + 4 * a * xp)) / (2 * a)) + 1
  if (getLevelThreshold(level + 1) <= xp) level++
  if (getLevelThreshold(level) > xp) level--
  const current = xp - getLevelThreshold(level)
  const required = getLevelThreshold(level + 1) - getLevelThreshold(level)
  return { level, current, required, percent: Math.min(100, current / required * 100) }
}
export function migrateLegacyXp(totalGamesPlayed: number): number {
  // Keep the former displayed level (one level per 10 games), not an invented reward history.
  const level = getPlayerLevel(totalGamesPlayed)
  return getLevelThreshold(level)
}
