import { beforeEach, describe, expect, it } from 'vitest'
import { TOWN_SIZE, townDistricts, townLocations } from '../src/data/town'
import { jobs } from '../src/data/jobs'
import { getTownAppearance, getTownDailyLocation, getTownLaunch, getTownLocation, getTownPlayerTarget } from '../src/services/town'
import { defaultAppearance } from '../src/data/avatar'
import { getDailyJobId } from '../src/services/dailyChallenge'
import { applyGameCompletion } from '../src/services/progression'
import { createGameResult } from '../src/services/resultCalculator'
import { migrateImportedSave, serializeSave } from '../src/services/saveService'
import { useProgressStore, migratePersistedProgress } from '../src/store/progressStore'

beforeEach(() => useProgressStore.getState().resetProgress())
describe('typed town map', () => {
  it('maps exactly ten unique locations, every supported job and the five neighborhoods', () => {
    expect(townLocations).toHaveLength(10)
    expect(new Set(townLocations.map(({ id }) => id)).size).toBe(10)
    expect(new Set(townLocations.map(({ jobId }) => jobId))).toEqual(new Set(jobs.map(({ id }) => id)))
    expect(townDistricts.map(({ id }) => id)).toEqual(['market', 'downtown', 'work', 'countryside', 'riverside'])
    expect(townDistricts.map((district) => townLocations.filter(({ districtId }) => districtId === district.id).length)).toEqual([3, 2, 3, 1, 1])
    for (const location of townLocations) {
      expect(townDistricts.some(({ id }) => id === location.districtId)).toBe(true)
      expect(location.description.length).toBeGreaterThan(10)
      expect(location.position.x).toBeGreaterThan(80)
      expect(location.position.x).toBeLessThan(TOWN_SIZE.width - 80)
      expect(location.position.y).toBeGreaterThan(130)
      expect(getTownPlayerTarget(location).y).toBeLessThan(TOWN_SIZE.height)
    }
  })
  it.each(['2026-10-07', '2026-10-08', '2026-11-06', '2026-11-09'])('has one correct daily marker on %s without changing schedules', (date) => {
    expect(getTownDailyLocation(date).jobId).toBe(getDailyJobId(date))
    expect(townLocations.filter(({ jobId }) => jobId === getTownDailyLocation(date).jobId)).toHaveLength(1)
  })
  it.each(jobs)('$id is immediately selectable and routes to its existing job without a date/level gate', (job) => {
    const location = getTownLocation(job.id)!
    expect(location.jobId).toBe(job.id)
    expect(getTownLaunch(job.id, '2026-10-08')).toEqual({ jobId: job.id, mode: 'free-play' })
    expect(getTownPlayerTarget(location)).toEqual({ x: location.position.x, y: location.position.y + 101 })
  })
  it('requires deliberate daily selection and prevents unrelated jobs masquerading as daily', () => {
    const date = '2026-10-08', daily = getDailyJobId(date)
    expect(getTownLaunch(daily, date)).toEqual({ jobId: daily, mode: 'free-play' })
    expect(getTownLaunch(daily, date, true)).toEqual({ jobId: daily, mode: 'daily' })
    expect(getTownLaunch('fishing', date, true)).toEqual({ jobId: 'fishing', mode: 'free-play' })
    expect(getTownLaunch('toString', date)).toBeNull()
    expect(getTownLocation('unknown')).toBeNull()
  })
  it('reuses saved appearance validation with safe fallback and no new avatar model', () => {
    expect(getTownAppearance(undefined)).toEqual(defaultAppearance)
    expect(getTownAppearance({ ...defaultAppearance, shirtId: 'missing', hairId: 'missing' })).toEqual(defaultAppearance)
    expect(getTownAppearance({ ...defaultAppearance, shirtId: 'rose', pantsId: 'plum' })).toMatchObject({ shirtId: 'rose', pantsId: 'plum' })
  })
})
describe('daily, free-play and replay context', () => {
  it.each(['free-play', 'replay'] as const)('%s awards normal income/XP/career/missions but never a daily completion, even for today’s job', (mode) => {
    const date = '2026-10-08', before = migratePersistedProgress(undefined)
    const game = createGameResult(getDailyJobId(date), 100)
    const update = applyGameCompletion(before, game, date, mode)
    expect(update.completedDailyChallenge).toBe(false)
    expect(update.progress).toMatchObject({ totalDaysWorked: 0, currentStreak: 0, bestStreak: 0, lastCompletedDate: null,
      money: game.earnedMoney, xp: 35, totalGamesPlayed: 1 })
    expect(update.progress.jobStats[game.jobId].timesPlayed).toBe(1)
    expect(update.progress.dailyMissions!.dateKey).toBe(date)
    useProgressStore.getState().completeGame(game, date, mode)
    expect(useProgressStore.getState().totalDaysWorked).toBe(0)
  })
  it('counts a deliberate daily run once after free play, preserving consecutive-day rules', () => {
    const date = '2026-10-08'
    const game = createGameResult(getDailyJobId(date), 100)
    const before = { ...migratePersistedProgress(undefined), currentStreak: 3, bestStreak: 3, lastCompletedDate: '2026-10-07', totalDaysWorked: 3 }
    const free = applyGameCompletion(before, game, date, 'free-play').progress
    expect(free.lastCompletedDate).toBe('2026-10-07')
    const daily = applyGameCompletion(free, game, date, 'daily')
    expect(daily.completedDailyChallenge).toBe(true)
    expect(daily.progress).toMatchObject({ totalDaysWorked: 4, currentStreak: 4 })
    expect(applyGameCompletion(daily.progress, game, date, 'daily').completedDailyChallenge).toBe(false)
    expect(applyGameCompletion(before, createGameResult('fishing', 100), date, 'daily').completedDailyChallenge).toBe(false)
  })
  it('retains v5 save compatibility without persisting navigation, avatar position or run mode', () => {
    const before = migratePersistedProgress(undefined)
    const json = serializeSave(before)
    const result = migrateImportedSave(json)
    expect(result.ok && result.save.version).toBe(5)
    expect(result.ok && result.save.data).toEqual(before)
    for (const field of ['runMode', 'town', 'selectedLocation', 'position', 'panelOpen']) expect(json).not.toContain(`"${field}"`)
  })
})
