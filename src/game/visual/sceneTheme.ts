import type { JobId } from '../../types/job'

export const VISUAL_LIMITS = { particles: 24, burst: 10, foamIntervalMs: 90, shakeMs: 90, transitionMs: 220 } as const
export const sceneThemes: Record<JobId, { sky: number; far: number; ground: number; accent: number; deep: number; light: number }> = {
  sugarcane: { sky: 0xffe9c2, far: 0xb8d2b2, ground: 0xf3d6a4, accent: 0x398569, deep: 0x245f50, light: 0xf2fff4 },
  construction: { sky: 0xc6e7f0, far: 0x9db7c7, ground: 0xdfbf8f, accent: 0xe68d45, deep: 0x8f4f39, light: 0xfff3d1 },
  shipper: { sky: 0xe2f1de, far: 0xabc5b0, ground: 0xb4cbc1, accent: 0x4c9f92, deep: 0x284b57, light: 0xeff9f4 },
  noodle: { sky: 0xffe9d1, far: 0xd1bdba, ground: 0xd4ab89, accent: 0xc77a4d, deep: 0x7d4941, light: 0xfff8ea },
  barber: { sky: 0xe6dcf4, far: 0xb8a5cf, ground: 0xafa0c3, accent: 0x8b69ad, deep: 0x4d3e67, light: 0xfff6ed },
  carwash: { sky: 0xd9f3f0, far: 0x9bcacb, ground: 0x97bec4, accent: 0x318eac, deep: 0x285564, light: 0xf3ffff },
}
export function reducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
// A separate visual PRNG never consumes gameplay randomness.
export function visualRandom(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0
    return value / 0x1_0000_0000
  }
}
