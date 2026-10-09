import { describe, expect, it } from 'vitest'
import { jobs } from '../src/data/jobs'
import { dailyJobEpochs } from '../src/data/dailySchedule'
import { dailyMissionEpochs } from '../src/data/dailyMissions'
import { getDailyJobId } from '../src/services/dailyChallenge'
import { getDailyMissionDefinitions, getMissionViews } from '../src/services/dailyMissions'
import { getNewAchievementUnlocks } from '../src/data/achievements'
import { migratePersistedProgress, useProgressStore } from '../src/store/progressStore'
import { applyGameCompletion } from '../src/services/progression'
import { createGameResult } from '../src/services/resultCalculator'
import { getViralStat, shareCardThemes } from '../src/data/shareCard'
import { expansionIcons } from '../src/data/expansionIcons'
import { serializeSave, migrateImportedSave, restoreSave } from '../src/services/saveService'
import { TOWN_SIZE, townLocations } from '../src/data/town'
import type { AchievementId, GameResultMetadata } from '../src/types/game'

const newJobs = jobs.slice(10, 20)
const metadata: GameResultMetadata = { customersServed: 2, vehiclesServed: 2, packagesSorted: 2, streetsCleaned: 2,
  circuitsFixed: 2, bouquetsMade: 2, incidentsHandled: 2, correctDetections: 2, photosTaken: 2, fruitsHarvested: 2,
  perfectFills: 1, perfectSorts: 1, trashCollected: 8, perfectCircuits: 1, perfectBouquets: 1, perfectPhotos: 1, correctCheckouts: 2, basketsCompleted: 1 }
const dates = Array.from({length: 365}, (_, i) => {
  const date = new Date(2026, 11, 1+i)
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
})

describe('twenty-job integration', () => {
  it('freezes both previous epochs and activates exactly twenty jobs on December 1', () => {
    expect(dailyJobEpochs.slice(0, 3).map(e=>[e.version,e.activeFrom,e.jobIds.length])).toEqual([
      ['six-jobs-v1','0000-01-01',6], ['ten-jobs-v2','2026-11-01',10], ['twenty-jobs-v3','2026-12-01',20]])
    expect(dailyMissionEpochs.slice(0, 3).map(e=>[e.version,e.activeFrom])).toEqual([
      ['missions-v1','0000-01-01'], ['missions-v2','2026-11-01'], ['missions-v3','2026-12-01']])
    expect(new Set(dates.map(d=>getDailyJobId(d)))).toEqual(new Set(jobs.map(j=>j.id)))
    for (let i=0;i<334;i++) {
      const date=new Date(2026,0,1+i)
      const key=`2026-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
      expect(getDailyJobId(key)).toBe(getDailyJobId(key,jobs.slice(0,10),dailyJobEpochs.slice(0,2)))
      expect(getDailyMissionDefinitions(key)).toEqual(getDailyMissionDefinitions(key,dailyMissionEpochs.slice(0,2),undefined,dailyJobEpochs.slice(0,2)))
    }
  })
  it.each(newJobs)('$id integrates normal progression, correct metadata missions, sharing and its ten-play achievement', job => {
    const date=dates.find(d=>getDailyJobId(d)===job.id && getDailyMissionDefinitions(d).some(m=>m.id==='daily-work'))!
    expect(date).toBeDefined()
    const game=createGameResult(job.id,150,metadata)
    const update=applyGameCompletion(migratePersistedProgress(undefined),game,date,'free-play')
    expect(update.progress.jobStats[job.id]).toMatchObject({timesPlayed:1,bestScore:150,totalMoneyEarned:game.earnedMoney})
    expect(update.progress.money).toBe(game.earnedMoney); expect(update.progress.xp).toBe(37)
    expect(update.progress.totalDaysWorked).toBe(0)
    expect(getMissionViews(update.progress.dailyMissions,date).find(m=>m.id==='daily-work')!.progress).toBe(2)
    expect(game.metadata).toEqual(metadata); expect(getViralStat(game).value).toBe(2)
    expect(shareCardThemes[job.id].accent).toMatch(/^#[\da-f]{6}$/i)
    expect(expansionIcons[job.id]).toMatch(/^M/)
    const id=`${job.id}-10` as AchievementId
    update.progress.jobStats[job.id].timesPlayed=9
    expect(getNewAchievementUnlocks(update.progress,date).map(a=>a.id)).not.toContain(id)
    update.progress.jobStats[job.id].timesPlayed=10
    expect(getNewAchievementUnlocks(update.progress,date)).toContainEqual({id,unlockedAt:date})
    update.progress.achievements.push({id,unlockedAt:date})
    expect(getNewAchievementUnlocks(update.progress,date).map(a=>a.id)).not.toContain(id)
  })
  it('restores ten-job v5 backups atomically, retaining inventory, profile, balances and old unlocks', () => {
    const before=migratePersistedProgress(undefined)
    before.money=275000; before.xp=700; before.totalMoneySpent=70000
    before.ownedItemIds.push('shirt-rose'); before.profile.appearance.shirtId='rose'
    before.jobStats.fishing.timesPlayed=14; before.completedJobs=['fishing']
    before.achievements=[{id:'all-jobs',unlockedAt:'2026-11-30'},{id:'fishing-10',unlockedAt:'2026-11-30'}]
    const portable=JSON.parse(serializeSave(before)) as {version:number;data:{jobStats:Record<string,unknown>}}
    newJobs.forEach(j=>Reflect.deleteProperty(portable.data.jobStats,j.id))
    const imported=migrateImportedSave(portable)
    if (!imported.ok) throw new Error('Ten-job v5 backup must restore')
    expect(imported.save.version).toBe(5); expect(imported.save.data).toEqual(before)
    expect(restoreSave(portable).ok).toBe(true)
    expect(useProgressStore.getState().ownedItemIds).toEqual(before.ownedItemIds)
    expect(useProgressStore.getState().profile).toEqual(before.profile)
    newJobs.forEach(j=>expect(imported.save.data.jobStats[j.id]).toEqual({timesPlayed:0,bestScore:0,totalScore:0,totalMoneyEarned:0}))
  })
  it('keeps every Town hit area distinct, inside scroll bounds and above the player target', () => {
    for (const [i,location] of townLocations.entries()) {
      expect(location.position.y+101).toBeLessThan(TOWN_SIZE.height)
      for (const other of townLocations.slice(i+1)) {
        expect(Math.abs(location.position.x-other.position.x)>=160 || Math.abs(location.position.y-other.position.y)>=220).toBe(true)
      }
    }
  })
})
