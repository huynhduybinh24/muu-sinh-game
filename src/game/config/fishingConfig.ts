export const FISHING_CONFIG = { waitMs: { min: 800, max: 2200 }, biteWindowMs: 1300, tensionMs: 2400,
  markerPeriodMs: 1900, catchZone: [0.32, 0.72], perfectZone: [0.46, 0.58], perfectBonus: 20,
  nextCastMs: 550, miss: 0, rareCutoff: 0.72, epicCutoff: 0.94 } as const
export type FishTier = 'common' | 'rare' | 'epic'
export const fishTiers: Record<FishTier, { name: string; points: number; color: number }> = {
  common: { name: 'CÁ ĐỒNG', points: 70, color: 0x89b9b2 },
  rare: { name: 'CÁ QUÝ', points: 120, color: 0x8d92c8 },
  epic: { name: 'CÁ HIẾM', points: 180, color: 0xe3b766 },
}
export function chooseFishTier(random: number): FishTier {
  const value = Number.isFinite(random) ? Math.max(0, Math.min(1, random)) : 0
  return value >= FISHING_CONFIG.epicCutoff ? 'epic' : value >= FISHING_CONFIG.rareCutoff ? 'rare' : 'common'
}
export function fishingMarker(elapsedMs: number): number {
  if (!Number.isFinite(elapsedMs)) return 0
  return (1 - Math.cos(Math.max(0, elapsedMs) / FISHING_CONFIG.markerPeriodMs * Math.PI * 2)) / 2
}
export function evaluateCatch(tier: FishTier, ratio: number) {
  const caught = Number.isFinite(ratio) && ratio >= FISHING_CONFIG.catchZone[0] && ratio <= FISHING_CONFIG.catchZone[1]
  const perfect = caught && ratio >= FISHING_CONFIG.perfectZone[0] && ratio <= FISHING_CONFIG.perfectZone[1]
  return { caught, perfect, points: caught ? fishTiers[tier].points + (perfect ? FISHING_CONFIG.perfectBonus : 0) : FISHING_CONFIG.miss }
}
