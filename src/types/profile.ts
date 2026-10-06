export type Gender = 'male' | 'female'
export type SkinToneId = 'peach' | 'warm' | 'tan' | 'deep'
export type HairId = 'crop' | 'swoop' | 'bob' | 'bun' | 'curls' | 'long'
export type ShirtId = 'coral' | 'mint' | 'blue' | 'sunshine' | 'lavender' | 'cream'
export type PantsId = 'denim' | 'navy' | 'sand' | 'forest'

export interface PlayerAppearance {
  gender: Gender
  skinToneId: SkinToneId
  hairId: HairId
  shirtId: ShirtId
  pantsId: PantsId
}

export interface PlayerProfile {
  playerName: string
  createdAt: string
  appearance: PlayerAppearance
}
