import Phaser from 'phaser'

/** Small original vector props, allocated once and reused by each scene. */
export function officeArt(scene: Phaser.Scene, accent: number): void {
  const g = scene.add.graphics().setDepth(-1)
  g.fillStyle(0xf8f2df).fillRoundedRect(18, 205, 324, 243, 16)
  g.fillStyle(0xc2dacd).fillRoundedRect(26, 215, 55, 122, 8)
  g.lineStyle(3, 0xfffaf0).lineBetween(52, 217, 52, 333).lineBetween(28, 270, 78, 270)
  g.fillStyle(0xcba97c).fillRoundedRect(26, 428, 309, 27, 7)
  g.fillStyle(0xa78766).fillRect(42, 452, 14, 44).fillRect(307, 452, 14, 44)
  g.fillStyle(accent).fillRoundedRect(277, 235, 41, 21, 5)
  g.fillStyle(0x8daa83).fillEllipse(315, 409, 31, 25).fillEllipse(309, 392, 25, 22)
  g.fillStyle(0xd8a483).fillRoundedRect(296, 415, 36, 24, 5)
}
export function vehicleArt(g: Phaser.GameObjects.Graphics, color: number, ambulance = false): void {
  g.clear().fillStyle(0x374e58, .17).fillRoundedRect(-19, -28, 43, 69, 8)
  g.fillStyle(0x425762).fillRoundedRect(-22, -20, 44, 10, 3).fillRoundedRect(-22, 19, 44, 10, 3)
  g.fillStyle(color).fillRoundedRect(-19, -34, 38, 73, 10)
  g.fillStyle(0xc6e1df).fillRoundedRect(-14, -21, 28, 16, 5).fillRoundedRect(-14, 19, 28, 10, 4)
  g.fillStyle(0xffedb1).fillRect(-15, -32, 9, 4).fillRect(6, -32, 9, 4)
  if (ambulance) g.fillStyle(0xdc8679).fillRect(-3, -1, 6, 15).fillRect(-8, 4, 16, 5)
  else g.fillStyle(0xf9eec4).fillRoundedRect(-12, 0, 24, 12, 3)
}
export function receiptArt(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0x6c8178, .13).fillRoundedRect(94, 224, 224, 183, 9)
  g.fillStyle(0xfffbea).fillRoundedRect(88, 216, 222, 184, 9)
  g.lineStyle(2, 0xd6cfb7)
  for (let y = 239; y < 397; y += 32) g.lineBetween(99, y, 299, y)
}
