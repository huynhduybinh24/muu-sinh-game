import { defaultAppearance } from '../data/avatar'
import { getShopItem, isItemEquipped, itemCategories, shopItems, starterItemIds, withItem } from '../data/shop'
import { getLevelProgress } from './level'
import type { PlayerAppearance } from '../types/profile'
import type { PlayerProgress } from '../types/game'
import type { ItemId, ShopItem, PurchaseStatus } from '../types/shop'

export function ownsItem(owned: readonly ItemId[], id: string): boolean { return owned.some((itemId) => itemId === id) }
export function canUseAppearanceOption(key: keyof PlayerAppearance, value: PlayerAppearance[keyof PlayerAppearance], owned: readonly ItemId[]): boolean {
  return key === 'gender' || key === 'skinToneId' || shopItems.some((item) =>
    itemCategories[item.category].appearanceKey === key && item.appearanceValue === value && ownsItem(owned, item.id))
}
export function canAffordItem(money: number, item: ShopItem): boolean { return Number.isFinite(money) && money >= item.price }
export function readOwnedItems(value: unknown, legacyAppearance?: PlayerAppearance): ItemId[] {
  const valid = Array.isArray(value) ? value.filter((id): id is ItemId => typeof id === 'string' && Boolean(getShopItem(id))) : []
  const grandfathered = legacyAppearance ? shopItems.filter((item) => isItemEquipped(legacyAppearance, item)).map((item) => item.id) : []
  return [...new Set([...starterItemIds, ...valid, ...grandfathered])]
}
export function ownedAppearance(appearance: PlayerAppearance, owned: readonly ItemId[]): PlayerAppearance {
  let safe = { ...appearance }
  for (const item of shopItems) {
    if (isItemEquipped(safe, item) && !ownsItem(owned, item.id)) {
      const fallback = shopItems.find((candidate) => candidate.category === item.category && isItemEquipped(defaultAppearance, candidate))!
      safe = withItem(safe, fallback)
    }
  }
  return safe
}
export function getPurchaseStatus(progress: Pick<PlayerProgress, 'money' | 'xp' | 'ownedItemIds'>, itemId: string): PurchaseStatus {
  const item = getShopItem(itemId)
  if (!item) return 'invalid-item'
  if (ownsItem(progress.ownedItemIds, item.id)) return 'owned'
  if (getLevelProgress(progress.xp).level < item.unlockLevel) return 'level-locked'
  if (!canAffordItem(progress.money, item)) return 'insufficient-money'
  return 'purchased'
}
export function purchaseItem(progress: PlayerProgress, itemId: string): { status: PurchaseStatus; progress: PlayerProgress } {
  const status = getPurchaseStatus(progress, itemId)
  const item = getShopItem(itemId)
  if (status !== 'purchased' || !item) return { status, progress }
  return { status, progress: {
    ...progress, money: progress.money - item.price,
    ownedItemIds: [...progress.ownedItemIds, item.id], totalMoneySpent: progress.totalMoneySpent + item.price,
  } }
}
export function equipItem(progress: PlayerProgress, itemId: string): PlayerProgress {
  const item = getShopItem(itemId)
  if (!item || !ownsItem(progress.ownedItemIds, item.id)) return progress
  return { ...progress, profile: { ...progress.profile, appearance: withItem(progress.profile.appearance, item) } }
}
