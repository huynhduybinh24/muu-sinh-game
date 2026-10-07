import { beforeEach, describe, expect, it } from 'vitest'
import { avatarOptions, defaultAppearance } from '../src/data/avatar'
import { getShopItem, itemCategories, shopItems, starterItemIds } from '../src/data/shop'
import { getNewAchievementUnlocks } from '../src/data/achievements'
import { ownsItem, canAffordItem, equipItem, purchaseItem, readOwnedItems } from '../src/services/inventory'
import { getGameXp, getLevelProgress, getLevelThreshold, migrateLegacyXp } from '../src/services/level'
import { applyGameCompletion } from '../src/services/progression'
import { getPhaserAvatarData } from '../src/game/avatar/avatarData'
import { migratePersistedProgress, useProgressStore } from '../src/store/progressStore'
import { dailyResult } from './fixtures'

beforeEach(() => useProgressStore.getState().resetProgress())
const item = getShopItem('shirt-blue')!
const funded = () => ({ ...migratePersistedProgress(undefined), money: 2_000_000, xp: getLevelThreshold(5) })

describe('shop catalog', () => {
  it('has 6 hair, 10 shirts, 6 pants, unique valid IDs and shared avatar values', () => {
    expect(shopItems).toHaveLength(22)
    expect(new Set(shopItems.map((entry) => entry.id)).size).toBe(22)
    for (const category of ['hair', 'shirt', 'pants'] as const) {
      const key = itemCategories[category].appearanceKey
      expect(shopItems.filter((entry) => entry.category === category).length).toBe(avatarOptions[key].length)
    }
    for (const entry of shopItems) {
      expect(avatarOptions[itemCategories[entry.category].appearanceKey].some((option) => option.id === entry.appearanceValue)).toBe(true)
      expect(Number.isInteger(entry.price) && entry.price >= 0).toBe(true)
      expect(entry.unlockLevel).toBeGreaterThanOrEqual(1)
      expect(['common', 'rare', 'epic']).toContain(entry.rarity)
      expect(entry.description).not.toBe('')
    }
    expect(getShopItem('toString')).toBeUndefined()
  })
  it('owns two permanent free items in each category, including defaults', () => {
    expect(starterItemIds).toHaveLength(6)
    const initial = migratePersistedProgress(undefined)
    expect(initial.ownedItemIds).toEqual(starterItemIds)
    expect(initial.totalMoneySpent).toBe(0)
    for (const category of ['hair', 'shirt', 'pants'] as const) {
      expect(shopItems.filter((entry) => entry.category === category && entry.price === 0)).toHaveLength(2)
    }
  })
})

describe('atomic purchases and equipment', () => {
  it('buys once, keeps outfit unchanged, accumulates spending and never mutates the source', () => {
    const before = funded()
    const result = purchaseItem(before, item.id)
    expect(result.status).toBe('purchased')
    expect(result.progress.money).toBe(before.money - item.price)
    expect(result.progress.totalMoneySpent).toBe(item.price)
    expect(ownsItem(result.progress.ownedItemIds, item.id)).toBe(true)
    expect(result.progress.profile).toBe(before.profile)
    expect(before.ownedItemIds).not.toContain(item.id)
    expect(purchaseItem(result.progress, item.id)).toEqual({ status: 'owned', progress: result.progress })
  })
  it('rejects insufficient funds, negative/invalid money and locked levels', () => {
    for (const money of [0, item.price - 1, -1, NaN, Infinity]) {
      const before = { ...funded(), money }
      expect(canAffordItem(money, item)).toBe(false)
      expect(purchaseItem(before, item.id)).toEqual({ status: 'insufficient-money', progress: before })
    }
    const before = { ...funded(), xp: 0 }
    expect(purchaseItem(before, 'shirt-cherry')).toEqual({ status: 'level-locked', progress: before })
    expect(purchaseItem(before, 'missing')).toEqual({ status: 'invalid-item', progress: before })
  })
  it('allows exact funds and equips only owned items using the same appearance model', () => {
    const before = { ...funded(), money: item.price }
    expect(equipItem(before, item.id)).toBe(before)
    expect(equipItem(before, 'missing')).toBe(before)
    const bought = purchaseItem(before, item.id).progress
    expect(bought.money).toBe(0)
    const equipped = equipItem(bought, item.id)
    expect(equipped.profile.appearance.shirtId).toBe('blue')
    expect(equipped.money).toBe(0)
    expect(equipped.ownedItemIds).toBe(bought.ownedItemIds)
    expect(getPhaserAvatarData(equipped.profile).colors.shirt).toBe(0x69a5e4)
  })
  it('prevents rapid double purchase through the actual Zustand actions', () => {
    useProgressStore.setState(funded())
    const store = useProgressStore.getState()
    expect(store.purchaseItem(item.id).status).toBe('purchased')
    expect(store.purchaseItem(item.id).status).toBe('owned')
    expect(useProgressStore.getState().money).toBe(2_000_000 - item.price)
    expect(useProgressStore.getState().totalMoneySpent).toBe(item.price)
    expect(store.equipItem('shirt-rose')).toBe(false)
    expect(store.equipItem(item.id)).toBe(true)
  })
  it('creator and editor cannot bypass ownership; gender/skin remain free', () => {
    const paid = { ...defaultAppearance, gender: 'female', skinToneId: 'deep', hairId: 'bun', shirtId: 'rose', pantsId: 'plum' } as const
    useProgressStore.getState().createProfile('Minh', paid)
    expect(useProgressStore.getState().profile.appearance).toEqual({ ...defaultAppearance, gender: 'female', skinToneId: 'deep' })
    useProgressStore.getState().updateAppearance(paid)
    expect(useProgressStore.getState().profile.appearance.shirtId).toBe('coral')
  })
})

