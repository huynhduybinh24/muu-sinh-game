export interface SweepPoint { x: number; y: number }
export const CLEANING_CONFIG = { completed: 100, maximumBonus: 40, mistake: -10, radius: 25, hazardRadius: 24, hazardCooldownMs: 900, patience: 15, minimumPatience: 10, nextMs: 600 } as const
export const litterSpots: readonly SweepPoint[] = [
  {x: 75,y: 250},{x: 145,y: 250},{x: 220,y: 250},{x: 285,y: 250},
  {x: 80,y: 310},{x: 135,y: 310},{x: 225,y: 310},{x: 280,y: 310},
  {x: 75,y: 400},{x: 135,y: 420},{x: 230,y: 420},{x: 290,y: 400},
]
export const sweepHazards: readonly SweepPoint[] = [{ x: 180, y: 365 }, { x: 310, y: 355 }]
export function sweepDistance(point: SweepPoint, from: SweepPoint, to: SweepPoint): number {
  const dx = to.x - from.x, dy = to.y - from.y
  const denominator = dx * dx + dy * dy
  const t = denominator ? Math.max(0, Math.min(1, ((point.x - from.x) * dx + (point.y - from.y) * dy) / denominator)) : 0
  return Math.hypot(point.x - from.x - dx * t, point.y - from.y - dy * t)
}
export const cleaningPoints = (mistakes: number) => CLEANING_CONFIG.completed + Math.max(0, CLEANING_CONFIG.maximumBonus - Math.max(0, mistakes) * 10)
export const cleaningDifficulty = (sections: number) => ({ count: Math.min(12, 8 + Math.floor(Math.max(0, sections) / 2)), seconds: Math.max(CLEANING_CONFIG.minimumPatience, CLEANING_CONFIG.patience - Math.max(0, sections) * 0.5) })

