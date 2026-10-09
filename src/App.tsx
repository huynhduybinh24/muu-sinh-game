import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { jobsById } from './data/jobs'
import { AchievementToast } from './components/AchievementToast'
import { LevelUpToast } from './components/LevelUpToast'
import { ShopPage } from './pages/ShopPage'
import { LifestylePage } from './pages/LifestylePage'
import type { ItemCategory } from './types/shop'
import { getLevelProgress } from './services/level'
import { DailyRewardModal } from './components/DailyRewardModal'
import { DailyMissionsPage } from './pages/DailyMissionsPage'
import { getDailyRewardStatus } from './services/dailyRewards'
import { useLocalDate } from './hooks/useLocalDate'
import { PwaStatus } from './components/PwaStatus'
import { NativeGamePause } from './components/NativeGamePause'
import { useNativeApp } from './hooks/useNativeApp'
import { isNativePlatform } from './services/platform'
import { initialNavigation, navigateScreen, previousScreen, backAction, gameReturnScreen, type AppScreen } from './services/navigation'
import { HomePage } from './pages/HomePage'
import { JobRevealPage } from './pages/JobRevealPage'
import { TownPage } from './pages/TownPage'
import { ResultPage } from './pages/ResultPage'
import { CareerPage } from './pages/CareerPage'
import { WelcomePage } from './pages/WelcomePage'
import { CharacterCreatorPage } from './pages/CharacterCreatorPage'
import { ProfilePage } from './pages/ProfilePage'
import { getDailyJobId, getLocalDateKey } from './services/dailyChallenge'
import { useProgressStore } from './store/progressStore'
import { usePwaInstall } from './hooks/usePwaInstall'
import type { AchievementId, AchievementUnlock, GameResult, GameRunMode } from './types/game'
import type { JobId } from './types/job'
import './App.css'
import './profile.css'
import './shop.css'
import './daily.css'
import './polish.css'
import './save.css'
import './town.css'
import './lifestyle.css'
import './branding.css'
import { BrandLogo } from './components/BrandLogo'

const GamePage = lazy(() => import('./pages/GamePage').then((module) => ({ default: module.GamePage })))

