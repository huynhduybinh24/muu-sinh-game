import { describe, expect, it } from 'vitest'
import { migratePersistedProgress } from '../src/services/saveMigration'
import { equipItem, purchaseItem } from '../src/services/inventory'
import { compatibleVehicle, getLifestyle } from '../src/services/lifestyle'
import { navigateScreen, previousScreen, initialNavigation, backAction } from '../src/services/navigation'

describe('lifestyle phase C devices and compatible vehicles', () => {
  it('selects only owned phones/computers and switches without additional charges', () => {
    let p = { ...migratePersistedProgress(undefined), money: 10000000 }
    for (const id of ['life-phone-daily','life-phone-plus','life-electronics-laptop']) p = { ...p, ...purchaseItem(p,id).progress }
    const balance = p.money
    p = { ...p, ...equipItem(p,'life-phone-daily') }; p = { ...p, ...equipItem(p,'life-phone-plus') }; p = { ...p, ...equipItem(p,'life-electronics-laptop') }
    expect(getLifestyle(p.profile)).toMatchObject({ phone:'life-phone-plus', computer:'life-electronics-laptop' })
    expect(p.money).toBe(balance); expect(equipItem(p,'life-phone-pro')).toBe(p)
  })
  it.each(['life-vehicle-bike','life-vehicle-commuter','life-vehicle-scooter','life-vehicle-compact'])('%s uses compatible scene cosmetics or original fallback', id => {
    let p = { ...migratePersistedProgress(undefined), money: 100000000 }
    p = { ...p, ...equipItem(purchaseItem(p,id).progress,id) }
    expect(compatibleVehicle(p.profile,'shipper')?.id).toBe(id.includes('commuter') || id.includes('scooter') ? id : undefined)
    expect(compatibleVehicle(p.profile,'taxi')?.id).toBe(id.includes('compact') ? id : undefined)
    expect(p.xp).toBe(0)
  })
  it.each(['devices','garage','room'] as const)('%s participates in existing history/back navigation', screen => {
    const state = navigateScreen(navigateScreen(initialNavigation,'profile'),screen)
    expect(previousScreen(state).screen).toBe('profile'); expect(backAction(screen,false,false)).toBe('navigate')
  })
})
