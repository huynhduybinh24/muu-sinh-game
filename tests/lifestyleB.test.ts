import { describe, expect, it } from 'vitest'
import { migratePersistedProgress } from '../src/services/saveMigration'
import { getShopItem, shopItems } from '../src/data/shop'
import { equipItem, purchaseItem } from '../src/services/inventory'
import { defaultShopFilter, filterProducts, previewProduct } from '../src/services/shopFilters'
import { getPhaserAvatarData } from '../src/game/avatar/avatarData'

describe('lifestyle phase B preview and rendering boundary', () => {
  it('previews unowned fashion/accessories independently without changing save data', () => {
    const progress = migratePersistedProgress(undefined), before = JSON.stringify(progress)
    const preview = previewProduct(progress.profile, getShopItem('life-accessory-round')!)
    expect(preview.lifestyle?.equipment.face).toBe('life-accessory-round')
    expect(previewProduct(progress.profile, getShopItem('shirt-hoodie')!).appearance.shirtId).toBe('hoodie')
    expect(JSON.stringify(progress)).toBe(before)
    expect(progress.profile.lifestyle).toBeUndefined()
  })
  it('filters owned/affordable/price/search and sorts without changing catalog order', () => {
    const original = [...shopItems]
    expect(filterProducts(shopItems, { ...defaultShopFilter, search: 'dien thoai' }, [], 0).map(i => i.id)).toContain('life-phone-basic')
    expect(filterProducts(shopItems, { ...defaultShopFilter, owned: 'owned' }, ['shirt-blue'], 0).map(i => i.id)).toEqual(['shirt-blue'])
    const cheap = filterProducts(shopItems, { ...defaultShopFilter, affordable: true, maxPrice: 30000, sort: 'low' }, [], 25000)
    expect(cheap.every(i => i.price <= 25000)).toBe(true); expect(cheap.map(i => i.price)).toEqual(cheap.map(i => i.price).sort((a,b) => a-b))
    expect(shopItems).toEqual(original)
  })
  it('passes a fresh, normalized accessory snapshot into all shared Phaser avatars', () => {
    let progress = { ...migratePersistedProgress(undefined), money: 1000000 }
    for (const id of ['life-shoes-sneakers','life-accessory-cap','life-accessory-round','life-accessory-canvas-bag','life-tools-thermos']) progress = { ...progress, ...equipItem(purchaseItem(progress,id).progress,id) }
    const data = getPhaserAvatarData(progress.profile)
    expect(data.lifestyle).toEqual(progress.profile.lifestyle)
    expect(data.lifestyle).not.toBe(progress.profile.lifestyle)
    expect(data.lifestyle?.equipment.shoes).toBe('life-shoes-sneakers')
    expect(data.colors.skin).toBe(0xeebe93)
  })
})
