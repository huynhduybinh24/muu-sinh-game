import type { JobId } from '../../types/job'

export const VISUAL_LIMITS = { particles: 24, burst: 10, foamIntervalMs: 90, shakeMs: 90, transitionMs: 220 } as const
export const sceneThemes: Record<JobId, { sky: number; far: number; ground: number; accent: number; deep: number; light: number }> = {
  it: { sky: 0xdfeaf0, far: 0xb4cbbd, ground: 0xe2d5b4, accent: 0x527fa5, deep: 0x385452, light: 0xfffaea },
  accountant: { sky: 0xe1efdf, far: 0xb4cbbd, ground: 0xe2d5b4, accent: 0x548f7f, deep: 0x385452, light: 0xfffaea },
  police: { sky: 0xd9e9e3, far: 0xb4cbbd, ground: 0xe2d5b4, accent: 0x517497, deep: 0x385452, light: 0xfffaea },
  doctor: { sky: 0xe0f3ef, far: 0xb4cbbd, ground: 0xe2d5b4, accent: 0x66a7a1, deep: 0x385452, light: 0xfffaea },
  teacher: { sky: 0xffefd3, far: 0xb4cbbd, ground: 0xe2d5b4, accent: 0xa18152, deep: 0x385452, light: 0xfffaea },
  taxi: { sky: 0xe5efd4, far: 0xb4cbbd, ground: 0xe2d5b4, accent: 0xc39e54, deep: 0x385452, light: 0xfffaea },
  banhmi: { sky: 0xffedcf, far: 0xbdd6b9, ground: 0xe0cba3, accent: 0xc68b48, deep: 0x385452, light: 0xfffaea },
  gas: { sky: 0xffedcf, far: 0xbdd6b9, ground: 0xe0cba3, accent: 0xcf7958, deep: 0x385452, light: 0xfffaea },
  cargo: { sky: 0xffedcf, far: 0xbdd6b9, ground: 0xe0cba3, accent: 0x83975d, deep: 0x385452, light: 0xfffaea },
  cleaning: { sky: 0xffedcf, far: 0xbdd6b9, ground: 0xe0cba3, accent: 0x559989, deep: 0x385452, light: 0xfffaea },
  electrician: { sky: 0xffedcf, far: 0xbdd6b9, ground: 0xe0cba3, accent: 0xd1a347, deep: 0x385452, light: 0xfffaea },
  florist: { sky: 0xffedcf, far: 0xbdd6b9, ground: 0xe0cba3, accent: 0xb76e95, deep: 0x385452, light: 0xfffaea },
  security: { sky: 0xffedcf, far: 0xbdd6b9, ground: 0xe0cba3, accent: 0x647e9b, deep: 0x385452, light: 0xfffaea },
  photographer: { sky: 0xffedcf, far: 0xbdd6b9, ground: 0xe0cba3, accent: 0x647fb0, deep: 0x385452, light: 0xfffaea },
  cashier: { sky: 0xffedcf, far: 0xbdd6b9, ground: 0xe0cba3, accent: 0x5d9980, deep: 0x385452, light: 0xfffaea },
  harvest: { sky: 0xffedcf, far: 0xbdd6b9, ground: 0xe0cba3, accent: 0xb39a43, deep: 0x385452, light: 0xfffaea },
  sugarcane: { sky: 0xffe9c2, far: 0xb8d2b2, ground: 0xf3d6a4, accent: 0x398569, deep: 0x245f50, light: 0xf2fff4 },
  construction: { sky: 0xc6e7f0, far: 0x9db7c7, ground: 0xdfbf8f, accent: 0xe68d45, deep: 0x8f4f39, light: 0xfff3d1 },
  shipper: { sky: 0xe2f1de, far: 0xabc5b0, ground: 0xb4cbc1, accent: 0x4c9f92, deep: 0x284b57, light: 0xeff9f4 },
  noodle: { sky: 0xffe9d1, far: 0xd1bdba, ground: 0xd4ab89, accent: 0xc77a4d, deep: 0x7d4941, light: 0xfff8ea },
  barber: { sky: 0xe6dcf4, far: 0xb8a5cf, ground: 0xafa0c3, accent: 0x8b69ad, deep: 0x4d3e67, light: 0xfff6ed },
  carwash: { sky: 0xd9f3f0, far: 0x9bcacb, ground: 0x97bec4, accent: 0x318eac, deep: 0x285564, light: 0xf3ffff },
  rubber: { sky: 0xdcebc6, far: 0x90ad79, ground: 0xb3bc8a, accent: 0x59885a, deep: 0x324f36, light: 0xf6ffe5 },
  mechanic: { sky: 0xe3e9e4, far: 0x94a8ad, ground: 0xb5bab2, accent: 0x55859a, deep: 0x324854, light: 0xf8f4df },
  coffee: { sky: 0xf8e9cc, far: 0xbbb4a0, ground: 0xccae8c, accent: 0x99705a, deep: 0x594036, light: 0xfffae8 },
  fishing: { sky: 0xdaf0ec, far: 0x89b4a2, ground: 0xa8cbaa, accent: 0x468c98, deep: 0x2b555c, light: 0xf0fff0 },
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
