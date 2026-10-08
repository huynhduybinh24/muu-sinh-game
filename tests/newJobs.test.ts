import { describe, expect, it } from 'vitest'
import { jobs } from '../src/data/jobs'
import { dailyJobEpochs } from '../src/data/dailySchedule'
import { dailyMissionEpochs } from '../src/data/dailyMissions'
import { getDailyJobId } from '../src/services/dailyChallenge'
import { getDailyMissionDefinitions, getMissionViews } from '../src/services/dailyMissions'
import { RUBBER_CONFIG, evaluateRubberTrace, tappingGuide } from '../src/game/config/rubberConfig'
import { MECHANIC_CONFIG, mechanicProblems, mechanicTools, matchesRepair } from '../src/game/config/mechanicConfig'
import { COFFEE_CONFIG, coffeeRecipes, emptyCoffeeCup, evaluateCoffee, extractionGrade } from '../src/game/config/coffeeConfig'
import { FISHING_CONFIG, chooseFishTier, evaluateCatch, fishingMarker, fishTiers } from '../src/game/config/fishingConfig'
import { createGameResult } from '../src/services/resultCalculator'
import { applyGameCompletion } from '../src/services/progression'
import { migratePersistedProgress } from '../src/store/progressStore'
import { migrateImportedSave, serializeSave, restoreSave } from '../src/services/saveService'
import { useProgressStore } from '../src/store/progressStore'
import { getNewAchievementUnlocks } from '../src/data/achievements'
import { getViralStat, shareCardThemes } from '../src/data/shareCard'
import type { GameResultMetadata } from '../src/types/game'

