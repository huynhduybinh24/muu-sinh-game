import { beforeEach, describe, expect, it } from 'vitest'
import { dailyMissionEpochs, missionTemplates, type MissionEpoch } from '../src/data/dailyMissions'
import { dailyJobEpochs } from '../src/data/dailySchedule'
import { jobs } from '../src/data/jobs'
import { getNewAchievementUnlocks } from '../src/data/achievements'
import { claimMission, getDailyMissionDefinitions, getMissionViews, readDailyMissions, syncDailyMissions, updateDailyMissionProgress } from '../src/services/dailyMissions'
import { getDailyJobId } from '../src/services/dailyChallenge'
import { getLevelProgress } from '../src/services/level'
import { applyGameCompletion } from '../src/services/progression'
import { migratePersistedProgress, useProgressStore } from '../src/store/progressStore'
import type { GameResult, PlayerProgress } from '../src/types/game'

const date = '2026-10-07'
const fresh = () => migratePersistedProgress(undefined)
const result = (overrides: Partial<GameResult> = {}): GameResult => ({ jobId: getDailyJobId(date), score: 1500, earnedMoney: 50_000, reputationChange: 1, completedAt: `${date}T05:00:00Z`, ...overrides })
const completed = (progress: PlayerProgress = fresh(), day = date): PlayerProgress => ({ ...progress,
  dailyMissions: { dateKey: day, missions: getDailyMissionDefinitions(day).map(({ id, target }) => ({ id, progress: target, claimed: false })) } })
beforeEach(() => useProgressStore.getState().resetProgress())

describe('versioned daily missions', () => {
  it('generates exactly three unique valid, deterministic missions for local dates with variety', () => {
    const seen = new Set<string>()
    for (let day = 1; day <= 31; day++) {
      const key = `2026-10-${String(day).padStart(2, '0')}`
      const definitions = getDailyMissionDefinitions(key)
      expect(definitions).toHaveLength(3)
      expect(new Set(definitions.map(({ id }) => id)).size).toBe(3)
      expect(getDailyMissionDefinitions(key)).toEqual(definitions)
      for (const mission of definitions) {
        seen.add(mission.id)
        expect(mission.target).toBeGreaterThan(0)
        expect(mission.rewardMoney).toBeGreaterThanOrEqual(5_000)
        expect(mission.rewardMoney).toBeLessThanOrEqual(30_000)
        expect(mission.rewardXp).toBeLessThanOrEqual(70)
        if (mission.jobId) {
          expect(jobs.map((job) => job.id)).toContain(mission.jobId)
          expect(mission.jobId).toBe(getDailyJobId(key))
        }
      }
    }
    expect(seen.size).toBe(7)
  })
  it('keeps established dates when templates expand and activates future epochs only at their boundary', () => {
    const before = getDailyMissionDefinitions(date)
    const expanded = { ...missionTemplates, unused: { ...missionTemplates['play-3'], title: 'Future template' } }
    expect(getDailyMissionDefinitions(date, dailyMissionEpochs, expanded)).toEqual(before)
    const future: MissionEpoch = { version: 'missions-v2', activeFrom: '2027-01-01', pools: [['play-8'], ['daily-work'], ['score-6000']] }
    const epochs = [...dailyMissionEpochs, future]
    expect(getDailyMissionDefinitions(date, epochs)).toEqual(before)
    expect(getDailyMissionDefinitions('2026-12-31', epochs)).toEqual(getDailyMissionDefinitions('2026-12-31'))
    expect(getDailyMissionDefinitions('2027-01-01', epochs).map(({ id }) => id)).toEqual(['play-8', 'daily-work', 'score-6000'])
    const jobEpochs = [...dailyJobEpochs, { version: 'future-jobs', activeFrom: '2027-01-01', jobIds: ['barber'] as const }]
    expect(getDailyMissionDefinitions(date, epochs, expanded, jobEpochs)).toEqual(before)
    expect(getDailyMissionDefinitions('2027-01-01', epochs, expanded, jobEpochs)[1].jobId).toBe('barber')
  })
  it('rejects invalid schedules instead of silently creating fewer or duplicate missions', () => {
    expect(() => getDailyMissionDefinitions(date, [])).toThrow('daily-mission-schedule-invalid')
    expect(() => getDailyMissionDefinitions(date, [{ version: 'bad', activeFrom: date, pools: [['play-3'], ['play-3'], ['play-8']] }])).toThrow('daily-mission-pool-empty')
  })
})

