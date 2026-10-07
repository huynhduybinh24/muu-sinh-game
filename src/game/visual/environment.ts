import Phaser from 'phaser'
import type { JobId } from '../../types/job'
import { reducedMotion, sceneThemes } from './sceneTheme'

export function panel(scene: Phaser.Scene, x: number, y: number, width: number, height: number,
  color = 0xfff9ed, depth = 0, radius = 18): Phaser.GameObjects.Graphics {
  const art = scene.add.graphics().setDepth(depth)
  art.fillStyle(0x313853, 0.13).fillRoundedRect(x - width / 2, y - height / 2 + 5, width, height, radius)
  art.fillStyle(color).fillRoundedRect(x - width / 2, y - height / 2, width, height, radius)
  art.lineStyle(1, 0xffffff, 0.55).strokeRoundedRect(x - width / 2 + 1, y - height / 2 + 1, width - 2, height - 2, radius)
  return art
}
export function hudPanel(scene: Phaser.Scene, job: JobId): void {
  const theme = sceneThemes[job]
  const art = panel(scene, 180, 40, 356, 78, theme.deep)
  art.fillStyle(theme.accent, 0.35).fillEllipse(306, 14, 154, 38)
  art.fillStyle(0xffffff, 0.07).fillRoundedRect(8, 44, 344, 30, 12)
}
export function decorateButton(scene: Phaser.Scene, shape: Phaser.GameObjects.Rectangle, color: number, dark = false): void {
  // Transparent Rectangle remains the exact original input hit area; only artwork changes.
  const art = panel(scene, 0, 0, shape.width, shape.height, color, 0, 14)
  const holder = scene.add.container(shape.x, shape.y, [art]).setDepth(shape.depth).setName('button-art')
  holder.setData('buttonFor', shape)
  shape.setFillStyle(color, 0).setStrokeStyle()
  if (dark) art.lineStyle(1, 0x21384b, 0.12).strokeRoundedRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height, 14)
  shape.on('pointerdown', () => {
    if (reducedMotion() || !scene.input.enabled) return
    scene.tweens.killTweensOf(holder)
    scene.tweens.add({ targets: holder, scale: 0.96, duration: 70, yoyo: true, ease: 'Sine.easeOut' })
  })
}
export function updateButtonArt(scene: Phaser.Scene, shape: Phaser.GameObjects.Rectangle, color: number): void {
  const holder = scene.children.list.find((object) => object.getData('buttonFor') === shape)
  if (holder instanceof Phaser.GameObjects.Container) {
    const art = holder.list[0]
    if (art instanceof Phaser.GameObjects.Graphics) {
      art.clear().fillStyle(0x313853, 0.14).fillRoundedRect(-shape.width / 2, -shape.height / 2 + 4, shape.width, shape.height, 14)
      art.fillStyle(color).fillRoundedRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height, 14)
      art.lineStyle(1, 0xffffff, 0.3).strokeRoundedRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height, 14)
    }
  }
}

