export const POLICE_CONFIG = { correct: 100, perfect: 150, wrong: -40, congestion: -20, patience: 8, minimumPatience: 5, quickMs: 2200, nextMs: 800 } as const
export type TrafficLane = 'vertical' | 'horizontal'
export interface TrafficRequest { lane: TrafficLane; emergency: boolean; violation: boolean }
export const trafficRequests: readonly TrafficRequest[] = [
  { lane: 'vertical', emergency: false, violation: false }, { lane: 'horizontal', emergency: false, violation: false },
  { lane: 'vertical', emergency: true, violation: false }, { lane: 'horizontal', emergency: true, violation: true },
  { lane: 'vertical', emergency: false, violation: true },
]
export function trafficDecision(green: TrafficLane | null, chosen: TrafficLane, request: TrafficRequest) {
  if (green !== null && green !== chosen) return 'conflict'
  return request.violation || chosen !== request.lane ? 'wrong' : 'safe'
}
export const trafficPoints = (elapsed: number, emergency: boolean) => emergency && elapsed <= POLICE_CONFIG.quickMs ? POLICE_CONFIG.perfect : POLICE_CONFIG.correct
export const trafficPatience = (resolved: number) => Math.max(POLICE_CONFIG.minimumPatience, POLICE_CONFIG.patience - resolved * .2)
