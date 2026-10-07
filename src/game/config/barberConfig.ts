export const BARBER_CONFIG = {
  patienceSeconds: { min: 8, max: 12 }, sectionCount: 6, nextCustomerMs: 550,
  scoring: { perfect: 150, good: 100, acceptable: 50, bad: -40 },
  maximumFastBonus: 30, timeout: -30,
} as const
export interface HaircutPattern { id: string; name: string; keep: readonly boolean[] }
export const haircutPatterns: readonly HaircutPattern[] = [
  { id: 'middle', name: 'MÁI GIỮA', keep: [false, true, false, false, true, false] },
  { id: 'short', name: 'GỌN GÀNG', keep: [true, true, true, false, false, false] },
  { id: 'side', name: 'MÁI LỆCH', keep: [true, true, false, true, false, false] },
  { id: 'crown', name: 'ĐẦU ĐINH', keep: [false, true, false, true, true, true] },
]
export function compareHaircut(sections: readonly boolean[], target: HaircutPattern) {
  const matches = target.keep.reduce((count, keep, index) => count + Number(sections[index] === keep), 0)
  const grade = matches === BARBER_CONFIG.sectionCount ? 'perfect'
    : matches === BARBER_CONFIG.sectionCount - 1 ? 'good'
      : matches === BARBER_CONFIG.sectionCount - 2 ? 'acceptable' : 'bad'
  return { grade, matches, points: BARBER_CONFIG.scoring[grade] }
}
