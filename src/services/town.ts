import { townLocations } from '../data/town'
import { getDailyJobId } from './dailyChallenge'
import { readAppearance } from './playerProfile'
import type { TownLaunch, TownLocation, TownPoint } from '../types/town'

export function getTownLocation(jobId: string): TownLocation | null { return townLocations.find((location) => location.jobId === jobId) ?? null }
export function getTownDailyLocation(dateKey: string): TownLocation { return getTownLocation(getDailyJobId(dateKey))! }
export function getTownPlayerTarget(location: TownLocation): TownPoint { return { x: location.position.x, y: location.position.y + 101 } }
export function getTownLaunch(jobId: string, dateKey: string, requestDaily = false): TownLaunch | null {
  const location = getTownLocation(jobId)
  return location ? { jobId: location.jobId, mode: requestDaily && location.jobId === getDailyJobId(dateKey) ? 'daily' : 'free-play' } : null
}
// Reuse shared appearance validation; Town has no inventory/model/state of its own.
export const getTownAppearance = readAppearance
