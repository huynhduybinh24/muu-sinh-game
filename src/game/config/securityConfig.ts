export const SECURITY_CONFIG = { correct: 100, quickBonus: 30, falseAlarm: -40, missed: -25, reactionBonusMs: 1600, waitMs: 1200, minimumWaitMs: 650, windowMs: 4400, minimumWindowMs: 2600, nextMs: 700 } as const
export const incidents = ['door', 'water', 'crate', 'bell'] as const
export type Incident = typeof incidents[number]
export const incidentNames: Record<Incident, string> = { door: 'CỬA KHO', water: 'VÒI NƯỚC', crate: 'THÙNG HÀNG', bell: 'CHUÔNG' }
export function detectionPoints(choice: Incident, target: Incident | null, reactionMs: number): number {
  return choice !== target ? SECURITY_CONFIG.falseAlarm : SECURITY_CONFIG.correct + Math.round(SECURITY_CONFIG.quickBonus * Math.max(0, 1 - Math.max(0, reactionMs) / SECURITY_CONFIG.reactionBonusMs))
}
export const securityDifficulty = (handled: number) => ({ wait: Math.max(SECURITY_CONFIG.minimumWaitMs, SECURITY_CONFIG.waitMs - Math.max(0, handled) * 45), window: Math.max(SECURITY_CONFIG.minimumWindowMs, SECURITY_CONFIG.windowMs - Math.max(0, handled) * 100) })

