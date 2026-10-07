import type { HairId, ShirtId, PantsId } from './profile'

export type ItemCategory = 'hair' | 'shirt' | 'pants'
export type ItemRarity = 'common' | 'rare' | 'epic'
export type ItemId = `hair-${HairId}` | `shirt-${ShirtId}` | `pants-${PantsId}`
interface ItemDetails {
  id: ItemId
  name: string
  price: number
  unlockLevel: number
  rarity: ItemRarity
  description: string
}
export type ShopItem = ItemDetails & (
  | { category: 'hair'; appearanceValue: HairId }
  | { category: 'shirt'; appearanceValue: ShirtId }
  | { category: 'pants'; appearanceValue: PantsId }
)
export type PurchaseStatus = 'purchased' | 'owned' | 'insufficient-money' | 'level-locked' | 'invalid-item'
