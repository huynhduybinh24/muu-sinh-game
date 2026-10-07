import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { jobsById } from './data/jobs'
import { AchievementToast } from './components/AchievementToast'
import { LevelUpToast } from './components/LevelUpToast'
import { ShopPage } from './pages/ShopPage'
import { getLevelProgress } from './services/level'
import { DailyRewardModal } from './components/DailyRewardModal'
import { DailyMissionsPage } from './pages/DailyMissionsPage'
import { getDailyRewardStatus } from './services/dailyRewards'
import { useLocalDate } from './hooks/useLocalDate'
import { PwaStatus } from './components/PwaStatus'
import { HomePage } from './pages/HomePage'
import { JobRevealPage } from './pages/JobRevealPage'
import { GamePage } from './pages/GamePage'
import { ResultPage } from './pages/ResultPage'
import { CareerPage } from './pages/CareerPage'
import { WelcomePage } from './pages/WelcomePage'
import { CharacterCreatorPage } from './pages/CharacterCreatorPage'
import { ProfilePage } from './pages/ProfilePage'
import { getDailyJobId, getLocalDateKey } from './services/dailyChallenge'
import { useProgressStore } from './store/progressStore'
import { usePwaInstall } from './hooks/usePwaInstall'
import type { AchievementId, AchievementUnlock, GameResult } from './types/game'
import './App.css'
import './profile.css'
import './shop.css'
import './daily.css'
import './polish.css'
import './save.css'

type AppScreen = 'home' | 'reveal' | 'game' | 'result' | 'career' | 'profile' | 'creator' | 'shop' | 'wardrobe' | 'missions'

function App() {
  const [screen, setScreen] = useState<AppScreen>('home')
  const [result, setResult] = useState<GameResult | null>(null)
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
    setResult(null)
    setScreen('reveal')
  }

  const handleGameComplete = (gameResult: GameResult) => {
    const previousLevel = getLevelProgress(useProgressStore.getState().xp).level
    const newAchievements = completeGame(gameResult, getLocalDateKey())
    const level = getLevelProgress(useProgressStore.getState().xp).level
    if (level > previousLevel) setLevelUp({ previousLevel, level })
    queueAchievements(newAchievements)
    setResult(gameResult)
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
  const reinitializeApp = () => {
    setScreen('home')
    setResult(null)
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
    page = <ProfilePage onHome={() => setScreen('home')} onCareer={() => setScreen('career')} onEdit={() => setScreen('creator')} onWardrobe={() => setScreen('wardrobe')} onReinitialize={reinitializeApp} />
  } else if (screen === 'shop' || screen === 'wardrobe') {
    page = <ShopPage key={screen} wardrobe={screen === 'wardrobe'} onHome={() => setScreen('home')}
      onCareer={() => setScreen('career')} onProfile={() => setScreen('profile')} onAchievements={queueAchievements} />
  } else if (screen === 'missions') {
    page = <DailyMissionsPage dateKey={localDateKey} onHome={() => setScreen('home')} onCareer={() => setScreen('career')}
      onProfile={() => setScreen('profile')} onClaim={(id) => handleRewardAction(() => useProgressStore.getState().claimMission(id))} />
  } else if (screen === 'reveal' && currentJob) {
    page = <JobRevealPage job={currentJob} onPlay={() => setScreen('game')} />
  } else if (screen === 'game' && currentJob) {
    page = <GamePage job={currentJob} onComplete={handleGameComplete} />
  } else if (screen === 'result' && result) {
    page = (
      <ResultPage
        result={result}
        job={jobsById[result.jobId]}
        onHome={() => setScreen('home')}
        onReplay={() => setScreen('game')}
      />
    )
  } else if (screen === 'career') {
    page = <CareerPage onBack={() => setScreen('home')} onProfile={() => setScreen('profile')} />
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
        onShop={() => setScreen('shop')}
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
      <PwaStatus />
    </>
  )
}

export default App
