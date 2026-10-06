import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { jobsById } from './data/jobs'
import { AchievementToast } from './components/AchievementToast'
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
import type { AchievementId, GameResult } from './types/game'
import './App.css'
import './profile.css'

type AppScreen = 'home' | 'reveal' | 'game' | 'result' | 'career' | 'profile' | 'creator'

function App() {
  const [screen, setScreen] = useState<AppScreen>('home')
  const [result, setResult] = useState<GameResult | null>(null)
  const [achievementQueue, setAchievementQueue] = useState<AchievementId[]>([])
  const [pendingName, setPendingName] = useState('')
  const pwaInstall = usePwaInstall()

  const currentJobId = useProgressStore((state) => state.currentJobId)
  const selectJob = useProgressStore((state) => state.selectJob)
  const completeGame = useProgressStore((state) => state.completeGame)
  const profile = useProgressStore((state) => state.profile)
  const createProfile = useProgressStore((state) => state.createProfile)
  const updateAppearance = useProgressStore((state) => state.updateAppearance)

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
    const newAchievements = completeGame(gameResult, getLocalDateKey())
    setAchievementQueue((queue) => [
      ...queue,
      ...newAchievements.map((achievement) => achievement.id),
    ])
    setResult(gameResult)
    setScreen('result')
  }

  const dismissAchievement = useCallback(() => {
    setAchievementQueue((queue) => queue.slice(1))
  }, [])

  const achievementToast = achievementQueue[0] ? (
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
    page = <ProfilePage onHome={() => setScreen('home')} onCareer={() => setScreen('career')} onEdit={() => setScreen('creator')} />
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
    const localDateKey = getLocalDateKey()
    page = (
      <HomePage
        dailyJob={jobsById[getDailyJobId(localDateKey)]}
        localDateKey={localDateKey}
        canInstall={pwaInstall.canInstall}
        showIosInstallHint={pwaInstall.showIosHint}
        onStart={handleStartDaily}
        onCareer={() => setScreen('career')}
        onProfile={() => setScreen('profile')}
        onInstall={pwaInstall.install}
      />
    )
  }

  return (
    <>
      {page}
      {achievementToast}
      <PwaStatus />
    </>
  )
}

export default App
