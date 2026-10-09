import { describe, expect, it } from 'vitest'
import { careRequests, priorityPatient, carePoints, carePatience } from '../src/game/config/doctorConfig'
import { lessonQuestions, lessonPoints, teacherPatience } from '../src/game/config/teacherConfig'
import { taxiNeighbor, taxiMoveOutcome, taxiTripPoints, taxiPatience } from '../src/game/config/taxiConfig'
describe('profession batch B', () => {
  it('care prioritizes explicit urgency, matches toy tools and bounded bonuses', () => {
    expect(priorityPatient([careRequests[2], careRequests[0]])).toBe(1)
    expect(careRequests.every(request => request.sequence.length === 2 && request.tool >= 0 && request.tool < 3)).toBe(true)
    expect([0, .5, 1, 2].map(r => carePoints(r * 100, 100))).toEqual([100, 125, 150, 150])
    expect(carePatience(100)).toBe(10)
  })
  it.each(lessonQuestions)('classroom questions have distinct, approachable answers', question => {
    expect(new Set(question.answers).size).toBe(3); expect(question.answers[question.correct]).toBeTruthy()
    expect(lessonPoints(50)).toBe(150); expect(lessonPoints(-1)).toBe(100); expect(lessonPoints(100)).toBe(150)
    expect(teacherPatience(100)).toBe(10)
  })
  it('taxi follows connected roads without wrapping edges', () => {
    expect(taxiNeighbor(0, 'left')).toBe(null); expect(taxiNeighbor(2, 'right')).toBe(null)
    expect(taxiNeighbor(0, 'up')).toBe(null); expect(taxiNeighbor(8, 'down')).toBe(null)
    expect(taxiNeighbor(4, 'up')).toBe(1); expect(taxiNeighbor(4, 'right')).toBe(5)
    expect(taxiNeighbor(9, 'left')).toBe(null)
  })
  it('taxi checks signals and vehicles independently from passenger trip rewards', () => {
    expect(taxiMoveOutcome(4, false, 2)).toBe('violation'); expect(taxiMoveOutcome(2, true, 2)).toBe('collision')
    expect(taxiMoveOutcome(4, true, 2)).toBe('safe'); expect(taxiMoveOutcome(null, true, 2)).toBe('edge')
    expect(taxiTripPoints(100, 1000, 0)).toEqual({ points: 170, fiveStar: true })
    expect(taxiTripPoints(100, 12000, 0)).toEqual({ points: 150, fiveStar: true })
    expect(taxiTripPoints(100, 1000, 1)).toEqual({ points: 120, fiveStar: false })
    expect(taxiTripPoints(70, 1000, 0)).toEqual({ points: 155, fiveStar: false })
    expect(taxiPatience(100)).toBe(20000)
  })
})
