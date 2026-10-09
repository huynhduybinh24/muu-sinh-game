export type AppScreen = 'home' | 'reveal' | 'game' | 'result' | 'career' | 'profile' | 'creator' | 'shop' | 'wardrobe' | 'missions' | 'town' | 'devices' | 'garage' | 'room'
export interface ScreenNavigation { screen: AppScreen; history: AppScreen[] }
export const initialNavigation: ScreenNavigation = { screen: 'home', history: [] }
export function navigateScreen(state: ScreenNavigation, screen: AppScreen): ScreenNavigation {
  if (screen === state.screen) return state
  if (screen === 'home') return initialNavigation
  const history = [...state.history, state.screen]
  if (state.screen === 'game' && screen !== 'result') {
    const safeHistory = state.history.filter((item) => item !== 'game' && item !== 'reveal' && item !== 'result')
    const target = safeHistory.findLastIndex((item) => item === screen)
    return { screen, history: target >= 0 ? safeHistory.slice(0, target) : safeHistory }
  }
  // A completed scene must never be revived by hardware Back.
  return { screen, history: screen === 'result' ? history.filter((item) => item !== 'game' && item !== 'reveal' && item !== 'result') : history }
}
export function previousScreen(state: ScreenNavigation): ScreenNavigation {
  const history = [...state.history]
  return { screen: history.pop() ?? 'home', history }
}
export function gameReturnScreen(state: ScreenNavigation): AppScreen {
  return [...state.history].reverse().find((screen) => screen === 'town' || screen === 'career' || screen === 'home') ?? 'home'
}
export function backAction(screen: AppScreen, dialog: boolean, editing: boolean): 'dialog' | 'keyboard' | 'pause' | 'minimize' | 'navigate' {
  if (editing) return 'keyboard'
  if (dialog) return 'dialog'
  return screen === 'game' ? 'pause' : screen === 'home' ? 'minimize' : 'navigate'
}
