import { describe, expect, it } from 'vitest'
import { shopItems, getShopItem, isClothingItem } from '../src/data/shop'
import { shopCategories, emptyLifestyle } from '../src/data/lifestyle'
import { equipItem, purchaseItem } from '../src/services/inventory'
import { readLifestyle, removeEquipment } from '../src/services/lifestyle'
import { migratePersistedProgress } from '../src/services/saveMigration'
import { serializeSave, migrateImportedSave } from '../src/services/portableSave'

const funded = () => ({ ...migratePersistedProgress(undefined), money: 100_000_000, xp: 900 })
describe('lifestyle phase A catalog and atomic inventory', () => {
  it('has 100 unique products across ten categories, finite integer prices and no new free premiums', () => {
    expect(shopItems).toHaveLength(100)
    expect(new Set(shopItems.map(i => i.id)).size).toBe(100)
    expect(Object.keys(shopCategories)).toHaveLength(10)
    for (const item of shopItems) { expect(Number.isSafeInteger(item.price)).toBe(true); expect(item.price).toBeGreaterThanOrEqual(0); expect(item.name).toBeTruthy() }
    expect(shopItems.filter(i => i.price === 0)).toHaveLength(6)
    expect(getShopItem('__proto__')).toBeUndefined()
  })
  it.each(shopItems.filter(i => !isClothingItem(i)))('$id buys once, equips only after ownership and never changes score, XP or income', item => {
    const before = funded()
    expect(equipItem(before, item.id)).toBe(before)
    expect(purchaseItem({ ...before, money: item.price - 1 }, item.id).status).toBe('insufficient-money')
    const bought = purchaseItem(before, item.id).progress
    expect(bought.money).toBe(before.money - item.price); expect(bought.totalMoneySpent).toBe(item.price)
    expect(bought.xp).toBe(before.xp); expect(bought.jobStats).toBe(before.jobStats)
    expect(purchaseItem(bought, item.id)).toEqual({ status: 'owned', progress: bought })
    const equipped = equipItem(bought, item.id)
    expect(equipped.money).toBe(bought.money); expect(equipped.profile.lifestyle).toBeDefined()
    expect(removeEquipment(equipped, item.id).profile.lifestyle).toEqual(emptyLifestyle())
  })
  it('preserves old v5 without requiring a new key and round-trips new ownership/configuration', () => {
    const old = funded(); old.profile.appearance.shirtId = 'rose'; old.ownedItemIds.push('shirt-rose')
    const legacy = migrateImportedSave(serializeSave(old))
    expect(legacy.ok).toBe(true); if (!legacy.ok) throw new Error('legacy rejected')
    expect(legacy.save.data).toEqual(old)
    let current = old
    for (const id of ['life-shoes-sneakers', 'life-phone-daily', 'life-electronics-laptop', 'life-vehicle-compact', 'life-home-cot']) current = { ...current, ...equipItem(purchaseItem(current, id).progress, id) }
    const restored = migrateImportedSave(serializeSave(current))
    expect(restored.ok).toBe(true); if (!restored.ok) throw new Error('new save rejected')
    expect(restored.save.version).toBe(5); expect(restored.save.data).toEqual(current)
    expect(old.profile.lifestyle).toBeUndefined()
  })
  it('recovers unknown, wrong-slot and unowned selections without granting ownership', () => {
    expect(readLifestyle({ equipment: { hat: 'life-phone-daily', hand: 'missing' }, vehicle: '__proto__' })).toEqual(emptyLifestyle())
    const life = { ...emptyLifestyle(), phone: 'life-phone-pro' }
    expect(readLifestyle(life, [])).toEqual(emptyLifestyle())
    const before = funded(), malformed = JSON.parse(serializeSave(before))
    malformed.data.profile.lifestyle = { equipment: [], room: {}, phone: 2 }
    expect(migrateImportedSave(malformed).ok).toBe(false)
  })
  it('grandfathers only legacy clothing, not new premium appearance values', () => {
    const old = funded()
    const source = { ...old, profile: { ...old.profile, appearance: { ...old.profile.appearance, shirtId: 'rose' } } }
    expect(migratePersistedProgress(source, 3).ownedItemIds).toContain('shirt-rose')
    const newClothes = { ...source, profile: { ...source.profile, appearance: { ...source.profile.appearance, shirtId: 'blazer', hairId: 'wave', pantsId: 'formal' } } }
    const safe = migratePersistedProgress(newClothes, 3)
    expect(safe.ownedItemIds).not.toEqual(expect.arrayContaining(['shirt-blazer','hair-wave','pants-formal']))
    expect(safe.profile.appearance).toEqual(old.profile.appearance)
  })
  it('keeps all original clothing price/level pairs and validates every lifestyle category slot', () => {
    const tiers = [[0,1],[0,1],[20000,1],[30000,1],[60000,2],[80000,2],[250000,3],[500000,4],[650000,4],[750000,5]]
    const old = { hair:['crop','swoop','bob','bun','curls','long'], shirt:['coral','mint','blue','sunshine','lavender','cream','cherry','charcoal','ocean','rose'], pants:['denim','navy','sand','forest','charcoal','plum'] }
    for (const [category,ids] of Object.entries(old)) ids.forEach((id,index) => {
      const item = getShopItem(`${category}-${id}`)!
      expect([item.price,item.unlockLevel]).toEqual(tiers[index])
    })
    const slots = { shoes:['shoes'],accessory:['hat','face','back','hand'],phone:['phone'],electronics:['computer'],vehicle:['vehicle'],tools:['back','hand'],home:['bed','desk','seat','storage','lounge','screen','plant','light','decor'] }
    for (const item of shopItems) if (!isClothingItem(item)) expect(slots[item.category]).toContain(item.slot)
    expect(Math.max(...shopItems.map(item => item.price))).toBe(60000000)
  })
})
