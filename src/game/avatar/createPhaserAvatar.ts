import Phaser from 'phaser'
import { AVATAR_MOTION, getAvatarNameTag, type AvatarState, type PhaserAvatarData } from './avatarData'
import { drawAvatar, drawScooter } from './drawAvatar'

interface AvatarOptions {
  x?: number
  y?: number
  scale?: number
  depth?: number
  riding?: boolean
  nameTag?: boolean
}

export interface PhaserAvatar {
  container: Phaser.GameObjects.Container
  nameTag: Phaser.GameObjects.Text | null
  setState: (state: AvatarState) => void
  setFacing: (direction: -1 | 1) => void
  destroy: () => void
}

/** One Graphics character per scene, drawn once; only its visual child is tweened. */
export function createPhaserAvatar(scene: Phaser.Scene, data: PhaserAvatarData, options: AvatarOptions = {}): PhaserAvatar {
  const scale = options.scale ?? 0.6
  const baseY = options.riding ? 18 : 0
  const container = scene.add.container(options.x ?? 0, options.y ?? 0)
    .setDepth(options.depth ?? 15).setName('player-avatar')
    .setData('appearance', { ...data.appearance })
  const shadow = scene.add.ellipse(0, options.riding ? 20 : 2, 68 * scale, 12 * scale, 0x353044, 0.16)
  const graphics = scene.add.graphics()
  drawAvatar(graphics, data, options.riding ?? false)
  if (options.riding) drawScooter(graphics)
  const motion = scene.add.container(0, baseY, [graphics]).setScale(scale).setName('avatar-motion')
  container.add([shadow, motion])
  const nameTag = options.nameTag && data.playerName ? scene.add.text(0, -33, getAvatarNameTag(data.playerName), {
    fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#ffffff',
    backgroundColor: '#353044', padding: { x: 4, y: 2 },
  }).setOrigin(0.5, 1) : null
  if (nameTag) {
    nameTag.setScale(Math.min(1, 86 / nameTag.width))
    container.add(nameTag)
  }

  let baseState: AvatarState = 'idle'
  let reaction: AvatarState | null = null
  let tween: Phaser.Tweens.Tween | null = null
  let destroyed = false
  const animate = typeof window.matchMedia !== 'function' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const play = (state: AvatarState) => {
    tween?.remove()
    motion.setPosition(0, baseY).setAngle(0)
    container.setData('avatarState', state)
    if (!animate || destroyed) return
    const config = AVATAR_MOTION[state]
    tween = scene.tweens.add({
      targets: motion, x: config.x, y: baseY + config.y, angle: config.angle,
      duration: config.duration, repeat: config.repeat, yoyo: true, ease: 'Sine.easeInOut',
      onComplete: () => {
        tween = null
        reaction = null
        if (!destroyed) play(baseState)
      },
    })
  }

  const setState = (state: AvatarState) => {
    if (destroyed) return
    if (state === 'success' || state === 'fail') {
      reaction = animate ? state : null
      play(state)
    } else if (baseState !== state) {
      baseState = state
      if (!reaction) play(state)
    }
  }

  const destroy = () => {
    if (destroyed) return
    destroyed = true
    tween?.remove()
    tween = null
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, destroy)
    scene.events.off(Phaser.Scenes.Events.DESTROY, destroy)
    container.destroy()
  }
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, destroy)
  scene.events.once(Phaser.Scenes.Events.DESTROY, destroy)
  play('idle')
  return { container, nameTag, setState, setFacing: (direction) => motion.setScale(scale * direction, scale), destroy }
}
