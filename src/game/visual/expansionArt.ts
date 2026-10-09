import Phaser from 'phaser'
import { panel } from './environment'

export function counter(scene: Phaser.Scene, label: string, accent: number): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setDepth(-2)
  g.fillStyle(0x51443d, 0.15).fillEllipse(192, 442, 305, 23)
  g.fillStyle(0xc49a6c).fillRoundedRect(71, 378, 267, 84, 12)
  g.fillStyle(0xe8c48f).fillRoundedRect(67, 366, 275, 22, 7)
  g.lineStyle(2, 0xf9dfb3).lineBetween(87, 397, 317, 397).lineBetween(87, 432, 317, 432)
  g.fillStyle(accent).fillRoundedRect(82, 227, 247, 18, 7)
  g.fillStyle(0xffffff, 0.5).fillRoundedRect(88, 232, 235, 4, 2)
  scene.add.text(205, 230, label, { fontFamily: 'Arial', fontSize: '11px', fontStyle: 'bold', color: '#fff9e8' }).setOrigin(0.5).setDepth(2)
  return g
}
export function sandwichArt(g: Phaser.GameObjects.Graphics, ingredients: Readonly<Record<string, boolean>>): void {
  g.clear().fillStyle(0x886447, 0.15).fillEllipse(0, 30, 162, 24)
  g.fillStyle(0xe5ab5c).fillRoundedRect(-78, -23, 156, 57, 24)
  g.fillStyle(0xffd48b).fillRoundedRect(-73, -21, 146, 24, 14)
  g.fillStyle(0x855f43).fillRoundedRect(-69, -2, 138, 15, 7)
  if (ingredients.pate) g.fillStyle(0xa77a67).fillRoundedRect(-67, 0, 133, 12, 6)
  if (ingredients.vegetables) for (let x = -62; x < 66; x += 21) g.fillStyle(0x7dad61).fillEllipse(x, 7, 25, 14)
  if (ingredients.meat) for (let x = -52; x < 65; x += 30) g.fillStyle(0xcc8b71).fillRoundedRect(x, -4, 23, 14, 4)
  if (ingredients.egg) for (const x of [-25, 30]) { g.fillStyle(0xfff4d6).fillEllipse(x, -6, 35, 20); g.fillStyle(0xf2c14f).fillCircle(x, -6, 7) }
  if (ingredients.chili) for (const x of [-46, 5, 54]) g.fillStyle(0xd8584e).fillCircle(x, 3, 5)
  g.fillStyle(0xf0bf76).fillRoundedRect(-73, -34, 146, 21, 10)
  g.lineStyle(3, 0xffdf9f).lineBetween(-47, -28, -34, -19).lineBetween(-8, -28, 6, -19).lineBetween(31, -28, 44, -19)
}
export function motorbikeArt(g: Phaser.GameObjects.Graphics, color = 0x79aaa5): void {
  g.clear().fillStyle(0x36505b).fillCircle(-46, 28, 20).fillCircle(48, 28, 20)
  g.fillStyle(0xb6c8cc).fillCircle(-46, 28, 11).fillCircle(48, 28, 11)
  g.fillStyle(color).fillRoundedRect(-58, -7, 83, 28, 12).fillTriangle(13, 23, 46, -43, 54, 23)
  g.fillStyle(0x596870).fillRoundedRect(-43, -20, 59, 10, 4)
  g.lineStyle(5, 0x76868a).lineBetween(45, -40, 56, -50).lineBetween(46, -50, 63, -50)
  g.fillStyle(0xffe7a0).fillRoundedRect(48, -34, 13, 13, 4)
}
export function crateArt(g: Phaser.GameObjects.Graphics, symbol: number): void {
  g.clear().fillStyle(0x56493c, 0.12).fillEllipse(3, 36, 78, 14)
  g.fillStyle(0xc79868).fillRoundedRect(-38, -33, 76, 64, 8)
  g.fillStyle(0xe3be87).fillTriangle(-38, -33, 38, -33, 0, -49)
  g.lineStyle(2, 0x957355).strokeRoundedRect(-38, -33, 76, 64, 8).lineBetween(-25, -24, -25, 26).lineBetween(26, -24, 26, 26)
  g.fillStyle(0xfff4d5).fillRoundedRect(-18, -19, 36, 35, 5)
  g.fillStyle(symbol).fillCircle(0, -2, 12)
  g.fillStyle(0xffffff, 0.7).fillCircle(-4, -6, 3)
}
export function flowerArt(g: Phaser.GameObjects.Graphics, color: number): void {
  g.clear().lineStyle(4, 0x72925e).lineBetween(0, 2, 0, 33)
  g.fillStyle(0x93b775).fillEllipse(-8, 21, 17, 7).fillEllipse(8, 13, 16, 7)
  for (let i = 0; i < 6; i++) g.fillStyle(color).fillCircle(Math.cos(i * Math.PI / 3) * 10, Math.sin(i * Math.PI / 3) * 10 - 8, 9)
  g.fillStyle(0xffe19a).fillCircle(0, -8, 7)
}
export function fruitArt(g: Phaser.GameObjects.Graphics, color: number, hazard = false): void {
  g.clear()
  if (hazard) {
    g.fillStyle(0xe5efea, 0.8).fillEllipse(-11, -11, 20, 12).fillEllipse(11, -11, 20, 12)
    g.fillStyle(0xf3cd73).fillEllipse(0, 1, 38, 22)
    g.fillStyle(0x665b53).fillRect(-9, -10, 5, 21).fillRect(5, -10, 5, 21)
    g.fillStyle(0x665b53).fillCircle(21, 0, 6)
    g.lineStyle(3, 0xd27763).lineBetween(-19, 24, 19, -24).lineBetween(-19, -24, 19, 24)
  } else {
    g.fillStyle(0x594938, 0.13).fillEllipse(1, 27, 43, 12)
    g.fillStyle(color).fillEllipse(0, 0, 40, 51)
    g.fillStyle(0xffffff, 0.3).fillEllipse(-7, -7, 10, 23)
    g.lineStyle(3, 0x8a7456).lineBetween(0, -27, 3, -36)
    g.fillStyle(0x79a270).fillEllipse(11, -29, 23, 10)
  }
}
export function orderPanel(scene: Phaser.Scene, title: string): void {
  panel(scene, 180, 139, 334, 103)
  scene.add.text(180, 100, title, { fontFamily: 'Arial', fontSize: '11px', fontStyle: 'bold', color: '#8a7a67' }).setOrigin(0.5)
}

