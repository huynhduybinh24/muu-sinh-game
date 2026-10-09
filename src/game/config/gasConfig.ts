export const GAS_CONFIG = { perfect: 120, good: 80, ok: 40, wrong: -40, timeout: -25, perfectError: 0.035, goodError: 0.1, okError: 0.2, initialRate: 2.5, maximumRate: 3.8, nextMs: 550, patience: 13, minimumPatience: 8, overfillRatio: 1.3 } as const
export const fuelTypes = ['E5', 'RON95'] as const
export type FuelType = typeof fuelTypes[number]
export const fuelTargets = [4, 6, 8, 10] as const
export function evaluateFuel(selected: FuelType | null, requested: FuelType, amount: number, target: number) {
  const error = Number.isFinite(amount) && target > 0 && Number.isFinite(target) ? Math.abs(amount - target) / target : Infinity
  const grade = selected !== requested ? 'wrong' : error <= GAS_CONFIG.perfectError ? 'perfect' : error <= GAS_CONFIG.goodError ? 'good' : error <= GAS_CONFIG.okError ? 'ok' : 'wrong'
  return { grade, points: GAS_CONFIG[grade] }
}
export const fuelRate = (served: number) => Math.min(GAS_CONFIG.maximumRate, GAS_CONFIG.initialRate + Math.max(0, served) * 0.1)
export const fuelPatience = (served: number) => Math.max(GAS_CONFIG.minimumPatience, GAS_CONFIG.patience - Math.max(0, served) * 0.3)

