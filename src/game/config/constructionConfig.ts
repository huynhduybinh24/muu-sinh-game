export type PlacementGrade = 'perfect' | 'good' | 'ok' | 'miss'

export interface PlacementResult {
  grade: PlacementGrade
  points: number
  message: string
}

export const CONSTRUCTION_CONFIG = {
  sceneWidth: 360,
  sceneHeight: 650,
  brickHeight: 28,
  startingBrickWidth: 210,
  minimumBrickWidth: 110,
  widthReductionPerBrick: 1.5,
  baseSpeed: 90,
  speedIncreasePerBrick: 5,
  maximumSpeed: 195,
  horizontalPadding: 22,
  spawnY: 148,
  baseY: 556,
  cameraTopY: 290,
  dropDurationMs: 260,
  nextBrickDelayMs: 260,
  comboBonusPerLevel: 10,
  maximumComboBonus: 50,
  thresholds: {
    perfectOffsetRatio: 0.08,
    goodOverlapRatio: 0.72,
    okOverlapRatio: 0.28,
  },
  scoring: {
    perfect: 100,
    good: 70,
    ok: 30,
    miss: -30,
  },
} as const

export function classifyPlacement(
  brickX: number,
  brickWidth: number,
  targetX: number,
  targetWidth: number,
): PlacementResult {
  const offsetRatio = Math.abs(brickX - targetX) / targetWidth
  const overlap = Math.max(
    0,
    Math.min(brickX + brickWidth / 2, targetX + targetWidth / 2) -
      Math.max(brickX - brickWidth / 2, targetX - targetWidth / 2),
  )
  const overlapRatio = overlap / Math.min(brickWidth, targetWidth)
  const { scoring, thresholds } = CONSTRUCTION_CONFIG

  if (offsetRatio <= thresholds.perfectOffsetRatio) {
    return { grade: 'perfect', points: scoring.perfect, message: '+100 HOÀN HẢO!' }
  }
  if (overlapRatio >= thresholds.goodOverlapRatio) {
    return { grade: 'good', points: scoring.good, message: '+70 TỐT!' }
  }
  if (overlapRatio >= thresholds.okOverlapRatio) {
    return { grade: 'ok', points: scoring.ok, message: '+30 TẠM ỔN!' }
  }
  return { grade: 'miss', points: scoring.miss, message: '-30 RỚT GẠCH!' }
}

export function getComboBonus(combo: number): number {
  return Math.min(
    Math.max(0, combo - 1) * CONSTRUCTION_CONFIG.comboBonusPerLevel,
    CONSTRUCTION_CONFIG.maximumComboBonus,
  )
}
