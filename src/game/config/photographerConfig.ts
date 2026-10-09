export const PHOTO_CONFIG = { perfect: 150, good: 100, acceptable: 50, miss: 0, perfectDistance: 12, goodDistance: 27, acceptableDistance: 43, stableMs: 240, goodStableMs: 100, perfectPose: 0.65, goodPose: 0.1, cooldownMs: 400, initialSpeed: 0.8, maximumSpeed: 1.5 } as const
export function evaluatePhoto(distance: number, pose: number, stableMs: number) {
  const valid = [distance, pose, stableMs].every(Number.isFinite) && distance >= 0 && stableMs >= 0
  const grade = !valid ? 'miss' : distance <= PHOTO_CONFIG.perfectDistance && pose >= PHOTO_CONFIG.perfectPose && stableMs >= PHOTO_CONFIG.stableMs ? 'perfect'
    : distance <= PHOTO_CONFIG.goodDistance && pose >= PHOTO_CONFIG.goodPose && stableMs >= PHOTO_CONFIG.goodStableMs ? 'good' : distance <= PHOTO_CONFIG.acceptableDistance ? 'acceptable' : 'miss'
  return { grade, points: PHOTO_CONFIG[grade] }
}
export const photoSpeed = (photos: number) => Math.min(PHOTO_CONFIG.maximumSpeed, PHOTO_CONFIG.initialSpeed + Math.max(0, photos) * 0.03)
// Integrate velocity so taking a photo cannot teleport the subject along its orbit.
export const advancePhotoPhase = (phase: number, deltaMs: number, photos: number) => phase + Math.max(0, deltaMs) / 1000 * photoSpeed(photos)

