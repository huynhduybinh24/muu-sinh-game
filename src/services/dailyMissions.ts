import { dailyMissionEpochs, jobMissionMetrics, missionTemplates, type MissionEpoch } from '../data/dailyMissions'
import { jobsById } from '../data/jobs'
import { dailyJobEpochs, type DailyJobEpoch } from '../data/dailySchedule'
import { jobs } from '../data/jobs'
import { getDailyJobId, hashDateKey, isLocalDateKey } from './dailyChallenge'
import type { DailyMissions, MissionDefinition, MissionView } from '../types/daily'
import type { GameResult, PlayerProgress } from '../types/game'

function missionSeed(dateKey: string, slot: number): number {
  const hash = hashDateKey(`${dateKey}:mission:${slot}`)
  // Mix bits so a two-choice pool is not tied to the Daily Job's even/odd hash.
  const mixed = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b)
  return (mixed ^ (mixed >>> 16)) >>> 0
}

export function getDailyMissionDefinitions(dateKey: string, epochs: readonly MissionEpoch[] = dailyMissionEpochs,
  templates = missionTemplates, jobEpochs: readonly DailyJobEpoch[] = dailyJobEpochs): MissionDefinition[] {
  const epoch = [...epochs].reverse().find((entry) => entry.activeFrom <= dateKey) ?? epochs[0]
  if (!epoch || epoch.pools.length !== 3) throw new Error('daily-mission-schedule-invalid')
  // The job-specific slot always matches the playable Daily Job. No inaccessible missions.
  const jobId = getDailyJobId(dateKey, jobs, jobEpochs)
  const selected = new Set<string>()
  return epoch.pools.map((pool, slot) => {
    const candidates = pool.filter((id) => !selected.has(id) && Object.hasOwn(templates, id))
    if (!candidates.length) throw new Error('daily-mission-pool-empty')
    const id = candidates[missionSeed(dateKey, slot) % candidates.length]
    selected.add(id)
    const template = templates[id]
    if (id === 'daily-shifts') return { ...template, jobId, title: `Ba ca ${jobsById[jobId].name}`, description: `Hoàn thành 3 ca ${jobsById[jobId].name}, kể cả chơi lại.` }
    if (id === 'daily-work') return { ...template, ...jobMissionMetrics[jobId], jobId, title: `Chăm chỉ ${jobsById[jobId].name}` }
    return { ...template }
  })
}
export function getMissionViews(saved: DailyMissions | null, dateKey: string): MissionView[] {
  return getDailyMissionDefinitions(dateKey).map((definition) => {
    const stored = saved?.dateKey === dateKey ? saved.missions.find((mission) => mission.id === definition.id) : undefined
    const progress = Math.min(definition.target, Math.max(0, stored?.progress ?? 0))
    const completed = progress >= definition.target
    return { ...definition, progress, completed, claimed: completed && Boolean(stored?.claimed) }
  })
}
export function readDailyMissions(value: unknown): DailyMissions | null {
  if (typeof value !== 'object' || value === null || !('dateKey' in value) || typeof value.dateKey !== 'string'
    || !isLocalDateKey(value.dateKey)) return null
  const entries = 'missions' in value && Array.isArray(value.missions) ? value.missions : []
  const missions = getDailyMissionDefinitions(value.dateKey).map((definition) => {
    const saved = entries.find((entry: unknown) => typeof entry === 'object' && entry !== null && 'id' in entry && entry.id === definition.id) as Record<string, unknown> | undefined
    const progress = typeof saved?.progress === 'number' && Number.isFinite(saved.progress)
      ? Math.min(definition.target, Math.max(0, Math.floor(saved.progress))) : 0
    return { id: definition.id, progress, claimed: progress >= definition.target && saved?.claimed === true }
  })
  return { dateKey: value.dateKey, missions }
}
export function syncDailyMissions(progress: PlayerProgress, dateKey: string): PlayerProgress {
  if (progress.dailyMissions?.dateKey === dateKey) return progress
  return { ...progress, dailyMissions: { dateKey, missions: getDailyMissionDefinitions(dateKey).map(({ id }) => ({ id, progress: 0, claimed: false })) } }
}
const count = (value: number | undefined) => value !== undefined && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
function missionIncrement(mission: MissionDefinition, result: GameResult): number {
  if (mission.jobId && mission.jobId !== result.jobId) return 0
  switch (mission.type) {
    case 'FIX_BUGS': return result.jobId === 'it' ? count(result.metadata?.bugsFixed) : 0
    case 'BALANCE_INVOICES': return result.jobId === 'accountant' ? count(result.metadata?.invoicesProcessed) : 0
    case 'RESOLVE_TRAFFIC': return result.jobId === 'police' ? count(result.metadata?.incidentsResolved) : 0
    case 'HELP_PATIENTS': return result.jobId === 'doctor' ? count(result.metadata?.patientsHelped) : 0
    case 'TEACH_LESSONS': return result.jobId === 'teacher' ? count(result.metadata?.lessonsCompleted) : 0
    case 'TAXI_TRIPS': return result.jobId === 'taxi' ? count(result.metadata?.tripsCompleted) : 0
    case 'PLAY_GAMES': case 'PLAY_JOB': return 1
    case 'SCORE_TOTAL': case 'SCORE_SINGLE': return count(result.score)
    case 'EARN_MONEY': return count(result.earnedMoney)
    case 'SERVE_CUSTOMERS': return ['sugarcane', 'noodle', 'barber', 'coffee', 'banhmi', 'cashier'].includes(result.jobId) ? count(result.metadata?.customersServed) : 0
    case 'FILL_VEHICLES': return result.jobId === 'gas' ? count(result.metadata?.vehiclesServed) : 0
    case 'SORT_PACKAGES': return result.jobId === 'cargo' ? count(result.metadata?.packagesSorted) : 0
    case 'CLEAN_STREETS': return result.jobId === 'cleaning' ? count(result.metadata?.streetsCleaned) : 0
    case 'FIX_CIRCUITS': return result.jobId === 'electrician' ? count(result.metadata?.circuitsFixed) : 0
    case 'MAKE_BOUQUETS': return result.jobId === 'florist' ? count(result.metadata?.bouquetsMade) : 0
    case 'DETECT_INCIDENTS': return result.jobId === 'security' ? count(result.metadata?.correctDetections) : 0
    case 'TAKE_PHOTOS': return result.jobId === 'photographer' ? count(result.metadata?.photosTaken) : 0
    case 'HARVEST_FRUITS': return result.jobId === 'harvest' ? count(result.metadata?.fruitsHarvested) : 0
    case 'SUCCESSFUL_BRICKS': return result.jobId === 'construction' ? count(result.metadata?.successfulBricks) : 0
    case 'DELIVERIES': return result.jobId === 'shipper' ? count(result.metadata?.deliveries) : 0
    case 'WASH_VEHICLES': return result.jobId === 'carwash' ? count(result.metadata?.vehiclesWashed) : 0
    case 'TAP_TREES': return result.jobId === 'rubber' ? count(result.metadata?.treesTapped) : 0
    case 'REPAIR_VEHICLES': return result.jobId === 'mechanic' ? count(result.metadata?.vehiclesRepaired) : 0
    case 'CATCH_FISH': return result.jobId === 'fishing' ? count(result.metadata?.fishCaught) : 0
  }
}
export function updateDailyMissionProgress(progress: PlayerProgress, result: GameResult, dateKey: string): PlayerProgress {
  const views = getMissionViews(progress.dailyMissions, dateKey)
  return { ...progress, dailyMissions: { dateKey, missions: views.map((mission) => ({
    id: mission.id, claimed: mission.claimed,
    progress: Math.min(mission.target, mission.type === 'SCORE_SINGLE'
      ? Math.max(mission.progress, missionIncrement(mission, result)) : mission.progress + missionIncrement(mission, result)),
  })) } }
}
export function claimMission(progress: PlayerProgress, id: string, dateKey: string): PlayerProgress {
  const ready = syncDailyMissions(progress, dateKey)
  const mission = getMissionViews(ready.dailyMissions, dateKey).find((entry) => entry.id === id)
  if (!mission || !mission.completed || mission.claimed) return ready
  return { ...ready, money: ready.money + mission.rewardMoney, xp: ready.xp + mission.rewardXp,
    totalDailyMissionsClaimed: ready.totalDailyMissionsClaimed + 1,
    dailyMissions: { dateKey, missions: ready.dailyMissions!.missions.map((entry) => entry.id === id ? { ...entry, claimed: true } : entry) },
  }
}
