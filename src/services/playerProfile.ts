import { avatarOptions, defaultAppearance } from '../data/avatar'
import type { PlayerAppearance, PlayerProfile } from '../types/profile'
import { readLifestyle } from './lifestyle'

export const PLAYER_NAME_LIMITS = { min: 2, max: 20 } as const

export function normalizePlayerName(name: string): string {
  return name.trim().normalize('NFC')
}

export function getPlayerNameError(name: string): string | null {
  const length = Array.from(normalizePlayerName(name)).length
  if (length === 0) return 'Bạn chưa nhập tên nhé!'
  if (length < PLAYER_NAME_LIMITS.min || length > PLAYER_NAME_LIMITS.max) {
    return 'Tên cần từ 2 đến 20 ký tự.'
  }
  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readOption<Key extends keyof PlayerAppearance>(key: Key, value: unknown): PlayerAppearance[Key] {
  return avatarOptions[key].find((option) => option.id === value)?.id ?? defaultAppearance[key]
}

export function readAppearance(value: unknown): PlayerAppearance {
  const source = isRecord(value) ? value : {}
  return {
    gender: readOption('gender', source.gender),
    skinToneId: readOption('skinToneId', source.skinToneId),
    hairId: readOption('hairId', source.hairId),
    shirtId: readOption('shirtId', source.shirtId),
    pantsId: readOption('pantsId', source.pantsId),
  }
}

export function readPlayerProfile(value: unknown): PlayerProfile {
  const source = isRecord(value) ? value : {}
  const name = typeof source.playerName === 'string' ? normalizePlayerName(source.playerName) : ''
  const playerName = getPlayerNameError(name) ? '' : name
  return {
    playerName,
    // Empty means onboarding has not finished. Recover malformed timestamps deterministically.
    createdAt: playerName
      ? typeof source.createdAt === 'string' && Number.isFinite(Date.parse(source.createdAt))
        ? source.createdAt : '1970-01-01T00:00:00.000Z'
      : '',
    appearance: readAppearance(source.appearance),
    ...(source.lifestyle === undefined ? {} : { lifestyle: readLifestyle(source.lifestyle) }),
  }
}

// Legacy level retained for save migration. Live UI/shop levels now derive from XP.
export function getPlayerLevel(totalGamesPlayed: number): number {
  return 1 + Math.floor(Math.max(0, totalGamesPlayed) / 10)
}
