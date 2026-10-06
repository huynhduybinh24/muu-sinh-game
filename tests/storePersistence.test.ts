import { beforeEach, describe, expect, it } from 'vitest'
import { useProgressStore } from '../src/store/progressStore'
import { dailyResult } from './fixtures'

const storageKey = 'muu-sinh-player-progress'
beforeEach(() => useProgressStore.getState().resetProgress())

describe('Zustand persistence', () => {
  it('rehydrates a legacy version through the real persist middleware', async () => {
    localStorage.setItem(storageKey, JSON.stringify({
      version: 0,
      state: {
        money: 150_000, reputation: 7, energy: 80,
        currentJobId: 'sugarcane', completedJobs: ['sugarcane'],
        soundEnabled: false, completedTutorials: ['shipper'],
      },
    }))
    await useProgressStore.persist.rehydrate()
    expect(useProgressStore.getState()).toMatchObject({
      money: 150_000, reputation: 7, energy: 80,
      currentJobId: 'sugarcane', completedJobs: ['sugarcane'],
      soundEnabled: false, completedTutorials: ['shipper'], totalGamesPlayed: 1,
    })
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as { version: number }
    expect(stored.version).toBe(2)
  })

  it('persists daily completion, career statistics, tutorials, and sound together', async () => {
    useProgressStore.getState().setSoundEnabled(false)
    useProgressStore.getState().completeTutorial('shipper')
    useProgressStore.getState().selectJob('shipper')
    useProgressStore.getState().completeGame(dailyResult('2026-10-06', 100), '2026-10-06')
    const saved = localStorage.getItem(storageKey)
    useProgressStore.getState().resetProgress()
    localStorage.setItem(storageKey, saved ?? '')
    await useProgressStore.persist.rehydrate()
    const state = useProgressStore.getState()
    expect(state).toMatchObject({
      currentStreak: 1, bestStreak: 1, totalDaysWorked: 1, totalGamesPlayed: 1,
      lastCompletedDate: '2026-10-06', soundEnabled: false, completedTutorials: ['shipper'],
    })
    expect(state.jobStats.shipper).toMatchObject({ timesPlayed: 1, bestScore: 100, totalScore: 100 })
    expect(state.achievements.map((achievement) => achievement.id)).toContain('first-day')
  })

  it('persists tutorial dismissal idempotently without changing progress', () => {
    useProgressStore.getState().completeTutorial('construction')
    useProgressStore.getState().completeTutorial('construction')
    expect(useProgressStore.getState().completedTutorials).toEqual(['construction'])
    expect(useProgressStore.getState().totalGamesPlayed).toBe(0)
    expect(useProgressStore.getState().money).toBe(0)
  })
})
