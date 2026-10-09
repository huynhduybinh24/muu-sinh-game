import Phaser from 'phaser'
import { getShopItem } from '../../data/shop'
import type { LifestyleState } from '../../types/shop'

export function drawEquipment(g: Phaser.GameObjects.Graphics, life: LifestyleState | undefined, back = false, riding = false, skin = 0xeebe93): void {
  if (!life) return
  const item = (slot: keyof LifestyleState['equipment']) => { const id = life.equipment[slot]; return id ? getShopItem(id) : undefined }
  const color = (hex?: string) => Number.parseInt((hex ?? '#819b99').slice(1), 16)
  const bag = item('back')
  if (back) { if (bag) g.fillStyle(color(bag.color)).fillRoundedRect(-33, -70, 66, 43, 12).lineStyle(2, 0x425f64).strokeRoundedRect(-33, -70, 66, 43, 12); return }
  const shoes = item('shoes'), hat = item('hat'), face = item('face'), hand = item('hand')
  if (shoes) {
    const y = riding ? -16 : -5
    g.fillStyle(shoes.style === 'sandal' ? skin : color(shoes.color)).fillRoundedRect(-24, y, 22, 9, 4).fillRoundedRect(2, y, 22, 9, 4)
    if (shoes.style === 'boot') g.fillRect(-20,y-9,17,13).fillRect(3,y-9,17,13)
    if (shoes.style === 'sandal') g.lineStyle(3,color(shoes.color)).lineBetween(-23,y+3,-3,y+3).lineBetween(3,y+3,23,y+3)
    g.lineStyle(2, 0xffefd1).lineBetween(-22, y+7, -3, y+7).lineBetween(3, y+7, 22, y+7)
  }
  if (hat) {
    g.fillStyle(color(hat.color)).fillEllipse(0, -124, 63, 37)
    g.fillRoundedRect(hat.style === 'bucket' ? -37 : -31, -117, hat.style === 'bucket' ? 75 : hat.style === 'beanie' ? 62 : 69, 8, 3)
    if (hat.style === 'beanie') g.fillCircle(0,-148,8).lineStyle(1.5,0xf5e2c6).lineBetween(-20,-115,-20,-110).lineBetween(-6,-115,-6,-110).lineBetween(8,-115,8,-110).lineBetween(22,-115,22,-110)
    if (hat.style === 'helmet') g.lineStyle(2, color(hat.color)).lineBetween(-26, -114, -23, -91).lineBetween(26, -114, 23, -91)
  }
  if (face) {
    g.lineStyle(2, color(face.color)).strokeRoundedRect(-23, -103, 18, 14, 4).strokeRoundedRect(5, -103, 18, 14, 4).lineBetween(-5, -98, 5, -98)
    if (face.style === 'sunglasses') g.fillStyle(color(face.color), .8).fillRoundedRect(-23, -103, 18, 14, 4).fillRoundedRect(5, -103, 18, 14, 4)
  }
  if (hand) {
    g.fillStyle(color(hand.color)).lineStyle(1.5, 0x425f64)
    if (hand.style === 'watch' || hand.style === 'bracelet') g.fillRoundedRect(-33, -34, 13, hand.style === 'bracelet' ? 3 : 6, 2)
    else if (hand.style === 'gloves') g.fillEllipse(-27,-28,15,15).fillEllipse(27,-28,15,15)
    else if (hand.style === 'camera') g.fillRoundedRect(23, -41, 28, 20, 4).fillStyle(0xcde0d3).fillCircle(38, -31, 7)
    else if (hand.style === 'thermos') g.fillRoundedRect(27, -43, 15, 28, 5).strokeRoundedRect(27, -43, 15, 28, 5)
    else if (hand.style === 'umbrella') g.fillTriangle(17, -54, 51, -54, 34, -71).lineBetween(34, -54, 34, -23)
    else if (hand.style === 'apron') g.fillRoundedRect(-18, -56, 36, 27, 3).fillStyle(0xf8e7c2).fillRect(-9, -47, 18, 9)
    else g.fillRoundedRect(22, -34, 27, 22, 4).strokeRoundedRect(22, -34, 27, 22, 4).lineBetween(29, -34, 41, -34)
  }
}
