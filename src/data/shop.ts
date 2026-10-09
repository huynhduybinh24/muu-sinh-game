import { avatarOptions } from './avatar'
import type { PlayerAppearance } from '../types/profile'
import type { ClothingCategory, ClothingItem, ItemId, ItemRarity, ShopItem } from '../types/shop'
import { lifestyleProducts } from './lifestyleProducts'

export const itemCategories: Record<ClothingCategory, { label: string; appearanceKey: 'hairId' | 'shirtId' | 'pantsId' }> = {
  hair: { label: 'TÓC', appearanceKey: 'hairId' },
  shirt: { label: 'ÁO', appearanceKey: 'shirtId' },
  pants: { label: 'QUẦN', appearanceKey: 'pantsId' },
}
export const itemRarities: Record<ItemRarity, { label: string; color: string }> = {
  common: { label: 'PHỔ THÔNG', color: '#557967' },
  rare: { label: 'HIẾM', color: '#3279a8' },
  epic: { label: 'ĐẶC BIỆT', color: '#8258a6' },
}
// The first two options of each category are permanent starters. IDs/colors live in avatar.ts.
const tiers = [
  { price: 0, unlockLevel: 1, rarity: 'common' }, { price: 0, unlockLevel: 1, rarity: 'common' },
  { price: 20_000, unlockLevel: 1, rarity: 'common' }, { price: 30_000, unlockLevel: 1, rarity: 'common' },
  { price: 60_000, unlockLevel: 2, rarity: 'rare' }, { price: 80_000, unlockLevel: 2, rarity: 'rare' },
  { price: 250_000, unlockLevel: 3, rarity: 'epic' }, { price: 500_000, unlockLevel: 4, rarity: 'epic' },
  { price: 650_000, unlockLevel: 4, rarity: 'epic' }, { price: 750_000, unlockLevel: 5, rarity: 'epic' },
] as const

export const shopItems: readonly ShopItem[] = [
  ...avatarOptions.hairId.map((option, index): ShopItem => ({
    id: `hair-${option.id}`, name: option.label, category: 'hair', appearanceValue: option.id, color: option.color,
    ...(tiers[index] ?? { price: 120_000, unlockLevel: 2, rarity: 'rare' }), description: `Kiểu ${option.label.toLocaleLowerCase('vi-VN')} cho một ngày tự tin.`,
  })),
  ...avatarOptions.shirtId.map((option, index): ShopItem => ({
    id: `shirt-${option.id}`, name: option.label, category: 'shirt', appearanceValue: option.id, color: option.color,
    ...(tiers[index] ?? { price: 120_000 + (index - 10) * 65_000, unlockLevel: 1, rarity: 'rare' }), description: `Áo ${option.label.toLocaleLowerCase('vi-VN')}, đổi màu đổi tâm trạng.`,
  })),
  ...avatarOptions.pantsId.map((option, index): ShopItem => ({
    id: `pants-${option.id}`, name: option.label, category: 'pants', appearanceValue: option.id, color: option.color,
    ...(index < 6 ? tiers[index] : { price: 90_000 + (index - 6) * 55_000, unlockLevel: 1, rarity: 'rare' }), description: `Quần ${option.label.toLocaleLowerCase('vi-VN')} dễ phối mỗi ngày.`,
  })),
  ...lifestyleProducts,
]
export const shopItemsById = Object.fromEntries(shopItems.map((item) => [item.id, item])) as Record<ItemId, ShopItem>
export const starterItemIds: readonly ItemId[] = shopItems.filter((item) => item.price === 0).map((item) => item.id)
export function getShopItem(id: string): ShopItem | undefined {
  return Object.hasOwn(shopItemsById, id) ? shopItemsById[id as ItemId] : undefined
}
export function isClothingItem(item: ShopItem): item is ClothingItem { return item.category === 'hair' || item.category === 'shirt' || item.category === 'pants' }
export function withItem(appearance: PlayerAppearance, item: ShopItem): PlayerAppearance {
  if (!isClothingItem(item)) return appearance
  switch (item.category) {
    case 'hair': return { ...appearance, hairId: item.appearanceValue }
    case 'shirt': return { ...appearance, shirtId: item.appearanceValue }
    case 'pants': return { ...appearance, pantsId: item.appearanceValue }
  }
}
export function isItemEquipped(appearance: PlayerAppearance, item: ShopItem): boolean {
  if (!isClothingItem(item)) return false
  return appearance[itemCategories[item.category].appearanceKey] === item.appearanceValue
}