const added = ['rubber', 'mechanic', 'coffee', 'fishing'] as const
describe('rubber precision', () => {
  it('awards all four grades from coverage, accuracy and completion without pixel-perfect requirements', () => {
    const guide = tappingGuide()
    expect(guide).toHaveLength(RUBBER_CONFIG.guideSamples)
    for (const [offset, grade, points] of [[0, 'perfect', 120], [20, 'good', 80], [30, 'ok', 40], [90, 'bad', -30]] as const) {
      expect(evaluateRubberTrace(guide.map(({ x, y }) => ({ x, y: y + offset })))).toMatchObject({ grade, points })
    }
    expect(evaluateRubberTrace(guide.slice(0, 8))).toMatchObject({ grade: 'bad', completed: false })
    expect(evaluateRubberTrace([...guide].reverse()).grade).toBe('bad')
  })
  it('does not reward incomplete, invalid or oversized traces; supports sparse segments', () => {
    expect(evaluateRubberTrace([]).points).toBe(-30)
    expect(evaluateRubberTrace([{ x: NaN, y: 0 }, { x: 1, y: 2 }]).grade).toBe('bad')
    expect(evaluateRubberTrace(Array.from({ length: 241 }, () => ({ x: 94, y: 262 }))).grade).toBe('bad')
    expect(evaluateRubberTrace(tappingGuide().filter((_, i) => i % 3 === 0)).grade).toBe('perfect')
  })
})
describe('mechanic diagnosis', () => {
  it.each(mechanicProblems)('$id has exactly one matching typed tool', (problem) => {
    expect(mechanicTools.filter(({ id }) => matchesRepair(problem, id))).toEqual([mechanicTools.find(({ id }) => id === problem.tool)])
    expect(MECHANIC_CONFIG).toMatchObject({ correct: 100, wrong: -40, timeout: -25, fastBonus: 50 })
  })
})
describe('coffee recipe and extraction', () => {
  it.each(coffeeRecipes)('$name requires the correct ingredients and meaningful extraction timing', (recipe) => {
    const cup = { condensed: recipe.condensed, fresh: recipe.fresh, ice: recipe.ice }
    expect(evaluateCoffee(cup, recipe, 0.58)).toEqual({ grade: 'perfect', points: 120 })
    expect(evaluateCoffee(cup, recipe, 0.4)).toEqual({ grade: 'acceptable', points: 80 })
    for (const ratio of [null, 0.1, 0.95, NaN, Infinity]) expect(evaluateCoffee(cup, recipe, ratio).points).toBe(-50)
    for (const key of ['condensed', 'fresh', 'ice'] as const) expect(evaluateCoffee({ ...cup, [key]: !cup[key] }, recipe, 0.58).grade).toBe('wrong')
    expect(evaluateCoffee(emptyCoffeeCup(), recipe, 0.58).grade).toBe('wrong')
  })
  it('uses inclusive, centralized timing zones and the specified patience/bonuses', () => {
    expect(extractionGrade(COFFEE_CONFIG.perfectZone[0])).toBe('perfect')
    expect(extractionGrade(COFFEE_CONFIG.perfectZone[1])).toBe('perfect')
    expect(extractionGrade(COFFEE_CONFIG.acceptableZone[0])).toBe('acceptable')
    expect(extractionGrade(COFFEE_CONFIG.acceptableZone[1])).toBe('acceptable')
    expect(COFFEE_CONFIG.patience).toEqual({ min: 10, max: 14 })
    expect(COFFEE_CONFIG.fastBonus).toBe(30)
  })
})
describe('fishing tiers and timing', () => {
  it('selects all tiers deterministically from a bounded random value', () => {
    expect([0, 0.71, 0.72, 0.93, 0.94, 1, NaN].map(chooseFishTier)).toEqual(['common', 'common', 'rare', 'rare', 'epic', 'epic', 'common'])
  })
  it.each(['common', 'rare', 'epic'] as const)('%s has fixed scoring and a small perfect bonus', (tier) => {
    expect(evaluateCatch(tier, 0.35).points).toBe(fishTiers[tier].points)
    expect(evaluateCatch(tier, 0.5)).toEqual({ caught: true, perfect: true, points: fishTiers[tier].points + 20 })
    for (const ratio of [-1, 0.1, 0.9, NaN, Infinity]) expect(evaluateCatch(tier, ratio)).toMatchObject({ caught: false, points: 0 })
  })
  it('keeps marker movement finite, bounded and periodic with fair catch windows', () => {
    for (let ms = 0; ms < 10_000; ms += 17) { expect(fishingMarker(ms)).toBeGreaterThanOrEqual(0); expect(fishingMarker(ms)).toBeLessThanOrEqual(1) }
    expect(fishingMarker(0)).toBe(0)
    expect(fishingMarker(FISHING_CONFIG.markerPeriodMs / 2)).toBe(1)
    expect(evaluateCatch('common', FISHING_CONFIG.catchZone[0]).caught).toBe(true)
    expect(evaluateCatch('common', FISHING_CONFIG.catchZone[1]).caught).toBe(true)
  })
})
describe('ten-job integration and compatibility', () => {
  it('preserves pre-activation job/mission schedules and covers all ten jobs after activation', () => {
    for (const date of ['2024-02-29', '2026-10-07', '2026-10-15', '2026-10-31']) {
      expect(getDailyJobId(date)).toBe(getDailyJobId(date, jobs.slice(0, 6), [dailyJobEpochs[0]]))
      expect(getDailyMissionDefinitions(date)).toEqual(getDailyMissionDefinitions(date, [dailyMissionEpochs[0]], undefined, [dailyJobEpochs[0]]))
    }
    const dates = Array.from({ length: 30 }, (_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`)
    expect(new Set(dates.map((date) => getDailyJobId(date)))).toEqual(new Set(jobs.map(({ id }) => id)))
    expect(dailyJobEpochs[1].activeFrom).toBe('2026-11-01')
  })
  it.each(added)('%s updates Career, XP, achievements, metadata missions and share data', (jobId) => {
    const date = Array.from({ length: 60 }, (_, i) => { const d = new Date(2026, 10, 1 + i); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })
      .find((date) => getDailyJobId(date) === jobId && getDailyMissionDefinitions(date).some(({ id }) => id === 'daily-work'))!
    expect(date).toBeDefined()
    const metadata: GameResultMetadata = { treesTapped: 2, perfectTaps: 1, vehiclesRepaired: 2, correctRepairs: 2, customersServed: 2, perfectBrews: 1, fishCaught: 2, rareFishCaught: 1 }
    const game = createGameResult(jobId, 150, metadata)
    const update = applyGameCompletion(migratePersistedProgress(undefined), game, date)
    expect(update.progress.jobStats[jobId]).toMatchObject({ timesPlayed: 1, bestScore: 150, totalMoneyEarned: game.earnedMoney })
    expect(update.progress.xp).toBe(37)
    expect(update.completedDailyChallenge).toBe(true)
    expect(getMissionViews(update.progress.dailyMissions, date).find(({ id }) => id === 'daily-work')!.progress).toBe(2)
    expect(getViralStat(game).value).toBe(2)
    expect(game.metadata).toEqual(metadata)
    expect(shareCardThemes[jobId]).toBeDefined()
    update.progress.jobStats[jobId].timesPlayed = 9
    expect(getNewAchievementUnlocks(update.progress, date).map(({ id }) => id)).not.toContain(`${jobId}-10`)
    update.progress.jobStats[jobId].timesPlayed = 10
    expect(getNewAchievementUnlocks(update.progress, date).map(({ id }) => id)).toContain(`${jobId}-10`)
  })
  it('restores six-job version-5 backups without a schema bump or revoked achievements', () => {
    const old = migratePersistedProgress(undefined)
    old.money = 150_000; old.xp = 350; old.achievements = [{ id: 'all-jobs', unlockedAt: '2026-10-07T05:00:00Z' }]
    const portable = JSON.parse(serializeSave(old)) as { version: number; data: { jobStats: Record<string, unknown> } }
    for (const jobId of added) Reflect.deleteProperty(portable.data.jobStats, jobId)
    const imported = migrateImportedSave(portable)
    if (!imported.ok) throw new Error('Six-job backup must remain supported')
    expect(imported.save.version).toBe(5)
    for (const jobId of added) expect(imported.save.data.jobStats[jobId]).toEqual({ timesPlayed: 0, bestScore: 0, totalScore: 0, totalMoneyEarned: 0 })
    expect(restoreSave(portable).ok).toBe(true)
    expect(useProgressStore.getState().money).toBe(old.money)
    expect(useProgressStore.getState().xp).toBe(old.xp)
    expect(useProgressStore.getState().achievements).toEqual(old.achievements)
  })
})
