import { isClothingItem, withItem } from '../data/shop'
import { previewLifestyle } from './lifestyle'
import type { PlayerProfile } from '../types/profile'
import type { ItemId, ShopItem } from '../types/shop'

export interface ShopFilter { search: string; owned: 'all' | 'owned' | 'unowned'; affordable: boolean; maxPrice: number; sort: 'catalog' | 'low' | 'high' }
export const defaultShopFilter: ShopFilter = { search: '', owned: 'all', affordable: false, maxPrice: Infinity, sort: 'catalog' }
const normalize = (text: string) => text.toLocaleLowerCase('vi-VN').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
export function filterProducts(items: readonly ShopItem[], filter: ShopFilter, owned: readonly ItemId[], money: number): ShopItem[] {
  const result = items.filter(item => (!filter.search || normalize(item.name).includes(normalize(filter.search)))
    && (filter.owned === 'all' || owned.includes(item.id) === (filter.owned === 'owned'))
    && (!filter.affordable || item.price <= money || owned.includes(item.id)) && item.price <= filter.maxPrice)
  if (filter.sort !== 'catalog') result.sort((a, b) => (a.price - b.price) * (filter.sort === 'low' ? 1 : -1))
  return result
}
export function previewProduct(profile: PlayerProfile, item: ShopItem): PlayerProfile {
  return isClothingItem(item) ? { ...profile, appearance: withItem(profile.appearance, item) } : previewLifestyle(profile, item)
}
