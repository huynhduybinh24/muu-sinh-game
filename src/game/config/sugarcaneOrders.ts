export type IceLevel = 'none' | 'little' | 'normal'

export interface DrinkState {
  iceLevel: IceLevel
  kumquat: boolean
  pressed: boolean
}

export interface SugarcaneOrder {
  id: 'classic' | 'kumquat' | 'less-ice'
  name: string
  shortDescription: string
  requiredDrink: Omit<DrinkState, 'pressed'>
}

export const SUGARCANE_GAME_DURATION = 45
export const CUSTOMER_PATIENCE_RANGE = { min: 10, max: 14 } as const
export const PRESS_DURATION_MS = 850

export const sugarcaneOrders: readonly SugarcaneOrder[] = [
  {
    id: 'classic',
    name: 'Nước mía',
    shortDescription: 'Mía + đá bình thường',
    requiredDrink: { iceLevel: 'normal', kumquat: false },
  },
  {
    id: 'kumquat',
    name: 'Nước mía tắc',
    shortDescription: 'Mía + đá + tắc',
    requiredDrink: { iceLevel: 'normal', kumquat: true },
  },
  {
    id: 'less-ice',
    name: 'Nước mía ít đá',
    shortDescription: 'Mía + một ít đá',
    requiredDrink: { iceLevel: 'little', kumquat: false },
  },
]

export function createEmptyDrink(): DrinkState {
  return { iceLevel: 'none', kumquat: false, pressed: false }
}

export function isCorrectDrink(drink: DrinkState, order: SugarcaneOrder): boolean {
  return (
    drink.pressed &&
    drink.iceLevel === order.requiredDrink.iceLevel &&
    drink.kumquat === order.requiredDrink.kumquat
  )
}

export function getIceLabel(iceLevel: IceLevel): string {
  if (iceLevel === 'little') return 'Ít'
  if (iceLevel === 'normal') return 'Bình thường'
  return 'Không'
}

export function getNextIceLevel(iceLevel: IceLevel): IceLevel {
  if (iceLevel === 'none') return 'little'
  if (iceLevel === 'little') return 'normal'
  return 'none'
}
