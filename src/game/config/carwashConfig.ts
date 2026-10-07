export const CARWASH_CONFIG = {
  vehicleSeconds: 12, nextVehicleMs: 550, targetCleanliness: 0.9,
  scrubRadius: 34, scrubPerSecond: 2.2, maximumFrameMs: 50,
  completed: 100, maximumFastBonus: 50, timeout: -20,
  dirtSpots: [
    { x: 104, y: 281 }, { x: 152, y: 281 }, { x: 200, y: 281 }, { x: 248, y: 281 },
    { x: 86, y: 335 }, { x: 134, y: 335 }, { x: 182, y: 335 }, { x: 230, y: 335 }, { x: 278, y: 335 },
    { x: 112, y: 379 }, { x: 174, y: 379 }, { x: 236, y: 379 },
  ],
} as const
export interface ScrubPoint { x: number; y: number }
export function distanceToScrubPath(point: ScrubPoint, start: ScrubPoint, end: ScrubPoint): number {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  const ratio = lengthSquared ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared)) : 0
  return Math.hypot(point.x - start.x - ratio * dx, point.y - start.y - ratio * dy)
}
export function getCleanliness(dirt: readonly number[]): number {
  return dirt.length ? 1 - dirt.reduce((sum, value) => sum + Math.max(0, Math.min(1, value)), 0) / dirt.length : 1
}
