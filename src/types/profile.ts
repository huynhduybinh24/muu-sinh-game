export type Gender = 'male' | 'female'
export type SkinToneId = 'peach' | 'warm' | 'tan' | 'deep'
export type HairId = 'crop' | 'swoop' | 'bob' | 'bun' | 'curls' | 'long' | 'wave' | 'braid'
export type ShirtId = 'coral' | 'mint' | 'blue' | 'sunshine' | 'lavender' | 'cream' | 'cherry' | 'charcoal' | 'ocean' | 'rose' | 'polo' | 'linen' | 'hoodie' | 'denim-jacket' | 'raincoat' | 'blazer'
export type PantsId = 'denim' | 'navy' | 'sand' | 'forest' | 'charcoal' | 'plum' | 'shorts' | 'chinos' | 'jogger' | 'formal'

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
  lifestyle?: import('./shop').LifestyleState
}
