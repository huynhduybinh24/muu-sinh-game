export type DeliveryObjective = 'pickup' | 'deliver'
export type MoveDirection = 'up' | 'down' | 'left' | 'right'

export interface MapPoint {
  x: number
  y: number
}

export interface DeliveryRoute {
  pickup: MapPoint
  destination: MapPoint
}

export interface ObstacleConfig {
  id: string
  x: number
  y: number
  width: number
  height: number
  icon: string
  color: number
}

export const SHIPPER_CONFIG = {
  sceneWidth: 360,
  sceneHeight: 650,
  mapBounds: {
    left: 16,
    right: 344,
    top: 126,
    bottom: 492,
  },
  playerRadius: 15,
  playerSpeed: 175,
  slowedSpeedMultiplier: 0.6,
  slowDurationMs: 550,
  collisionCooldownMs: 1_300,
  targetRadius: 25,
  successfulDeliveryScore: 100,
  obstaclePenalty: 20,
  maximumFastBonus: 50,
  startingBonusWindowMs: 11_000,
  minimumBonusWindowMs: 7_000,
  bonusWindowReductionMs: 400,
  initialObstacleCount: 3,
  maximumObstacleCount: 6,
  deliveriesPerExtraObstacle: 2,
} as const

export const deliveryRoutes: readonly DeliveryRoute[] = [
  { pickup: { x: 70, y: 164 }, destination: { x: 292, y: 444 } },
  { pickup: { x: 290, y: 160 }, destination: { x: 68, y: 430 } },
  { pickup: { x: 178, y: 436 }, destination: { x: 72, y: 166 } },
  { pickup: { x: 64, y: 304 }, destination: { x: 296, y: 304 } },
]

export const obstacleConfigs: readonly ObstacleConfig[] = [
  { id: 'car-1', x: 180, y: 176, width: 62, height: 30, icon: '🚗', color: 0x4389bd },
  { id: 'barrier', x: 108, y: 304, width: 58, height: 24, icon: '🚧', color: 0xf19a34 },
  { id: 'pothole', x: 252, y: 370, width: 42, height: 30, icon: '🕳️', color: 0x514b45 },
  { id: 'dog', x: 185, y: 430, width: 38, height: 32, icon: '🐕', color: 0xd8a45d },
  { id: 'car-2', x: 286, y: 246, width: 58, height: 29, icon: '🚙', color: 0x6a9b57 },
  { id: 'cones', x: 174, y: 278, width: 48, height: 24, icon: '🚧', color: 0xdd6941 },
]

export function getFastDeliveryBonus(deliveryMs: number, completedDeliveries: number): number {
  const bonusWindow = Math.max(
    SHIPPER_CONFIG.minimumBonusWindowMs,
    SHIPPER_CONFIG.startingBonusWindowMs -
      completedDeliveries * SHIPPER_CONFIG.bonusWindowReductionMs,
  )
  const remainingRatio = Math.max(0, 1 - deliveryMs / bonusWindow)
  return Math.round(SHIPPER_CONFIG.maximumFastBonus * remainingRatio)
}

export function getActiveObstacleCount(completedDeliveries: number): number {
  return Math.min(
    SHIPPER_CONFIG.maximumObstacleCount,
    SHIPPER_CONFIG.initialObstacleCount +
      Math.floor(completedDeliveries / SHIPPER_CONFIG.deliveriesPerExtraObstacle),
  )
}
