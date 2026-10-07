import Phaser from 'phaser'
import { reducedMotion, VISUAL_LIMITS, visualRandom } from './sceneTheme'

export interface SceneFx {
  burst: (x: number, y: number, color: number, kind?: 'spark' | 'dust' | 'water') => void
  flash: (success: boolean) => void
  shake: () => void
  pulse: (target: Phaser.GameObjects.Text | Phaser.GameObjects.Container) => void
  destroy: () => void
}
const systems = new WeakMap<Phaser.Scene, SceneFx>()
export function getSceneFx(scene: Phaser.Scene): SceneFx {
  const existing = systems.get(scene)
  if (existing) return existing
  const animate = !reducedMotion()
  const random = visualRandom(713)
  const dots = Array.from({ length: VISUAL_LIMITS.particles }, () => scene.add.circle(0, 0, 3, 0xffffff)
    .setDepth(28).setVisible(false).setName('visual-particle'))
  const flash = scene.add.rectangle(180, 283, 360, 398, 0xffffff, 0).setDepth(29).setName('visual-flash')
  let next = 0
  let destroyed = false
  const system: SceneFx = {
    burst: (x, y, color, kind = 'spark') => {
      if (!animate || destroyed) return
      for (let index = 0; index < VISUAL_LIMITS.burst; index++) {
        const dot = dots[next++ % dots.length]
        scene.tweens.killTweensOf(dot)
        const angle = random() * Math.PI * 2
        const distance = kind === 'water' ? 8 + random() * 17 : 13 + random() * 29
        dot.setPosition(x, y).setFillStyle(color).setVisible(true).setAlpha(kind === 'dust' ? 0.5 : 0.9).setScale(0.6 + random())
        scene.tweens.add({ targets: dot, x: x + Math.cos(angle) * distance,
          y: y + Math.sin(angle) * distance + (kind === 'dust' ? 9 : 0), alpha: 0, scale: 0.15,
          duration: 280 + random() * 160, ease: 'Quad.easeOut', onComplete: () => dot.setVisible(false) })
      }
    },
    flash: (success) => {
      if (!animate || destroyed) return
      scene.tweens.killTweensOf(flash)
      flash.setFillStyle(success ? 0xffe599 : 0xf17774).setAlpha(success ? 0.05 : 0.08)
      scene.tweens.add({ targets: flash, alpha: 0, duration: 170 })
    },
    shake: () => { if (animate && !destroyed) scene.cameras.main.shake(VISUAL_LIMITS.shakeMs, 0.0015) },
    pulse: (target) => {
      if (!animate || destroyed) return
      scene.tweens.killTweensOf(target)
      target.setScale(1)
      scene.tweens.add({ targets: target, scale: 1.08, duration: 110, yoyo: true, ease: 'Sine.easeOut' })
    },
    destroy: () => {
      if (destroyed) return
      destroyed = true
      for (const object of [...dots, flash]) { scene.tweens.killTweensOf(object); object.destroy() }
      systems.delete(scene)
      scene.events.off(Phaser.Scenes.Events.SHUTDOWN, system.destroy)
      scene.events.off(Phaser.Scenes.Events.DESTROY, system.destroy)
    },
  }
  systems.set(scene, system)
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, system.destroy)
  scene.events.once(Phaser.Scenes.Events.DESTROY, system.destroy)
  return system
}
