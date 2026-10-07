export const NOODLE_CONFIG = {
  patienceSeconds: { min: 9, max: 13 }, correct: 100, maximumFastBonus: 50,
  wrong: -50, timeout: -30, nextCustomerMs: 550,
} as const

export const noodleIngredients = [
  { id: 'noodles', label: 'THÊM HỦ TIẾU', icon: '🍜' },
  { id: 'broth', label: 'THÊM NƯỚC', icon: '🥣' },
  { id: 'meat', label: 'THÊM THỊT', icon: '🥩' },
  { id: 'vegetables', label: 'THÊM RAU', icon: '🥬' },
] as const
export type NoodleIngredient = typeof noodleIngredients[number]['id']
export type NoodleBowl = Record<NoodleIngredient, boolean>
export interface NoodleRecipe { id: string; name: string; ingredients: readonly NoodleIngredient[] }
export const noodleRecipes: readonly NoodleRecipe[] = [
  { id: 'meat', name: 'HỦ TIẾU THỊT', ingredients: ['noodles', 'broth', 'meat'] },
  { id: 'vegetables', name: 'HỦ TIẾU RAU', ingredients: ['noodles', 'broth', 'vegetables'] },
  { id: 'full', name: 'HỦ TIẾU ĐẦY ĐỦ', ingredients: ['noodles', 'broth', 'meat', 'vegetables'] },
]
export function emptyNoodleBowl(): NoodleBowl {
  return { noodles: false, broth: false, meat: false, vegetables: false }
}
export function isCorrectBowl(bowl: NoodleBowl, recipe: NoodleRecipe): boolean {
  return noodleIngredients.every(({ id }) => bowl[id] === recipe.ingredients.includes(id))
}
