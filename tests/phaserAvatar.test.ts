import { beforeEach, describe, expect, it } from 'vitest'
import { avatarOptions, defaultAppearance } from '../src/data/avatar'
import { AVATAR_MOTION, getAvatarNameTag, getPhaserAvatarData } from '../src/game/avatar/avatarData'
import { useProgressStore } from '../src/store/progressStore'

beforeEach(() => useProgressStore.getState().resetProgress())

describe('React → Phaser avatar data', () => {
  it.each([undefined, null, {}, [], 'invalid'])('safely defaults a missing/legacy profile: %s', (profile) => {
    const data = getPhaserAvatarData(profile)
    expect(data.appearance).toEqual(defaultAppearance)
    expect(data.playerName).toBe('')
    expect(data.colors).toEqual({ skin: 0xeebe93, hair: 0x49312c, shirt: 0xf47564, pants: 0x587baf })
  })
  it('keeps valid fields and rejects invalid/out-of-range IDs independently', () => {
    const data = getPhaserAvatarData({ playerName: '  Nguyễn Ánh  ', appearance: {
      gender: 'female', skinToneId: 999, hairId: 'missing', shirtId: 'mint', pantsId: -1,
    } })
    expect(data.playerName).toBe('Nguyễn Ánh')
    expect(data.appearance).toEqual({ ...defaultAppearance, gender: 'female', shirtId: 'mint' })
    expect(data.colors.shirt).toBe(0x62bb9c)
  })
  it('maps every color from the existing shared palette, without a second style table', () => {
    const keys = ['skinToneId', 'hairId', 'shirtId', 'pantsId'] as const
    const colors = ['skin', 'hair', 'shirt', 'pants'] as const
    keys.forEach((key, index) => {
      for (const option of avatarOptions[key]) {
        const data = getPhaserAvatarData({ appearance: { ...defaultAppearance, [key]: option.id } })
        expect(data.appearance[key]).toBe(option.id)
        expect(data.colors[colors[index]]).toBe(Number.parseInt(option.color.slice(1), 16))
      }
    })
  })
  it('takes a fresh snapshot so profile edits appear in the next game, not in an active game', () => {
    useProgressStore.getState().createProfile('Minh', defaultAppearance)
    const activeGameData = getPhaserAvatarData(useProgressStore.getState().profile)
    useProgressStore.setState({ money: 100_000 })
    expect(useProgressStore.getState().purchaseItem('hair-bun').status).toBe('purchased')
    expect(useProgressStore.getState().purchaseItem('shirt-blue').status).toBe('purchased')
    useProgressStore.getState().updateAppearance({ ...defaultAppearance, hairId: 'bun', shirtId: 'blue' })
    const nextGameData = getPhaserAvatarData(useProgressStore.getState().profile)
    expect(activeGameData.appearance).toEqual(defaultAppearance)
    expect(nextGameData.appearance.hairId).toBe('bun')
    expect(nextGameData.colors.shirt).toBe(0x69a5e4)
    expect(nextGameData.playerName).toBe('Minh')
  })
  it('rejects an invalid stored name and truncates a validated long name without splitting Unicode', () => {
    expect(getPhaserAvatarData({ playerName: 'A' }).playerName).toBe('')
    expect(getAvatarNameTag('Nguyễn Ánh')).toBe('Nguyễn Ánh')
    expect(Array.from(getAvatarNameTag('😀'.repeat(20))).length).toBe(12)
    expect(getAvatarNameTag('😀'.repeat(20)).endsWith('…')).toBe(true)
  })
  it('defines five bounded visual-only states and short non-looping reactions', () => {
    expect(Object.keys(AVATAR_MOTION)).toEqual(['idle', 'work', 'success', 'fail', 'move'])
    for (const config of Object.values(AVATAR_MOTION)) {
      expect(Math.abs(config.x)).toBeLessThanOrEqual(3)
      expect(Math.abs(config.y)).toBeLessThanOrEqual(6)
      expect(Math.abs(config.angle)).toBeLessThanOrEqual(4)
    }
    for (const state of ['success', 'fail'] as const) {
      const config = AVATAR_MOTION[state]
      expect(config.repeat).toBeGreaterThanOrEqual(0)
      expect(config.duration * 2 * (config.repeat + 1)).toBeLessThanOrEqual(500)
    }
  })
})
