export const CARGO_CONFIG = { correct: 90, wrong: -35, timeout: -20, comboStep: 5, maximumBonus: 30, patience: 9, minimumPatience: 5, nextMs: 400, quickMs: 3000 } as const
export const destinations = ['river', 'market', 'garden'] as const
export type CargoDestination = typeof destinations[number]
export const destinationLabels: Record<CargoDestination, string> = { river: 'SÔNG', market: 'CHỢ', garden: 'VƯỜN' }
export function cargoPoints(correct: boolean, combo: number): number { return correct ? CARGO_CONFIG.correct + Math.min(CARGO_CONFIG.maximumBonus, Math.max(0, combo - 1) * CARGO_CONFIG.comboStep) : CARGO_CONFIG.wrong }
export const cargoPatience = (sorted: number) => Math.max(CARGO_CONFIG.minimumPatience, CARGO_CONFIG.patience - Math.max(0, sorted) * 0.2)
export function cargoDrop(x: number, y: number): CargoDestination | null {
  if (y < 464 || y > 555) return null
  const index = [60, 180, 300].findIndex(center => Math.abs(x - center) <= 48)
  return destinations[index] ?? null
}

