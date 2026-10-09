import { describe, expect, it } from 'vitest'
import { jobs, jobsById } from '../src/data/jobs'
import { tutorials } from '../src/data/tutorials'
import { achievements } from '../src/data/achievements'
import { getViralStat, shareCardThemes } from '../src/data/shareCard'
import { getDailyJobId } from '../src/services/dailyChallenge'
import { migratePersistedProgress } from '../src/store/progressStore'
import { applyGameCompletion } from '../src/services/progression'
import { createGameResult } from '../src/services/resultCalculator'
import { NOODLE_CONFIG, emptyNoodleBowl, isCorrectBowl, noodleIngredients, noodleRecipes } from '../src/game/config/noodleConfig'
import { BARBER_CONFIG, compareHaircut, haircutPatterns } from '../src/game/config/barberConfig'
import { CARWASH_CONFIG, distanceToScrubPath, getCleanliness } from '../src/game/config/carwashConfig'
import { getFastBonus } from '../src/game/config/serviceJobConfig'

describe('six-job catalog and progression', () => {
  it('has twenty-six unique playable jobs with tutorials, themes and 45-second rounds', () => {
    expect(jobs.map((job) => job.id)).toEqual(['sugarcane', 'construction', 'shipper', 'noodle', 'barber', 'carwash', 'rubber', 'mechanic', 'coffee', 'fishing', 'banhmi', 'gas', 'cargo', 'cleaning', 'electrician', 'florist', 'security', 'photographer', 'cashier', 'harvest', 'it', 'accountant', 'police', 'doctor', 'teacher', 'taxi'])
    expect(new Set(jobs.map((job) => job.sceneKey)).size).toBe(26)
    for (const job of jobs) {
      expect(job.duration).toBe(45)
      expect(jobsById[job.id]).toBe(job)
      expect(tutorials[job.id].steps.length).toBeGreaterThanOrEqual(3)
      expect(shareCardThemes[job.id]).toBeDefined()
    }
    expect(achievements).toHaveLength(46)
  })
  it('daily selection covers all six jobs deterministically', () => {
    const dates = Array.from({ length: 28 }, (_, index) => `2026-10-${String(index + 1).padStart(2, '0')}`)
    const selected = dates.map((date) => getDailyJobId(date))
    expect(new Set(selected)).toEqual(new Set(jobs.slice(0, 6).map((job) => job.id)))
    expect(dates.map((date) => getDailyJobId(date))).toEqual(selected)
  })
  it('fills new stats in version-3 saves without losing old stats or unlocked achievements', () => {
    const source = migratePersistedProgress(undefined)
    source.profile.playerName = 'Minh'
    source.jobStats.shipper.timesPlayed = 12
    source.money = 500_000
    source.achievements = [{ id: 'all-jobs', unlockedAt: '2026-10-06' }]
    const legacy = { ...source, jobStats: { sugarcane: source.jobStats.sugarcane, construction: source.jobStats.construction, shipper: source.jobStats.shipper } }
    const migrated = migratePersistedProgress(legacy)
    expect(migrated.jobStats.noodle.timesPlayed).toBe(0)
    expect(migrated.jobStats.barber.timesPlayed).toBe(0)
    expect(migrated.jobStats.carwash.timesPlayed).toBe(0)
    expect(migrated.profile.playerName).toBe('Minh')
    expect(migrated.money).toBe(500_000)
    expect(migrated.achievements).toEqual(source.achievements)
    expect(migrated.jobStats.shipper.timesPlayed).toBe(12)
  })
  it.each(['noodle', 'barber', 'carwash'] as const)('%s uses existing daily, career and reward updates', (id) => {
    const date = Array.from({ length: 28 }, (_, index) => `2026-10-${String(index + 1).padStart(2, '0')}`)
      .find((day) => getDailyJobId(day) === id)!
    const result = createGameResult(id, 150)
    const update = applyGameCompletion(migratePersistedProgress(undefined), result, date)
    expect(update.completedDailyChallenge).toBe(true)
    expect(update.progress.jobStats[id]).toEqual({ timesPlayed: 1, bestScore: 150, totalScore: 150, totalMoneyEarned: result.earnedMoney })
    expect(update.progress.completedJobs).toEqual([id])
    expect(update.progress.currentStreak).toBe(1)
  })
  it.each(['noodle', 'barber', 'carwash'] as const)('%s result metadata has safe legacy/invalid fallbacks', (id) => {
    const key = shareCardThemes[id].metadataKey
    expect(getViralStat(createGameResult(id, 275)).value).toBe(2)
    for (const invalid of [-1, NaN, Infinity]) {
      expect(getViralStat(createGameResult(id, 275, { [key]: invalid })).value).toBe(2)
    }
    expect(getViralStat(createGameResult(id, 275, { [key]: 0 })).value).toBe(0)
  })
})