describe('v4 inventory/XP migration', () => {
  it('grandfathers worn paid items in old saves, without spending or losing identity/progress', async () => {
    const original = funded()
    const { xp: _xp, ownedItemIds: _owned, totalMoneySpent: _spent, ...legacy } = original
    expect(_xp).toBe(getLevelThreshold(5))
    expect([_owned.length, _spent]).toEqual([6, 0])
    legacy.totalGamesPlayed = 27
    legacy.profile = { playerName: 'Thợ cũ', createdAt: '2026-01-01', appearance: { ...defaultAppearance, hairId: 'bun', shirtId: 'lavender', pantsId: 'forest' } }
    localStorage.setItem('muu-sinh-player-progress', JSON.stringify({ version: 3, state: legacy }))
    await useProgressStore.persist.rehydrate()
    const migrated = useProgressStore.getState()
    expect(migrated.profile).toEqual(legacy.profile)
    expect(migrated.ownedItemIds).toEqual(expect.arrayContaining(['hair-bun', 'shirt-lavender', 'pants-forest']))
    expect(migrated.money).toBe(legacy.money)
    expect(migrated.totalMoneySpent).toBe(0)
    expect(getLevelProgress(migrated.xp).level).toBe(3)
    expect(migrated.jobStats).toEqual(legacy.jobStats)
    expect(JSON.parse(localStorage.getItem('muu-sinh-player-progress')!).version).toBe(5)
  })
  it('rejects unknown/duplicate inventory and does not grant paid equipment on v4 hydration', () => {
    const source = funded()
    source.profile.appearance.shirtId = 'rose'
    source.ownedItemIds = ['shirt-blue', 'shirt-blue']
    const restored = migratePersistedProgress(source, 4)
    expect(restored.ownedItemIds.filter((id) => id === 'shirt-blue')).toHaveLength(1)
    expect(restored.ownedItemIds).not.toContain('shirt-rose')
    expect(restored.profile.appearance.shirtId).toBe('coral')
    expect(readOwnedItems(['missing', 'toString', 3])).toEqual(starterItemIds)
  })
  it('persisted outfit/inventory/spending/XP survive refresh and cannot unlock a free purchase twice', async () => {
    useProgressStore.setState(funded())
    useProgressStore.getState().purchaseItem(item.id)
    useProgressStore.getState().equipItem(item.id)
    const snapshot = localStorage.getItem('muu-sinh-player-progress')!
    useProgressStore.getState().resetProgress()
    localStorage.setItem('muu-sinh-player-progress', snapshot)
    await useProgressStore.persist.rehydrate()
    const restored = useProgressStore.getState()
    expect(restored.profile.appearance.shirtId).toBe('blue')
    expect(restored.totalMoneySpent).toBe(item.price)
    expect(restored.xp).toBe(getLevelThreshold(5))
    expect(restored.purchaseItem(item.id).status).toBe('owned')
  })
})

describe('XP/levels and shop achievements', () => {
  it('grants bounded score-based XP without changing score/rewards', () => {
    expect([0, 100, 1000, 100000, -1, NaN].map(getGameXp)).toEqual([30, 35, 80, 150, 30, 30])
    const result = dailyResult('2026-10-07', 100)
    const before = { ...funded(), xp: 140 }
    const update = applyGameCompletion(before, result, '2026-10-07').progress
    expect(update.xp).toBe(175)
    expect(getLevelProgress(update.xp).level).toBe(2)
    expect(update.money).toBe(before.money + result.earnedMoney)
    expect(update.jobStats[result.jobId].totalScore).toBe(result.score)
  })
  it('uses growing, open-ended thresholds with correct exact boundaries and legacy levels', () => {
    for (const level of [2, 3, 5, 20, 100, 1000]) {
      const threshold = getLevelThreshold(level)
      expect(getLevelProgress(threshold - 1).level).toBe(level - 1)
      expect(getLevelProgress(threshold)).toMatchObject({ level, current: 0, percent: 0 })
      expect(getLevelThreshold(level + 1) - threshold).toBeGreaterThan(getLevelThreshold(level) - getLevelThreshold(level - 1))
    }
    expect(getLevelProgress(NaN).level).toBe(1)
    expect(getLevelProgress(-50).level).toBe(1)
    expect([0, 9, 10, 25].map((games) => getLevelProgress(migrateLegacyXp(games)).level)).toEqual([1, 1, 2, 3])
  })
  it('does not unlock ownership achievements from free starters; unlocks paid-count/spend once', () => {
    const progress = funded()
    const paid = shopItems.filter((entry) => entry.price > 0)
    const ids = () => getNewAchievementUnlocks(progress, '2026-10-07').map((unlock) => unlock.id)
    expect(ids()).not.toContain('fashion-5')
    progress.ownedItemIds.push(...paid.slice(0, 4).map((entry) => entry.id))
    expect(ids()).not.toContain('fashion-5')
    progress.ownedItemIds.push(paid[4].id)
    expect(ids()).toContain('fashion-5')
    progress.ownedItemIds.push(...paid.slice(5, 10).map((entry) => entry.id))
    progress.totalMoneySpent = 499_999
    expect(ids()).toContain('wardrobe-10')
    expect(ids()).not.toContain('shopping-500k')
    progress.totalMoneySpent = 500_000
    const unlocks = getNewAchievementUnlocks(progress, '2026-10-07')
    expect(unlocks.map((unlock) => unlock.id)).toContain('shopping-500k')
    progress.achievements = unlocks
    expect(getNewAchievementUnlocks(progress, '2026-10-08')).toEqual([])
  })
})
