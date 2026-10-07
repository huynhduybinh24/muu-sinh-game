import Phaser from 'phaser'
import { reducedMotion, visualRandom } from './sceneTheme'

export interface CustomerVisual { container: Phaser.GameObjects.Container; next: () => void; react: (happy: boolean) => void; exit: () => void; colors: () => { skin: number; hair: number; shirt: number } }
export function createCustomer(scene: Phaser.Scene, x: number, y: number, scale = 1): CustomerVisual {
  const random = visualRandom(Math.floor(x * 77 + y))
  const container = scene.add.container(x, y).setScale(scale).setDepth(8).setName('customer')
  const shadow = scene.add.ellipse(0, 36, 53, 9, 0x28374e, 0.12)
  const g = scene.add.graphics()
  container.add([shadow, g])
  let skin = 0xeebc93
  let hair = 0x463633
  let shirt = 0x669e97
  let style = 0
  function draw(happy = true) {
    g.clear().fillStyle(shirt).fillRoundedRect(-27, 12, 54, 30, 14)
    g.fillStyle(0xffffff, 0.3).fillTriangle(-9, 14, 9, 14, 0, 26)
    g.fillStyle(skin).fillRoundedRect(-7, 5, 14, 15, 4).fillCircle(-22, -7, 6).fillCircle(22, -7, 6)
    g.fillEllipse(0, -8, 44, 49).lineStyle(1.5, 0x443c47, 0.4).strokeEllipse(0, -8, 44, 49)
    g.fillStyle(hair).fillEllipse(0, -28, 47, 22)
    if (style === 1) g.fillTriangle(-22, -26, 20, -25, -19, -5)
    if (style === 2) g.fillRoundedRect(-25, -26, 8, 38, 4).fillRoundedRect(17, -26, 8, 38, 4)
    if (style === 3) for (let i = 0; i < 5; i++) g.fillCircle(-19 + i * 9, -29, 8)
    g.fillStyle(0x343747).fillEllipse(-8, -7, 4, 6).fillEllipse(8, -7, 4, 6)
    g.fillStyle(0xffffff).fillCircle(-7, -9, 1).fillCircle(9, -9, 1)
    g.fillStyle(0xe5817d, 0.35).fillEllipse(-15, 2, 7, 4).fillEllipse(15, 2, 7, 4)
    g.lineStyle(2, 0x9a574e).beginPath().moveTo(-7, 6).lineTo(0, happy ? 10 : 3).lineTo(7, 6).strokePath()
  }
  const next = () => {
    skin = [0xf7d5b5, 0xe5af83, 0xbb7e57, 0x845741][Math.floor(random() * 4)]
    hair = [0x443233, 0x604733, 0x2d3443][Math.floor(random() * 3)]
    shirt = [0x669e97, 0xb88bbc, 0xe4ab61, 0x729db8][Math.floor(random() * 4)]
    style = Math.floor(random() * 4)
    draw()
    scene.tweens.killTweensOf(container)
    container.setAlpha(1).setPosition(x, y)
    if (!reducedMotion()) {
      container.setX(x - 12).setAlpha(0)
      scene.tweens.add({ targets: container, x, alpha: 1, duration: 180, ease: 'Sine.easeOut' })
    }
  }
  next()
  return { container, next, react: (happy) => {
    draw(happy)
    if (!reducedMotion()) scene.tweens.add({ targets: container, angle: happy ? 4 : -4, duration: 100, yoyo: true })
  }, exit: () => {
    if (!reducedMotion()) scene.tweens.add({ targets: container, x: x + 12, alpha: 0, duration: 240, delay: 90 })
  }, colors: () => ({ skin, hair, shirt }) }
}
