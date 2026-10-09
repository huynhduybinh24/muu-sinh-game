import { beforeEach, describe, expect, it } from 'vitest'
import { useProgressStore, migratePersistedProgress } from '../src/store/progressStore'
import { getLifestyle } from '../src/services/lifestyle'
import { getNewAchievementUnlocks, achievements } from '../src/data/achievements'
import { serializeSave, migrateImportedSave } from '../src/services/portableSave'
import { jobs } from '../src/data/jobs'
import { createGameResult } from '../src/services/resultCalculator'
import { shopItems } from '../src/data/shop'

beforeEach(() => useProgressStore.getState().resetProgress())
describe('lifestyle phase D room, achievements and regression', () => {
  it('places only owned furniture, replaces a slot and removes without a charge', () => {
    useProgressStore.setState({ money:10000000, xp:900 })
    const store = useProgressStore.getState()
    expect(store.equipItem('life-home-bed')).toBe(false)
    for (const id of ['life-home-cot','life-home-bed','life-home-desk','life-home-chair','life-home-plant']) expect(store.purchaseItem(id).status).toBe('purchased')
    const balance = useProgressStore.getState().money
    store.equipItem('life-home-cot'); store.equipItem('life-home-bed'); store.equipItem('life-home-desk'); store.equipItem('life-home-chair'); store.equipItem('life-home-plant')
    expect(getLifestyle(useProgressStore.getState().profile).room.bed).toBe('life-home-bed')
    expect(useProgressStore.getState().achievements.some(i => i.id === 'furnished-room')).toBe(true)
    expect(store.unequipItem('life-home-bed')).toBe(true)
    expect(useProgressStore.getState().money).toBe(balance)
    expect(useProgressStore.getState().achievements.some(i => i.id === 'furnished-room')).toBe(true)
  })
  it('appends six achievement IDs, unlocks once and never pays currency for unlocking', () => {
    expect(achievements).toHaveLength(46)
    const p = migratePersistedProgress(undefined), original = p.money
    expect(getNewAchievementUnlocks(p,'2026-10-09')).toEqual([])
    expect(p.money).toBe(original)
    useProgressStore.setState({ money:1000000 })
    const s = useProgressStore.getState()
    s.purchaseItem('life-shoes-sneakers'); s.equipItem('life-shoes-sneakers')
    expect(useProgressStore.getState().achievements.map(a => a.id)).toEqual(expect.arrayContaining(['first-purchase','complete-outfit']))
    const before = useProgressStore.getState().money
    s.equipItem('life-shoes-sneakers'); s.unequipItem('life-shoes-sneakers'); s.equipItem('life-shoes-sneakers')
    expect(useProgressStore.getState().achievements.filter(a => a.id === 'complete-outfit')).toHaveLength(1)
    expect(useProgressStore.getState().money).toBe(before)
  })
  it('keeps complete lifestyle data through persistence/restart and portable restore', async () => {
    useProgressStore.setState({ money:1000000 })
    const s = useProgressStore.getState(); s.purchaseItem('life-phone-daily'); s.equipItem('life-phone-daily')
    const before = migratePersistedProgress(useProgressStore.getState()), raw = localStorage.getItem('muu-sinh-player-progress')!
    s.resetProgress(); localStorage.setItem('muu-sinh-player-progress',raw); await useProgressStore.persist.rehydrate()
    expect(migratePersistedProgress(useProgressStore.getState())).toEqual(before)
    const backup = migrateImportedSave(serializeSave(before)); expect(backup.ok).toBe(true)
    if (backup.ok) expect(backup.save.data).toEqual(before)
  })
  it('distinguishes smartphones from basic phones and counts paid collection items only once', () => {
    useProgressStore.setState({money:100000000,xp:900})
    const s = useProgressStore.getState()
    s.purchaseItem('life-phone-basic')
    expect(useProgressStore.getState().achievements.some(a => a.id === 'first-smartphone')).toBe(false)
    s.purchaseItem('life-phone-daily'); s.purchaseItem('life-vehicle-bike')
    expect(useProgressStore.getState().achievements.map(a => a.id)).toEqual(expect.arrayContaining(['first-smartphone','first-vehicle']))
    const paid = shopItems.filter(i => i.price > 0).slice(0,30)
    for (const item of paid) s.purchaseItem(item.id)
    expect(useProgressStore.getState().achievements.filter(a => a.id === 'collector-30')).toHaveLength(1)
    const balance = useProgressStore.getState().money
    for (const item of paid) s.purchaseItem(item.id)
    expect(useProgressStore.getState().money).toBe(balance)
    expect(useProgressStore.getState().achievements.filter(a => a.id === 'collector-30')).toHaveLength(1)
  })
  it('preserves lifestyle selections when onboarding/profile identity is updated', () => {
    useProgressStore.setState({money:1000000})
    const s = useProgressStore.getState()
    s.purchaseItem('life-phone-daily'); s.equipItem('life-phone-daily')
    const before = useProgressStore.getState().profile.lifestyle
    expect(s.createProfile('Người phố nhỏ',useProgressStore.getState().profile.appearance)).toBe(true)
    expect(useProgressStore.getState().profile.lifestyle).toEqual(before)
    s.updateAppearance({...useProgressStore.getState().profile.appearance,skinToneId:'deep'})
    expect(useProgressStore.getState().profile.lifestyle).toEqual(before)
    expect(useProgressStore.getState().money).toBe(400000)
  })
  it.each(jobs)('$id preserves work score, money and XP while wearing lifestyle equipment', job => {
    useProgressStore.setState({ money:100000, ownedItemIds:[...useProgressStore.getState().ownedItemIds,'life-shoes-sneakers'] })
    useProgressStore.getState().equipItem('life-shoes-sneakers')
    expect(getLifestyle(useProgressStore.getState().profile).equipment.shoes).toBe('life-shoes-sneakers')
    const result = createGameResult(job.id,100)
    useProgressStore.getState().completeGame(result,'2026-10-09','free-play')
    expect(useProgressStore.getState().money).toBe(237000)
    expect(useProgressStore.getState().xp).toBe(35)
    expect(useProgressStore.getState().jobStats[job.id].bestScore).toBe(100)
    expect(useProgressStore.getState().totalDaysWorked).toBe(0)
  })
})
