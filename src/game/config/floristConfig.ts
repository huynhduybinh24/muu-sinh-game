export const FLORIST_CONFIG = { perfect: 150, good: 100, acceptable: 50, wrong: -30, patience: 15, minimumPatience: 9, nextMs: 600, slotRadius: 43 } as const
export const flowerIds = ['rose', 'sunflower', 'lily'] as const
export type FlowerId = typeof flowerIds[number]
export type Ribbon = 'pink' | 'gold'
export const flowerColors: Record<FlowerId, number> = { rose: 0xdf909f, sunflower: 0xebbd55, lily: 0xb4a0d0 }
export const flowerNames: Record<FlowerId, string> = { rose: 'HỒNG', sunflower: 'CÚC', lily: 'LY' }
export interface BouquetOrder { flowers: readonly FlowerId[]; ribbon: Ribbon }
export const bouquetOrders: readonly BouquetOrder[] = [
  { flowers: ['rose', 'sunflower', 'lily'], ribbon: 'pink' },
  { flowers: ['rose', 'rose', 'lily'], ribbon: 'gold' },
  { flowers: ['sunflower', 'lily', 'sunflower'], ribbon: 'gold' },
  { flowers: ['lily', 'rose', 'rose'], ribbon: 'pink' },
]
export const bouquetSlots = [{ x: 128, y: 302 }, { x: 211, y: 333 }, { x: 292, y: 302 }] as const
export function evaluateBouquet(flowers: readonly (FlowerId | null)[], ribbon: Ribbon, order: BouquetOrder) {
  const matches = order.flowers.filter((id, i) => flowers[i] === id).length, decoration = ribbon === order.ribbon
  const grade = matches === 3 && decoration ? 'perfect' : matches >= 2 && decoration ? 'good' : matches >= 2 || matches >= 1 && decoration ? 'acceptable' : 'wrong'
  return { grade, points: FLORIST_CONFIG[grade] }
}

