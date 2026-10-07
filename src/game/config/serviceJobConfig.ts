export const SERVICE_JOB_CONFIG = {
  ink: 0x272438, cream: 0xfff8e7, white: 0xffffff,
  green: 0x31865a, red: 0xcb443d, feedbackY: 467,
} as const
export function getFastBonus(remainingMs: number, totalMs: number, maximum: number): number {
  return totalMs > 0 ? Math.round(maximum * Math.min(1, Math.max(0, remainingMs / totalMs))) : 0
}
