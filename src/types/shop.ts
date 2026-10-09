import type { HairId, ShirtId, PantsId } from './profile'

export type ClothingCategory = 'hair' | 'shirt' | 'pants'
export type ItemCategory = ClothingCategory | 'shoes' | 'accessory' | 'phone' | 'electronics' | 'vehicle' | 'tools' | 'home'
export type ItemRarity = 'common' | 'rare' | 'epic'
export type LifestyleItemId = `life-${string}`
export type ItemId = `hair-${HairId}` | `shirt-${ShirtId}` | `pants-${PantsId}` | LifestyleItemId
export type WearableSlot = 'shoes' | 'hat' | 'face' | 'back' | 'hand'
export type RoomSlot = 'bed' | 'desk' | 'seat' | 'storage' | 'lounge' | 'screen' | 'plant' | 'light' | 'decor'
export type VehicleType = 'bicycle' | 'motorcycle' | 'scooter' | 'car'
export type EquipmentSlot = WearableSlot | 'phone' | 'computer' | 'vehicle' | RoomSlot
export interface LifestyleState {
  equipment: Record<WearableSlot, LifestyleItemId | null>
  phone: LifestyleItemId | null
  computer: LifestyleItemId | null
  vehicle: LifestyleItemId | null
  room: Record<RoomSlot, LifestyleItemId | null>
}
interface ItemDetails {
  id: ItemId
  name: string
  price: number
  unlockLevel: number
  rarity: ItemRarity
  description: string
  color?: string
  style?: string
}
export type ClothingItem = ItemDetails & (
  | { category: 'hair'; appearanceValue: HairId }
  | { category: 'shirt'; appearanceValue: ShirtId }
  | { category: 'pants'; appearanceValue: PantsId }
)
export type LifestyleItem = ItemDetails & {
  id: LifestyleItemId
  category: Exclude<ItemCategory, ClothingCategory>
  slot: EquipmentSlot
  vehicleType?: VehicleType
}
export type ShopItem = ClothingItem | LifestyleItem
export type PurchaseStatus = 'purchased' | 'owned' | 'insufficient-money' | 'level-locked' | 'invalid-item'
