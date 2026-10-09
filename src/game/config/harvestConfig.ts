export const HARVEST_CONFIG = { correct: 40, wrong: -20, basket: 100, basketSize: 5, comboStep: 3, maximumBonus: 18, waveMs: 2300, minimumWaveMs: 1200 } as const
export type OrchardItem = 'ripe' | 'unripe' | 'hazard'
export function orchardItem(random: number): OrchardItem { return random < 0.55 ? 'ripe' : random < 0.88 ? 'unripe' : 'hazard' }
export const harvestPoints = (correct: boolean, combo: number) => correct ? HARVEST_CONFIG.correct + Math.min(HARVEST_CONFIG.maximumBonus, Math.max(0, combo - 1) * HARVEST_CONFIG.comboStep) : HARVEST_CONFIG.wrong
export const harvestWaveMs = (picked: number) => Math.max(HARVEST_CONFIG.minimumWaveMs, HARVEST_CONFIG.waveMs - Math.max(0, picked) * 35)

