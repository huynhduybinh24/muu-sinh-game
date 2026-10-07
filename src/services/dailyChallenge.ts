import { jobs } from '../data/jobs'
import type { Job, JobId } from '../types/job'
import { dailyJobEpochs, type DailyJobEpoch } from '../data/dailySchedule'

function padDatePart(value: number): string {
  return String(value).padStart(2, '0')
}

export function getLocalDateKey(date = new Date()): string {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join('-')
}

function parseLocalDateKey(dateKey: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey)
  if (!match) return null

  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(year, monthIndex, day)
  if (
    date.getFullYear() !== year
    || date.getMonth() !== monthIndex
    || date.getDate() !== day
  ) return null

  return date
}

export function isLocalDateKey(value: string): boolean {
  return parseLocalDateKey(value) !== null
}

export function getPreviousLocalDateKey(date = new Date()): string {
  return getLocalDateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1))
}

export function isYesterday(previousDateKey: string, currentDateKey: string): boolean {
  const currentDate = parseLocalDateKey(currentDateKey)
  if (!currentDate) return false
  return previousDateKey === getPreviousLocalDateKey(currentDate)
}

export function hashDateKey(dateKey: string): number {
  let hash = 0
  for (const character of dateKey) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  }
  return hash
}

export function getDailyJobId(
  dateKey: string,
  availableJobs: readonly Job[] = jobs,
  epochs: readonly DailyJobEpoch[] = dailyJobEpochs,
): JobId {
  if (availableJobs.length === 0) throw new Error('daily-job-list-empty')
  // Custom catalogs (tests/limited builds) use the frozen epoch order, not their input order.
  const epoch = [...epochs].reverse().find((entry) => entry.activeFrom <= dateKey) ?? epochs[0]
  if (!epoch || epoch.jobIds.length === 0) throw new Error('daily-job-epoch-empty')
  const activeIds = epoch.jobIds.filter((id) => availableJobs.some((job) => job.id === id))
  if (activeIds.length === 0) throw new Error('daily-job-list-empty')
  return activeIds[hashDateKey(dateKey) % activeIds.length]
}