describe('Noodle recipes', () => {
  it.each(noodleRecipes)('$name validates all required ingredients and rejects missing/extra ingredients', (recipe) => {
    const bowl = emptyNoodleBowl()
    expect(isCorrectBowl(bowl, recipe)).toBe(false)
    for (const ingredient of recipe.ingredients) bowl[ingredient] = true
    expect(isCorrectBowl(bowl, recipe)).toBe(true)
    for (const { id } of noodleIngredients) {
      expect(isCorrectBowl({ ...bowl, [id]: !bowl[id] }, recipe)).toBe(false)
    }
  })
  it('keeps specified patience, penalties and capped fast bonuses', () => {
    expect(NOODLE_CONFIG.patienceSeconds).toEqual({ min: 9, max: 13 })
    expect(NOODLE_CONFIG.wrong).toBe(-50)
    expect(NOODLE_CONFIG.timeout).toBe(-30)
    expect(getFastBonus(5000, 10000, 50)).toBe(25)
    expect(getFastBonus(-1, 10000, 50)).toBe(0)
    expect(getFastBonus(20000, 10000, 50)).toBe(50)
    expect(getFastBonus(1000, 0, 50)).toBe(0)
  })
})

describe('Barber target comparison', () => {
  it.each(haircutPatterns)('$name uses six large tap sections and exact typed patterns', (target) => {
    expect(target.keep).toHaveLength(BARBER_CONFIG.sectionCount)
    expect(compareHaircut([...target.keep], target)).toMatchObject({ grade: 'perfect', points: 150 })
    for (const [errors, grade, points] of [[1, 'good', 100], [2, 'acceptable', 50], [3, 'bad', -40]] as const) {
      const sections = [...target.keep]
      for (let index = 0; index < errors; index++) sections[index] = !sections[index]
      expect(compareHaircut(sections, target)).toMatchObject({ grade, points })
    }
    expect(compareHaircut([], target).grade).toBe('bad')
  })
})

describe('Carwash cleaning', () => {
  it('measures scrub paths inclusively, including stationary press and fast drags', () => {
    expect(distanceToScrubPath({ x: 50, y: 10 }, { x: 0, y: 0 }, { x: 100, y: 0 })).toBe(10)
    expect(distanceToScrubPath({ x: 20, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 })).toBe(20)
    expect(distanceToScrubPath({ x: 150, y: 0 }, { x: 0, y: 0 }, { x: 100, y: 0 })).toBe(50)
  })
  it('requires 90% cleanliness, averages partial spots and clamps values', () => {
    expect(getCleanliness([1, 1, 1])).toBe(0)
    expect(getCleanliness([0, 0, 0])).toBe(1)
    expect(getCleanliness([0, 1])).toBe(0.5)
    expect(getCleanliness([0.05, 0.05])).toBeGreaterThanOrEqual(CARWASH_CONFIG.targetCleanliness)
    expect(getCleanliness([0.2, 0.2])).toBeLessThan(CARWASH_CONFIG.targetCleanliness)
    expect(getCleanliness([-1, 2])).toBe(0.5)
    expect(getCleanliness([])).toBe(1)
  })
})
