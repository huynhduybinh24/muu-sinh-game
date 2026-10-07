import { getAvatarOption } from '../../data/avatar'
import { readPlayerProfile } from '../../services/playerProfile'
import type { PlayerAppearance } from '../../types/profile'

export type AvatarState = 'idle' | 'work' | 'success' | 'fail' | 'move'

export interface PhaserAvatarData {
  playerName: string
  appearance: PlayerAppearance
  colors: { skin: number; hair: number; shirt: number; pants: number }
}

/** Pure boundary adapter: fresh snapshot, shared validation/palette, no Phaser/store/storage. */
export function getPhaserAvatarData(profile?: unknown): PhaserAvatarData {
  const normalized = readPlayerProfile(profile)
  const appearance = normalized.appearance
  const color = (hex: string) => Number.parseInt(hex.slice(1), 16)
  return {
    playerName: normalized.playerName,
    appearance,
    colors: {
      skin: color(getAvatarOption('skinToneId', appearance.skinToneId).color),
      hair: color(getAvatarOption('hairId', appearance.hairId).color),
      shirt: color(getAvatarOption('shirtId', appearance.shirtId).color),
      pants: color(getAvatarOption('pantsId', appearance.pantsId).color),
    },
  }
}

export function getAvatarNameTag(name: string): string {
  const characters = Array.from(name)
  return characters.length > 12 ? `${characters.slice(0, 11).join('')}…` : name
}

// Offsets apply only to the visual child, never to a gameplay position or hitbox.
export const AVATAR_MOTION: Record<AvatarState, {
  x: number; y: number; angle: number; duration: number; repeat: number
}> = {
  idle: { x: 0, y: -1, angle: 0, duration: 1100, repeat: -1 },
  work: { x: 0, y: -2, angle: -4, duration: 180, repeat: -1 },
  success: { x: 0, y: -6, angle: 3, duration: 160, repeat: 0 },
  fail: { x: 3, y: 0, angle: -3, duration: 70, repeat: 2 },
  move: { x: 0, y: -1.5, angle: 4, duration: 190, repeat: -1 },
}
