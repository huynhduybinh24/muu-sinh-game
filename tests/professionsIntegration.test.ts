import { describe, expect, it } from 'vitest'
import { jobs } from '../src/data/jobs'
import { dailyJobEpochs } from '../src/data/dailySchedule'
import { dailyMissionEpochs } from '../src/data/dailyMissions'
import { getDailyJobId } from '../src/services/dailyChallenge'
import { getDailyMissionDefinitions, getMissionViews } from '../src/services/dailyMissions'
import { getNewAchievementUnlocks } from '../src/data/achievements'
import { migratePersistedProgress } from '../src/store/progressStore'
import { applyGameCompletion } from '../src/services/progression'
import { createGameResult } from '../src/services/resultCalculator'
import { getViralStat } from '../src/data/shareCard'
import { expansionIcons } from '../src/data/expansionIcons'
import { migrateImportedSave, serializeSave } from '../src/services/saveService'
import type { AchievementId, GameResultMetadata } from '../src/types/game'

const added = jobs.slice(20)
const dates = Array.from({ length: 365 }, (_, i) => {
  const date = new Date(2027, 0, 1 + i)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
})
const metadata: GameResultMetadata = { bugsFixed: 2, perfectFixes: 1, invoicesProcessed: 2, perfectBalances: 1, incidentsResolved: 2, safeDecisions: 3, patientsHelped: 2, perfectCare: 1, lessonsCompleted: 2, correctAnswers: 2, tripsCompleted: 2, fiveStarTrips: 1 }
describe('twenty-six profession integration', () => {
  it('appends only the January epoch and preserves every historical job and mission mapping', () => {
    expect(dailyJobEpochs.map(e => [e.activeFrom, e.jobIds.length])).toEqual([['0000-01-01', 6], ['2026-11-01', 10], ['2026-12-01', 20], ['2027-01-01', 26]])
    expect(dailyMissionEpochs.map(e => e.activeFrom)).toEqual(['0000-01-01', '2026-11-01', '2026-12-01', '2027-01-01'])
    for (let i = 0; i < 365; i++) {
      const date = new Date(2026, 0, 1 + i), key = `2026-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      expect(getDailyJobId(key)).toBe(getDailyJobId(key, jobs.slice(0, 20), dailyJobEpochs.slice(0, 3)))
      expect(getDailyMissionDefinitions(key)).toEqual(getDailyMissionDefinitions(key, dailyMissionEpochs.slice(0, 3), undefined, dailyJobEpochs.slice(0, 3)))
    }
    expect(new Set(dates.map(key => getDailyJobId(key)))).toEqual(new Set(jobs.map(job => job.id)))
  })
  it.each(added)('$id preserves income/XP and adds metrics, sharing and a ten-play achievement', job => {
    const date = dates.find(key => getDailyJobId(key) === job.id && getDailyMissionDefinitions(key).some(m => m.id === 'daily-work'))!
    expect(date).toBeDefined()
    const result = createGameResult(job.id, 150, metadata)
    const update = applyGameCompletion(migratePersistedProgress(undefined), result, date, 'free-play')
    expect(update.progress.money).toBe(result.earnedMoney); expect(update.progress.xp).toBe(37)
    expect(update.progress.totalDaysWorked).toBe(0); expect(update.progress.jobStats[job.id].timesPlayed).toBe(1)
    expect(getMissionViews(update.progress.dailyMissions, date).find(m => m.id === 'daily-work')!.progress).toBe(2)
    expect(getViralStat(result).value).toBe(2); expect(expansionIcons[job.id]).toMatch(/^M/)
    const id = `${job.id}-10` as AchievementId
    update.progress.jobStats[job.id].timesPlayed = 9
    expect(getNewAchievementUnlocks(update.progress, date).map(item => item.id)).not.toContain(id)
    update.progress.jobStats[job.id].timesPlayed = 10
    expect(getNewAchievementUnlocks(update.progress, date)).toContainEqual({ id, unlockedAt: date })
    update.progress.achievements.push({ id, unlockedAt: date })
    expect(getNewAchievementUnlocks(update.progress, date).map(item => item.id)).not.toContain(id)
  })
  it('restores twenty-job v5 backups with original balances, ownership, profile and unlocks', () => {
    const expected = migratePersistedProgress(undefined)
    expected.money = 275000; expected.xp = 700; expected.totalMoneySpent = 70000
    expected.ownedItemIds.push('shirt-rose'); expected.profile.appearance.shirtId = 'rose'
    expected.jobStats.harvest.timesPlayed = 12
    expected.achievements = [{ id: 'all-jobs', unlockedAt: '2026-12-31' }, { id: 'harvest-10', unlockedAt: '2026-12-31' }]
    const backup = JSON.parse(serializeSave(expected)) as { data: { jobStats: Record<string, unknown> } }
    added.forEach(job => Reflect.deleteProperty(backup.data.jobStats, job.id))
    const imported = migrateImportedSave(backup)
    expect(imported.ok).toBe(true)
    if (!imported.ok) throw new Error('Expected v5 restore')
    expect(imported.save.version).toBe(5); expect(imported.save.data).toEqual(expected)
    added.forEach(job => expect(imported.save.data.jobStats[job.id].timesPlayed).toBe(0))
  })
})
