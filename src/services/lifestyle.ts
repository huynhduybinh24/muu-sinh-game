import { emptyLifestyle, roomSlots, wearableSlots } from '../data/lifestyle'
import { getShopItem, isClothingItem, isItemEquipped } from '../data/shop'
import type { PlayerProgress } from '../types/game'
import type { PlayerProfile } from '../types/profile'
import type { EquipmentSlot, ItemId, LifestyleItemId, LifestyleState, ShopItem } from '../types/shop'

const record = (value: unknown): Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}
export function readLifestyle(value: unknown, owned?: readonly ItemId[]): LifestyleState {
  const source = record(value), equipment = record(source.equipment), room = record(source.room)
  const select = (id: unknown, slot: EquipmentSlot): LifestyleItemId | null => {
    const item = typeof id === 'string' ? getShopItem(id) : undefined
    return item && !isClothingItem(item) && item.slot === slot && (!owned || owned.includes(item.id)) ? item.id : null
  }
  const result = emptyLifestyle()
  wearableSlots.forEach(slot => { result.equipment[slot] = select(equipment[slot], slot) })
  result.phone = select(source.phone, 'phone'); result.computer = select(source.computer, 'computer'); result.vehicle = select(source.vehicle, 'vehicle')
  for (const slot of Object.keys(roomSlots) as (keyof typeof roomSlots)[]) result.room[slot] = select(room[slot], slot)
  return result
}
export const getLifestyle = (profile: Pick<PlayerProfile, 'lifestyle'>) => readLifestyle(profile.lifestyle)
export function previewLifestyle(profile: PlayerProfile, item: ShopItem): PlayerProfile {
  if (isClothingItem(item)) return profile
  const next = getLifestyle(profile)
  if (item.category === 'home') next.room[item.slot as keyof LifestyleState['room']] = item.id
  else if (item.slot === 'phone' || item.slot === 'computer' || item.slot === 'vehicle') next[item.slot] = item.id
  else next.equipment[item.slot as keyof LifestyleState['equipment']] = item.id
  return { ...profile, lifestyle: next }
}
export function isProductEquipped(profile: PlayerProfile, item: ShopItem): boolean {
  if (isClothingItem(item)) return isItemEquipped(profile.appearance, item)
  const life = getLifestyle(profile)
  return item.category === 'home' ? life.room[item.slot as keyof LifestyleState['room']] === item.id
    : item.slot === 'phone' || item.slot === 'computer' || item.slot === 'vehicle' ? life[item.slot] === item.id
    : life.equipment[item.slot as keyof LifestyleState['equipment']] === item.id
}
export function removeEquipment(progress: PlayerProgress, itemId: string): PlayerProgress {
  const item = getShopItem(itemId)
  if (!item || !isProductEquipped(progress.profile, item)) return progress
  if (isClothingItem(item)) return progress // Clothing uses permanent owned starters, never a naked avatar.
  const next = getLifestyle(progress.profile)
  if (item.category === 'home') next.room[item.slot as keyof LifestyleState['room']] = null
  else if (item.slot === 'phone' || item.slot === 'computer' || item.slot === 'vehicle') next[item.slot] = null
  else next.equipment[item.slot as keyof LifestyleState['equipment']] = null
  return { ...progress, profile: { ...progress.profile, lifestyle: next } }
}
export function compatibleVehicle(profile: Pick<PlayerProfile, 'lifestyle'>, scene: 'shipper' | 'taxi'): ShopItem | undefined {
  const id = getLifestyle(profile).vehicle, item = id ? getShopItem(id) : undefined
  if (!item || isClothingItem(item)) return undefined
  return scene === 'taxi' ? item.vehicleType === 'car' ? item : undefined
    : item.vehicleType === 'motorcycle' || item.vehicleType === 'scooter' ? item : undefined
}