function street(g: Phaser.GameObjects.Graphics, job: JobId): void {
  const theme = sceneThemes[job]
  for (let index = 0; index < 6; index++) {
    const x = index * 68 - 12
    const height = 70 + index % 3 * 24
    g.fillStyle(theme.far).fillRoundedRect(x, 255 - height, 58, height, 6)
    g.fillStyle(0xffffff, 0.5)
    for (let row = 0; row < 2; row++) for (let col = 0; col < 2; col++) g.fillRoundedRect(x + 10 + col * 23, 270 - height + row * 24, 13, 16, 2)
    g.fillStyle(theme.deep, 0.12).fillRect(x, 245, 58, 10)
  }
  g.fillStyle(theme.ground).fillRect(0, 250, 360, 400)
  g.fillStyle(theme.deep, 0.14).fillRect(0, 272, 360, 6)
  for (const x of [6, 340]) {
    g.fillStyle(0x807d64).fillRoundedRect(x + 8, 177, 7, 82, 3)
    g.fillStyle(0x789d76).fillCircle(x + 10, 163, 27)
    g.fillStyle(0xaacb92).fillCircle(x, 151, 21)
  }
}
function construction(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0xb0c6cd, 0.65).fillRect(234, 179, 118, 365)
  for (let y = 198; y < 520; y += 62) {
    g.fillStyle(0x8fa6b5, 0.6).fillRect(242, y, 102, 9)
    for (let x = 246; x < 347; x += 33) g.fillStyle(0xe3eef0, 0.6).fillRect(x, y + 12, 25, 42)
  }
  g.lineStyle(3, 0x74979b, 0.65)
  for (let x = 248; x < 355; x += 35) g.lineBetween(x, 173, x, 547)
  for (let y = 196; y < 535; y += 58) {
    g.lineBetween(235, y, 358, y).lineBetween(248, y, 283, y + 58)
  }
  g.lineStyle(4, 0xd3a452, 0.8).lineBetween(24, 163, 24, 559).lineBetween(10, 166, 156, 166)
  g.lineStyle(2, 0xba8f49, 0.65).lineBetween(24, 168, 66, 136).lineBetween(66, 136, 151, 168).lineBetween(142, 166, 142, 203)
  g.fillStyle(0xdfbf8f).fillRect(0, 563, 360, 87)
  g.fillStyle(0xaa8766, 0.25)
  for (let x = 4; x < 360; x += 29) g.fillEllipse(x, 606 + x % 3 * 10, 16, 3)
  for (const x of [36, 80, 52]) {
    g.fillStyle(0xb1a291).fillRoundedRect(x, x === 52 ? 605 : 621, 39, 19, 5)
    g.fillStyle(0xe9e1c7).fillRoundedRect(x, x === 52 ? 602 : 618, 39, 16, 5)
    g.lineStyle(1, 0xa69880).lineBetween(x + 6, x === 52 ? 610 : 626, x + 32, x === 52 ? 610 : 626)
  }
  g.fillStyle(0xe1a647).fillTriangle(260, 630, 271, 606, 282, 630)
  g.fillStyle(0xffffff).fillRect(264, 620, 14, 4)
}
function indoor(g: Phaser.GameObjects.Graphics, job: 'barber' | 'carwash'): void {
  const theme = sceneThemes[job]
  g.fillStyle(theme.far, 0.6).fillRect(0, 240, 360, 410)
  g.lineStyle(1, 0xffffff, 0.24)
  for (let x = -60; x < 420; x += 52) g.lineBetween(180 + (x - 180) * 0.35, 265, x, 650)
  for (let y = 284; y < 650; y += 44) g.lineBetween(0, y, 360, y)
  if (job === 'barber') {
    g.fillStyle(0x6e537f).fillRoundedRect(89, 233, 240, 221, 22)
    g.fillStyle(0xdde8ee).fillRoundedRect(97, 241, 224, 205, 17)
    g.fillStyle(0xffffff, 0.38).fillTriangle(98, 242, 204, 242, 98, 372)
    g.fillStyle(0xe8b981).fillRoundedRect(12, 266, 51, 90, 8)
    g.fillStyle(0xffffff).fillRoundedRect(19, 272, 37, 78, 6)
    for (let y = 279; y < 340; y += 19) {
      g.fillStyle(0xe07477).fillRect(19, y, 37, 6)
      g.fillStyle(0x70a8be).fillRect(19, y + 8, 37, 5)
    }
    g.fillStyle(0x705474).fillRoundedRect(143, 434, 85, 40, 12)
    g.fillStyle(0xd9cddd).fillRect(178, 470, 10, 26).fillEllipse(183, 499, 76, 13)
    g.fillStyle(0xffefd3).fillEllipse(180, 232, 116, 12)
  } else {
    g.fillStyle(0x458695).fillRoundedRect(8, 233, 344, 211, 18)
    g.fillStyle(0xc4e6e7).fillRoundedRect(18, 242, 324, 191, 10)
    g.fillStyle(0xffffff, 0.26).fillEllipse(184, 429, 270, 26)
    g.lineStyle(4, 0x4e929d).lineBetween(330, 457, 331, 271).lineBetween(330, 457, 287, 482)
    g.fillStyle(0x528fbd).fillRoundedRect(13, 464, 40, 31, 6)
    g.lineStyle(3, 0xdeebf0).strokeEllipse(33, 465, 33, 8)
    g.fillStyle(0xffffff, 0.2).fillEllipse(138, 466, 142, 8).fillEllipse(250, 485, 105, 6)
  }
}
export function createEnvironment(scene: Phaser.Scene, job: JobId): void {
  const theme = sceneThemes[job]
  scene.cameras.main.setBackgroundColor(theme.sky)
  const g = scene.add.graphics().setDepth(-10).setName('environment')
  g.fillGradientStyle(theme.sky, theme.sky, theme.light, theme.light, 1).fillRect(0, 84, 360, 566)
  g.fillStyle(0xffffff, 0.25).fillCircle(285, 122, 48)
  if (job === 'construction') construction(g)
  else if (job === 'barber' || job === 'carwash') indoor(g, job)
  else if (job !== 'shipper') street(g, job)
  if (job === 'sugarcane' || job === 'noodle') {
    g.fillStyle(theme.deep).fillRoundedRect(11, 230, 338, 237, 13)
    g.fillStyle(theme.ground).fillRoundedRect(18, 236, 324, 218, 10)
    g.fillStyle(theme.deep, 0.25).fillRect(18, 429, 324, 25)
    g.fillStyle(theme.deep).fillRect(18, 224, 7, 213).fillRect(335, 224, 7, 213)
    for (let x = 14; x < 347; x += 28) {
      g.fillStyle(x % 56 === 14 ? theme.accent : 0xfff3d7).fillRoundedRect(x, 219, 28, 23, { tl: 0, tr: 0, bl: 9, br: 9 })
    }
  }
  // One far cloud tween, not a per-frame parallax loop or growing object list.
  if (job === 'construction' && !reducedMotion()) {
    const cloud = scene.add.graphics().setDepth(-9)
    cloud.fillStyle(0xffffff, 0.5).fillEllipse(56, 132, 60, 14).fillEllipse(69, 125, 29, 20)
    scene.tweens.add({ targets: cloud, x: 22, duration: 6800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
  }
}

export function createCityMap(scene: Phaser.Scene): void {
  const g = scene.add.graphics()
  g.fillStyle(0xb6cbb9).fillRect(0, 84, 360, 450)
  g.fillStyle(0xedebd9).fillRoundedRect(99, 122, 162, 380, 12).fillRoundedRect(11, 240, 338, 136, 12)
  g.fillStyle(0x5c737e).fillRect(109, 126, 142, 366).fillRect(16, 251, 328, 116)
  g.fillStyle(0x455e6c, 0.25).fillRect(109, 126, 5, 366).fillRect(16, 251, 328, 5)
  g.fillStyle(0xeee2ac, 0.8)
  for (let y = 138; y < 481; y += 39) if (y < 256 || y > 350) g.fillRoundedRect(178, y, 4, 18, 2)
  for (let x = 28; x < 331; x += 42) if (x < 100 || x > 251) g.fillRoundedRect(x, 306, 19, 4, 2)
  g.fillStyle(0xe7ecdd, 0.75)
  for (let i = 0; i < 5; i++) {
    g.fillRect(117 + i * 26, 236, 17, 8).fillRect(117 + i * 26, 373, 17, 8)
    g.fillRect(94, 264 + i * 19, 8, 12).fillRect(258, 264 + i * 19, 8, 12)
  }
  for (const { x, y, color } of [{ x: 48, y: 173, color: 0x91bfc4 }, { x: 312, y: 174, color: 0xdca58b },
    { x: 49, y: 444, color: 0xdbb479 }, { x: 311, y: 444, color: 0xa5b598 }]) {
    g.fillStyle(0x3e5661, 0.18).fillRoundedRect(x - 33, y - 31, 74, 76, 8)
    g.fillStyle(color).fillRoundedRect(x - 35, y - 36, 70, 68, 7)
    g.fillStyle(0xffffff, 0.26).fillRoundedRect(x - 29, y - 32, 58, 7, 3)
    g.fillStyle(0x497480, 0.65).fillRoundedRect(x - 24, y - 16, 18, 15, 3).fillRoundedRect(x + 6, y - 16, 18, 15, 3)
    g.fillStyle(0xf9edc6).fillRoundedRect(x - 26, y + 15, 52, 18, 4)
    for (let i = 0; i < 5; i++) g.fillStyle(i % 2 ? 0xf7eee0 : 0x789c90).fillRect(x - 26 + i * 10.4, y + 11, 10.4, 7)
  }
  for (const { x, y } of [{ x: 32, y: 232 }, { x: 327, y: 229 }, { x: 34, y: 384 }, { x: 332, y: 384 }]) {
    g.fillStyle(0x39564e, 0.2).fillEllipse(x + 4, y + 6, 31, 19)
    g.fillStyle(0x699777).fillCircle(x, y, 15).fillStyle(0x95bb83).fillCircle(x - 4, y - 5, 9)
  }
}
