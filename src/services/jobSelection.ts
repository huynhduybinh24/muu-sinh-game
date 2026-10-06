import type { Job, JobId } from '../types/job'

export function chooseRandomJob(
  availableJobs: readonly Job[],
  previousJobId: JobId | null,
  random: () => number = Math.random,
): Job {
  if (availableJobs.length === 0) {
    throw new Error('At least one job is required.')
  }

  const candidates =
    availableJobs.length > 1
      ? availableJobs.filter((job) => job.id !== previousJobId)
      : availableJobs

  const index = Math.floor(random() * candidates.length)
  return candidates[Math.min(index, candidates.length - 1)]
}