function App() {
  const [navigation, setNavigation] = useState(initialNavigation)
  const [shopCategory, setShopCategory] = useState<ItemCategory>('hair')
  const screen = navigation.screen
  const setScreen = (next: AppScreen) => setNavigation((current) => navigateScreen(current, next))
  const [gamePaused, setGamePaused] = useState(false)
  const [result, setResult] = useState<GameResult | null>(null)
  const [runMode, setRunMode] = useState<GameRunMode>('free-play')
  const [achievementQueue, setAchievementQueue] = useState<AchievementId[]>([])
  const [pendingName, setPendingName] = useState('')
  const [levelUp, setLevelUp] = useState<{ previousLevel: number; level: number } | null>(null)
  const pwaInstall = usePwaInstall()
  const localDateKey = useLocalDate()
  const [dismissedRewardDate, setDismissedRewardDate] = useState('')

  const currentJobId = useProgressStore((state) => state.currentJobId)
  const selectJob = useProgressStore((state) => state.selectJob)
  const completeGame = useProgressStore((state) => state.completeGame)
  const profile = useProgressStore((state) => state.profile)
  useNativeApp(() => {
    const element = document.activeElement
    const editing = element instanceof HTMLElement && (element.matches('input:not([type=radio]):not([type=checkbox]):not([type=file]), textarea') || element.isContentEditable)
    const dialog = document.querySelector<HTMLDialogElement>('dialog[open]')
    const action = backAction(screen, Boolean(dialog), editing)
    if (action === 'keyboard') { (element as HTMLElement).blur(); return }
    if (action === 'dialog') { dialog?.dispatchEvent(new Event('cancel', { cancelable: true })); return }
    if (action === 'pause') { setGamePaused(true); return }
    if (action === 'minimize') {
      if (pendingName) { setPendingName(''); return }
      void import('@capacitor/app').then(({ App: NativeApp }) => NativeApp.minimizeApp()).catch(() => undefined)
      return
    }
    setNavigation((current) => previousScreen(current))
  }, () => { if (screen === 'game') setGamePaused(true) })
  const createProfile = useProgressStore((state) => state.createProfile)
  const updateAppearance = useProgressStore((state) => state.updateAppearance)
  const ownedItemIds = useProgressStore((state) => state.ownedItemIds)
  const ensureDailyMissions = useProgressStore((state) => state.ensureDailyMissions)
  const lastDailyRewardDate = useProgressStore((state) => state.lastDailyRewardDate)
  const dailyRewardCycleDay = useProgressStore((state) => state.dailyRewardCycleDay)
  const dailyRewardStreak = useProgressStore((state) => state.dailyRewardStreak)
  const dailyReward = getDailyRewardStatus({ lastDailyRewardDate, dailyRewardCycleDay, dailyRewardStreak }, localDateKey)
  useEffect(() => {
    if (profile.playerName) ensureDailyMissions(localDateKey)
  }, [profile.playerName, localDateKey, ensureDailyMissions])
  const queueAchievements = (unlocks: AchievementUnlock[]) => setAchievementQueue((queue) => [
    ...queue, ...unlocks.map((unlock) => unlock.id),
  ])

  const currentJob = useMemo(
    () => (currentJobId ? jobsById[currentJobId] : null),
    [currentJobId],
  )

  const handleStartDaily = () => {
    const dailyJobId = getDailyJobId(getLocalDateKey())
    selectJob(dailyJobId)
    setRunMode(useProgressStore.getState().lastCompletedDate === getLocalDateKey() ? 'replay' : 'daily')
    setResult(null)
    setScreen('reveal')
  }

  const handleGameComplete = (gameResult: GameResult) => {
    const previousLevel = getLevelProgress(useProgressStore.getState().xp).level
    const newAchievements = completeGame(gameResult, getLocalDateKey(), runMode)
    const level = getLevelProgress(useProgressStore.getState().xp).level
    if (level > previousLevel) setLevelUp({ previousLevel, level })
    queueAchievements(newAchievements)
    setResult(gameResult)
    setGamePaused(false)
    setScreen('result')
  }
  const handleRewardAction = (action: () => { claimed: boolean; newAchievements: AchievementUnlock[] }) => {
    const previousLevel = getLevelProgress(useProgressStore.getState().xp).level
    const outcome = action()
    const level = getLevelProgress(useProgressStore.getState().xp).level
    if (level > previousLevel) setLevelUp({ previousLevel, level })
    queueAchievements(outcome.newAchievements)
    return outcome.claimed
  }

  const dismissAchievement = useCallback(() => {
    setAchievementQueue((queue) => queue.slice(1))
  }, [])
  const dismissLevelUp = useCallback(() => setLevelUp(null), [])
  const startJob = (jobId: JobId, mode: GameRunMode) => {
    selectJob(jobId); setRunMode(mode); setResult(null); setScreen('reveal')
  }
  const reinitializeApp = () => {
    setGamePaused(false)
    setScreen('home')
    setResult(null)
    setRunMode('free-play')
    setPendingName('')
    setAchievementQueue([])
    setLevelUp(null)
    setDismissedRewardDate('')
  }

  const achievementToast = !levelUp && achievementQueue[0] ? (
    <AchievementToast
      achievementId={achievementQueue[0]}
      onDismiss={dismissAchievement}
    />
  ) : null

  let page: ReactNode
  if (!profile.playerName && !pendingName) {
    page = <WelcomePage onContinue={setPendingName} />
  } else if (!profile.playerName || screen === 'creator') {
    page = <CharacterCreatorPage
      playerName={profile.playerName || pendingName}
      initialAppearance={profile.appearance}
      ownedItemIds={ownedItemIds}
      lifestyle={profile.lifestyle}
      editing={Boolean(profile.playerName)}
      onBack={() => profile.playerName ? setScreen('profile') : setPendingName('')}
      onSave={(appearance) => {
        if (profile.playerName) {
          updateAppearance(appearance)
          setScreen('profile')
        } else if (createProfile(pendingName, appearance)) {
          setPendingName('')
          setScreen('home')
        }
      }} />
  } else if (screen === 'profile') {
    page = <ProfilePage onHome={() => setScreen('home')} onCareer={() => setScreen('career')} onEdit={() => setScreen('creator')} onWardrobe={() => setScreen('wardrobe')} onReinitialize={reinitializeApp} onLifestyle={setScreen} />
  } else if (screen === 'devices' || screen === 'garage' || screen === 'room') {
    page = <LifestylePage view={screen} onHome={() => setScreen('home')} onCareer={() => setScreen('career')} onProfile={() => setScreen('profile')} onView={setScreen} onAchievements={queueAchievements}
      onShop={(category) => { setShopCategory(category); setScreen('shop') }} />
  } else if (screen === 'shop' || screen === 'wardrobe') {
    page = <ShopPage key={screen} wardrobe={screen === 'wardrobe'} initialCategory={screen === 'wardrobe' ? 'hair' : shopCategory} onHome={() => setScreen('home')}
      onCareer={() => setScreen('career')} onProfile={() => setScreen('profile')} onAchievements={queueAchievements} onLifestyle={setScreen} />
  } else if (screen === 'missions') {
    page = <DailyMissionsPage dateKey={localDateKey} onHome={() => setScreen('home')} onCareer={() => setScreen('career')}
      onProfile={() => setScreen('profile')} onClaim={(id) => handleRewardAction(() => useProgressStore.getState().claimMission(id))} />
  } else if (screen === 'reveal' && currentJob) {
    page = <JobRevealPage job={currentJob} onPlay={() => setScreen('game')} />
  } else if (screen === 'town') {
    page = <TownPage dateKey={localDateKey} onHome={() => setScreen('home')} onCareer={() => setScreen('career')} onProfile={() => setScreen('profile')}
      onPlay={({ jobId, mode }) => startJob(jobId, mode)} />
  } else if (screen === 'game' && currentJob) {
    page = <Suspense fallback={<main className="app-shell brand-loading"><BrandLogo variant="compact" /><p role="status">Đang mở ca làm…</p></main>}><GamePage job={currentJob} paused={gamePaused} onComplete={handleGameComplete} /></Suspense>
  } else if (screen === 'result' && result) {
    page = (
      <ResultPage
        result={result}
        job={jobsById[result.jobId]}
        onHome={() => setScreen('home')}
        onReplay={() => { setRunMode('replay'); setScreen('game') }}
      />
    )
  } else if (screen === 'career') {
    page = <CareerPage onBack={() => setScreen('home')} onProfile={() => setScreen('profile')} onPlayJob={(jobId) => {
      startJob(jobId, 'free-play')
    }} />
  } else {
    page = (
      <HomePage
        dailyJob={jobsById[getDailyJobId(localDateKey)]}
        localDateKey={localDateKey}
        canInstall={pwaInstall.canInstall}
        showIosInstallHint={pwaInstall.showIosHint}
        onStart={handleStartDaily}
        onCareer={() => setScreen('career')}
        onProfile={() => setScreen('profile')}
        onShop={() => { setShopCategory('hair'); setScreen('shop') }}
        onTown={() => setScreen('town')}
        onLifestyle={setScreen}
        onMissions={() => setScreen('missions')}
        onReward={() => setDismissedRewardDate('')}
        onInstall={pwaInstall.install}
      />
    )
  }

  return (
    <>
      {page}
      {profile.playerName && screen === 'home' && dailyReward.eligible && dismissedRewardDate !== localDateKey ? <DailyRewardModal
        cycleDay={dailyReward.cycleDay} reward={dailyReward.reward} onClose={() => setDismissedRewardDate(localDateKey)}
        onClaim={() => {
          handleRewardAction(() => useProgressStore.getState().claimDailyReward())
          setDismissedRewardDate(localDateKey)
        }} /> : null}
      {levelUp ? <LevelUpToast {...levelUp} onDismiss={dismissLevelUp} /> : null}
      {achievementToast}
      {screen === 'game' && gamePaused ? <NativeGamePause onResume={() => setGamePaused(false)} onLeave={() => {
        setGamePaused(false); setScreen(gameReturnScreen(navigation))
      }} /> : null}
      {!isNativePlatform() ? <PwaStatus /> : null}
    </>
  )
}

export default App
