import { distanceToScrubPath, type ScrubPoint } from './carwashConfig'

export const RUBBER_CONFIG = { guideSamples: 25, coverageRadius: 26, endpointRadius: 36, maximumTracePoints: 240,
  treeSeconds: 11, nextTreeMs: 550, fastBonus: 30,
  perfect: { coverage: 0.92, distance: 9, points: 120 }, good: { coverage: 0.75, distance: 20, points: 80 },
  ok: { coverage: 0.55, distance: 30, points: 40 }, bad: -30 } as const
export function tappingGuide(): ScrubPoint[] {
  return Array.from({ length: RUBBER_CONFIG.guideSamples }, (_, i) => {
    const t = i / (RUBBER_CONFIG.guideSamples - 1)
    return { x: 94 + 168 * t, y: 262 + 116 * t + Math.sin(t * Math.PI) * 34 }
  })
}
const nearestDistance = (point: ScrubPoint, path: readonly ScrubPoint[]) => {
  if (path.length < 2) return Infinity
  let distance = Infinity
  for (let i = 1; i < path.length; i++) distance = Math.min(distance, distanceToScrubPath(point, path[i - 1], path[i]))
  return distance
}
export function evaluateRubberTrace(trace: readonly ScrubPoint[], guide: readonly ScrubPoint[] = tappingGuide()) {
  const valid = trace.length >= 2 && trace.length <= RUBBER_CONFIG.maximumTracePoints
    && trace.every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y)) && guide.length >= 2
  const coverage = valid ? guide.filter((point) => nearestDistance(point, trace) <= RUBBER_CONFIG.coverageRadius).length / guide.length : 0
  const averageDistance = valid ? trace.reduce((sum, point) => sum + nearestDistance(point, guide), 0) / trace.length : Infinity
  const completed = valid && Math.hypot(trace[0].x - guide[0].x, trace[0].y - guide[0].y) <= RUBBER_CONFIG.endpointRadius
    && Math.hypot(trace.at(-1)!.x - guide.at(-1)!.x, trace.at(-1)!.y - guide.at(-1)!.y) <= RUBBER_CONFIG.endpointRadius
  for (const grade of ['perfect', 'good', 'ok'] as const) {
    const rule = RUBBER_CONFIG[grade]
    if (completed && coverage >= rule.coverage && averageDistance <= rule.distance) return { grade, points: rule.points, coverage, averageDistance, completed }
  }
  return { grade: 'bad' as const, points: RUBBER_CONFIG.bad, coverage, averageDistance, completed }
}
