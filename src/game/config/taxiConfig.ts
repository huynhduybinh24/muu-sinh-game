export const TAXI_CONFIG = { trip: 120, bonus: 50, violation: -30, collision: -40, violationMood: 15, collisionMood: 25, moveMs: 360, nextMs: 700, signalMs: 3200, obstacleMs: 4000, tripMs: 28000, minimumTripMs: 20000, moodDrain: .8, fiveStarMood: 80, fastMs: 11000 } as const
export type TaxiDirection = 'up' | 'down' | 'left' | 'right'
export const taxiNodes = Array.from({ length: 9 }, (_, i) => ({ x: 70 + i % 3 * 110, y: 240 + Math.floor(i / 3) * 90 }))
export function taxiNeighbor(node: number, direction: TaxiDirection): number | null {
  if (!Number.isInteger(node) || node < 0 || node > 8) return null
  const column = node % 3, row = Math.floor(node / 3)
  if (direction === 'up') return row > 0 ? node - 3 : null
  if (direction === 'down') return row < 2 ? node + 3 : null
  if (direction === 'left') return column > 0 ? node - 1 : null
  return column < 2 ? node + 1 : null
}
export function taxiMoveOutcome(target: number | null, green: boolean, obstacle: number) {
  if (target === null) return 'edge'
  if (target === 4 && !green) return 'violation'
  return target === obstacle ? 'collision' : 'safe'
}
export function taxiTripPoints(mood: number, elapsed: number, mistakes: number) {
  const safe = mistakes === 0
  const bonus = safe ? Math.round(Math.max(0, Math.min(1, mood / 100)) * TAXI_CONFIG.bonus * (elapsed <= TAXI_CONFIG.fastMs ? 1 : .6)) : 0
  return { points: TAXI_CONFIG.trip + bonus, fiveStar: safe && mood >= TAXI_CONFIG.fiveStarMood }
}
export const taxiPatience = (trips: number) => Math.max(TAXI_CONFIG.minimumTripMs, TAXI_CONFIG.tripMs - trips * 600)
