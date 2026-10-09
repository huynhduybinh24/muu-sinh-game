export const ELECTRICIAN_CONFIG = { perfect: 120, correct: 80, minor: 40, invalid: -30, patience: 14, minimumPatience: 9, nextMs: 650 } as const
export const wireColors = [0xe48176, 0xf0c56a, 0x78b68d, 0x72a7cc] as const
export const wireNames = ['ĐỎ', 'VÀNG', 'LỤC', 'LAM'] as const
export function circuitPoints(mistakes: number, complete: boolean): number { return !complete ? ELECTRICIAN_CONFIG.invalid : mistakes === 0 ? ELECTRICIAN_CONFIG.perfect : mistakes === 1 ? ELECTRICIAN_CONFIG.correct : ELECTRICIAN_CONFIG.minor }
export const circuitDifficulty = (fixed: number) => ({ count: fixed >= 3 ? 4 : 3, seconds: Math.max(ELECTRICIAN_CONFIG.minimumPatience, ELECTRICIAN_CONFIG.patience - Math.max(0, fixed) * 0.5) })

