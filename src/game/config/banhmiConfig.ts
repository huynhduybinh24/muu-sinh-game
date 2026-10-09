export const BANHMI_CONFIG = { correct: 100, wrong: -50, timeout: -30, speedBonus: 50, patience: 13, minPatience: 7, difficultyStep: 0.4, nextMs: 550 } as const
export const breadIngredients = ['meat', 'pate', 'vegetables', 'chili', 'egg'] as const
export type BreadIngredient = typeof breadIngredients[number]
export type Sandwich = Record<BreadIngredient, boolean>
export const ingredientLabels: Record<BreadIngredient, string> = { meat: 'THỊT', pate: 'PÂTÉ', vegetables: 'RAU', chili: 'ỚT', egg: 'TRỨNG' }
export const breadOrders: readonly { name: string; ingredients: readonly BreadIngredient[] }[] = [
  { name: 'THỊT PÂTÉ', ingredients: ['meat', 'pate', 'vegetables'] },
  { name: 'TRỨNG RAU', ingredients: ['egg', 'vegetables'] },
  { name: 'THỊT CAY', ingredients: ['meat', 'pate', 'chili'] },
  { name: 'ĐẶC BIỆT', ingredients: ['meat', 'pate', 'vegetables', 'egg', 'chili'] },
  { name: 'TRỨNG PÂTÉ', ingredients: ['egg', 'pate', 'vegetables', 'chili'] },
]
export const emptySandwich = (): Sandwich => ({ meat: false, pate: false, vegetables: false, chili: false, egg: false })
export const evaluateSandwich = (sandwich: Sandwich, ingredients: readonly BreadIngredient[]) => breadIngredients.every(id => sandwich[id] === ingredients.includes(id))
export const breadPatience = (served: number) => Math.max(BANHMI_CONFIG.minPatience, BANHMI_CONFIG.patience - Math.max(0, served) * BANHMI_CONFIG.difficultyStep)

