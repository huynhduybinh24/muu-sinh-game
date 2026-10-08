export const COFFEE_CONFIG = { patience: { min: 10, max: 14 }, extractionMs: 3600,
  perfectZone: [0.48, 0.68], acceptableZone: [0.33, 0.84], correct: 120, acceptable: 80, wrong: -50,
  timeout: -30, fastBonus: 30, nextCustomerMs: 550 } as const
export type CoffeeIngredient = 'condensed' | 'fresh' | 'ice'
export type CoffeeCup = Record<CoffeeIngredient, boolean>
export const emptyCoffeeCup = (): CoffeeCup => ({ condensed: false, fresh: false, ice: false })
export const coffeeRecipes = [
  { id: 'black', name: 'CÀ PHÊ ĐEN', condensed: false, fresh: false, ice: true },
  { id: 'milk', name: 'CÀ PHÊ SỮA', condensed: true, fresh: false, ice: true },
  { id: 'white', name: 'BẠC XỈU', condensed: true, fresh: true, ice: true },
] as const
export type CoffeeRecipe = typeof coffeeRecipes[number]
export function extractionGrade(ratio: number): 'perfect' | 'acceptable' | 'weak' | 'bitter' {
  if (!Number.isFinite(ratio) || ratio < COFFEE_CONFIG.acceptableZone[0]) return 'weak'
  if (ratio > COFFEE_CONFIG.acceptableZone[1]) return 'bitter'
  return ratio >= COFFEE_CONFIG.perfectZone[0] && ratio <= COFFEE_CONFIG.perfectZone[1] ? 'perfect' : 'acceptable'
}
export function evaluateCoffee(cup: CoffeeCup, recipe: CoffeeRecipe, ratio: number | null) {
  const extraction = ratio === null ? 'weak' : extractionGrade(ratio)
  const correctRecipe = (['condensed', 'fresh', 'ice'] as const).every((key) => cup[key] === recipe[key])
  const grade = correctRecipe && ratio !== null && extraction === 'perfect' ? 'perfect'
    : correctRecipe && ratio !== null && extraction === 'acceptable' ? 'acceptable' : 'wrong'
  return { grade, points: grade === 'perfect' ? COFFEE_CONFIG.correct : grade === 'acceptable' ? COFFEE_CONFIG.acceptable : COFFEE_CONFIG.wrong }
}
