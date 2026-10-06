import { migratePersistedProgress } from '../src/store/progressStore'
import { createGameResult } from '../src/services/resultCalculator'
import { getDailyJobId } from '../src/services/dailyChallenge'
import type { GameResult, PlayerProgress } from '../src/types/game'

export function freshProgress(): PlayerProgress {
  return migratePersistedProgress(undefined)
}

export function dailyResult(dateKey: string, score = 100): GameResult {
  return {
    ...createGameResult(getDailyJobId(dateKey), score),
    completedAt: `${dateKey}T05:00:00.000Z`,
  }
}