describe('centralized progress and claims', () => {
  it('counts replays and normal progression before achievements, capping progress without changing career/rewards', () => {
    let progress: PlayerProgress = fresh()
    const game = result({ score: 10_000, earnedMoney: 1_000_000, metadata: { customersServed: 100 } })
    for (let i = 0; i < 10; i++) progress = applyGameCompletion(progress, game, date).progress
    for (const view of getMissionViews(progress.dailyMissions, date)) {
      expect(view.progress).toBe(view.target)
      expect(view.completed).toBe(true)
      expect(view.claimed).toBe(false)
    }
    expect(progress.totalDaysWorked).toBe(1)
    expect(progress.currentStreak).toBe(1)
    expect(progress.totalGamesPlayed).toBe(10)
    expect(progress.money).toBe(10_000_000)
    expect(progress.totalMoneyEarned).toBe(progress.money)
    expect(progress.jobStats[game.jobId].totalMoneyEarned).toBe(progress.money)
  })
  it('uses single-game maximum, not a sum; resets unclaimed/claimed progress at midnight', () => {
    const key = Array.from({ length: 31 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`).find((day) => getDailyMissionDefinitions(day).some(({ type }) => type === 'SCORE_SINGLE'))!
    let progress = updateDailyMissionProgress(fresh(), result({ score: 700 }), key)
    progress = updateDailyMissionProgress(progress, result({ score: 500 }), key)
    expect(getMissionViews(progress.dailyMissions, key).find(({ type }) => type === 'SCORE_SINGLE')!.progress).toBe(700)
    const nextDay = syncDailyMissions(completed(progress), '2026-10-08')
    expect(nextDay.dailyMissions!.missions.every(({ progress, claimed }) => progress === 0 && !claimed)).toBe(true)
    expect(nextDay.money).toBe(progress.money)
    expect(claimMission(completed(), 'play-3', '2026-10-08').totalDailyMissionsClaimed).toBe(0)
  })
  it.each(jobs.map((job) => [job.id] as const))('measures %s metadata only for the scheduled job and reliable field', (jobId) => {
    const key = Array.from({ length: 90 }, (_, i) => {
      const day = new Date(2026, 9, 1 + i)
      return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
    }).find((day) => getDailyJobId(day) === jobId && getDailyMissionDefinitions(day).some(({ id }) => id === 'daily-work'))!
    expect(key).toBeDefined()
    const mission = getDailyMissionDefinitions(key).find(({ id }) => id === 'daily-work')!
    const metadata = { customersServed: 2, successfulBricks: 2, deliveries: 2, vehiclesWashed: 2, treesTapped: 2, vehiclesRepaired: 2, fishCaught: 2 }
    const view = (p: PlayerProgress) => getMissionViews(p.dailyMissions, key).find(({ id }) => id === mission.id)!
    const wrong = jobs.find((job) => job.id !== jobId)!.id
    expect(view(updateDailyMissionProgress(fresh(), result({ jobId: wrong, metadata }), key)).progress).toBe(0)
    expect(view(updateDailyMissionProgress(fresh(), result({ jobId }), key)).progress).toBe(0)
    expect(view(updateDailyMissionProgress(fresh(), result({ jobId, metadata }), key)).progress).toBe(2)
    expect(view(updateDailyMissionProgress(fresh(), result({ jobId, metadata: { customersServed: NaN, successfulBricks: -1, deliveries: Infinity, vehiclesWashed: -10, treesTapped: NaN, vehiclesRepaired: -1, fishCaught: Infinity } }), key)).progress).toBe(0)
  })
  it('rejects incomplete/unknown claims and awards money/XP once without job-income inflation', () => {
    const before = syncDailyMissions(fresh(), date)
    expect(claimMission(before, 'unknown', date)).toBe(before)
    expect(claimMission(before, before.dailyMissions!.missions[0].id, date)).toBe(before)
    const ready = completed({ ...before, xp: 149 })
    const mission = getDailyMissionDefinitions(date)[0]
    const after = claimMission(ready, mission.id, date)
    expect(after.money).toBe(ready.money + mission.rewardMoney)
    expect(after.xp).toBe(ready.xp + mission.rewardXp)
    expect(getLevelProgress(after.xp).level).toBe(2)
    expect(after.totalDailyMissionsClaimed).toBe(1)
    expect(after.totalMoneyEarned).toBe(ready.totalMoneyEarned)
    expect(after.jobStats).toBe(ready.jobStats)
    expect(after.totalMoneySpent).toBe(0)
    expect(claimMission(after, mission.id, date)).toBe(after)
  })
  it('accumulates total score and job earnings across ca/replays, but never counts bonus rewards', () => {
    const key = Array.from({ length: 31 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`).find((day) => {
      const ids = getDailyMissionDefinitions(day).map(({ id }) => id)
      return ids.includes('earn-75k') && ids.includes('score-6000')
    })!
    expect(key).toBeDefined()
    let progress = updateDailyMissionProgress(fresh(), result({ score: 1200, earnedMoney: 25_000 }), key)
    progress = updateDailyMissionProgress(progress, result({ score: 900, earnedMoney: 20_000 }), key)
    const view = (id: string) => getMissionViews(progress.dailyMissions, key).find((mission) => mission.id === id)!
    expect(view('score-6000').progress).toBe(2100)
    expect(view('earn-75k').progress).toBe(45_000)
    const claimed = claimMission(completed(progress, key), 'earn-75k', key)
    expect(claimed.dailyMissions!.missions.find((mission) => mission.id === 'earn-75k')!.progress).toBe(75_000)
    expect(claimed.totalMoneyEarned).toBe(progress.totalMoneyEarned)
  })
  it('requires exact achievement thresholds and retains unlocks when the day resets', () => {
    const before = { ...completed(), totalDailyMissionsClaimed: 29, dailyRewardStreak: 6 }
    before.dailyMissions!.missions[0].claimed = true
    before.dailyMissions!.missions[1].claimed = true
    const ids = getNewAchievementUnlocks(before, date).map(({ id }) => id)
    expect(ids).not.toContain('missions-day')
    expect(ids).not.toContain('missions-30')
    expect(ids).not.toContain('reward-7')
    useProgressStore.setState(before)
    const outcome = useProgressStore.getState().claimMission(before.dailyMissions!.missions[2].id, date)
    expect(outcome.newAchievements.map(({ id }) => id)).toEqual(expect.arrayContaining(['missions-day', 'missions-30']))
    useProgressStore.getState().ensureDailyMissions('2026-10-08')
    expect(useProgressStore.getState().achievements.map(({ id }) => id)).toEqual(expect.arrayContaining(['missions-day', 'missions-30']))
  })
  it('uses atomic Zustand actions across rapid taps and refresh with centralized achievements', async () => {
    useProgressStore.setState(completed({ ...fresh(), totalDailyMissionsClaimed: 27 }))
    const store = useProgressStore.getState()
    const definitions = getDailyMissionDefinitions(date)
    const first = store.claimMission(definitions[0].id, date)
    expect(first.claimed).toBe(true)
    expect(store.claimMission(definitions[0].id, date)).toEqual({ claimed: false, newAchievements: [] })
    store.claimMission(definitions[1].id, date)
    const third = store.claimMission(definitions[2].id, date)
    expect(third.newAchievements.map(({ id }) => id)).toEqual(expect.arrayContaining(['missions-day', 'missions-30']))
    expect(useProgressStore.getState().totalDailyMissionsClaimed).toBe(30)
    const snapshot = localStorage.getItem('muu-sinh-player-progress')!
    store.resetProgress()
    localStorage.setItem('muu-sinh-player-progress', snapshot)
    await useProgressStore.persist.rehydrate()
    expect(useProgressStore.getState().claimMission(definitions[2].id, date).claimed).toBe(false)
    expect(useProgressStore.getState().totalDailyMissionsClaimed).toBe(30)
    expect(getNewAchievementUnlocks(useProgressStore.getState(), date)).toEqual([])
  })
  it('sanitizes malformed persisted mission state and deduplicates generated statuses', () => {
    expect(readDailyMissions({ dateKey: '2026-02-30', missions: [] })).toBeNull()
    expect(readDailyMissions({ dateKey: date, missions: [{ id: 'unknown', progress: 1e9, claimed: true }] })!.missions.every((m) => m.progress === 0 && !m.claimed)).toBe(true)
    const definitions = getDailyMissionDefinitions(date)
    const save = readDailyMissions({ dateKey: date, missions: definitions.flatMap(({ id, target }) => [{ id, progress: target + 999, claimed: true }, { id, progress: NaN }]) })!
    expect(save.missions).toHaveLength(3)
    expect(getMissionViews(save, date).every((m) => m.progress === m.target && m.claimed)).toBe(true)
  })
})
