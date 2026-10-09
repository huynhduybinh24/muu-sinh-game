import Phaser from 'phaser'
import type { PhaserAvatarData } from './avatarData'
import { drawEquipment } from './drawEquipment'
import { compatibleVehicle } from '../../services/lifestyle'

const OUTLINE = 0x353044
const SHOES = 0x36394f

function drawHair(graphics: Phaser.GameObjects.Graphics, data: PhaserAvatarData, back: boolean): void {
  const { hairId } = data.appearance
  graphics.fillStyle(data.colors.hair)
  if (back) {
    if (hairId === 'long' || hairId === 'bob') {
      graphics.fillRoundedRect(-32, -123, 64, hairId === 'long' ? 94 : 70, 23)
    }
    if (hairId === 'bun') graphics.fillCircle(0, -137, 13)
    return
  }
  graphics.fillEllipse(0, -119, 59, 28)
  if (hairId === 'swoop' || hairId === 'wave') graphics.fillTriangle(-27, -119, 26, -119, -17, -96)
  if (hairId === 'braid') for (let i = 0; i < 5; i++) graphics.fillCircle(28, -111 + i * 9, 7)
  if (hairId === 'crop') graphics.fillRect(-26, -118, 52, 12)
  if (hairId === 'bob' || hairId === 'long') {
    graphics.fillRoundedRect(-32, -115, 10, hairId === 'long' ? 52 : 34, 5)
    graphics.fillRoundedRect(22, -115, 10, hairId === 'long' ? 52 : 34, 5)
    graphics.fillTriangle(-24, -118, 21, -118, -12, -103)
  }
  if (hairId === 'bun') graphics.fillTriangle(-27, -116, 0, -122, -24, -101)
  if (hairId === 'curls') {
    for (let index = 0; index < 6; index++) {
      graphics.fillCircle(-25 + index * 10, -120 + (index % 2) * 7, 10)
    }
  }
}

export function drawAvatar(graphics: Phaser.GameObjects.Graphics, data: PhaserAvatarData, riding: boolean): void {
  const { skin, shirt, pants } = data.colors
  drawEquipment(graphics, data.lifestyle, true, riding)
  drawHair(graphics, data, true)
  graphics.fillStyle(pants)
  graphics.lineStyle(1.5, OUTLINE, 0.45)
  if (riding) {
    graphics.fillRoundedRect(-20, -40, 16, 24, 6)
    graphics.fillRoundedRect(4, -40, 16, 24, 6)
  } else {
    graphics.fillRoundedRect(-20, -39, 17, 34, 5)
    graphics.fillRoundedRect(3, -39, 17, 34, 5)
    graphics.strokeRoundedRect(-20, -39, 17, 34, 5).strokeRoundedRect(3, -39, 17, 34, 5)
  }
  graphics.fillStyle(SHOES)
  if (!riding && data.appearance.pantsId === 'shorts') graphics.fillStyle(skin).fillRect(-20, -20, 17, 15).fillRect(3, -20, 17, 15).fillStyle(SHOES)
  const feetY = riding ? -16 : -5
  graphics.fillRoundedRect(-24, feetY, 22, 9, 4)
  graphics.fillRoundedRect(2, feetY, 22, 9, 4)
  graphics.fillStyle(skin)
  graphics.fillRoundedRect(-33, -64, 13, 37, 6)
  graphics.fillRoundedRect(20, -64, 13, 37, 6)
  graphics.lineStyle(1.5, OUTLINE, 0.3).strokeRoundedRect(-33, -64, 13, 37, 6).strokeRoundedRect(20, -64, 13, 37, 6)
  graphics.fillRect(-8, -79, 16, 15)
  graphics.fillStyle(shirt).lineStyle(1.5, OUTLINE, 0.45)
  graphics.fillRoundedRect(-24, -70, 48, 37, 9)
  graphics.strokeRoundedRect(-24, -70, 48, 37, 9)
  graphics.fillStyle(0xffffff, 0.2).fillRoundedRect(-21, -68, 42, 6, 3)
  graphics.fillStyle(OUTLINE, 0.12).fillRoundedRect(-23, -39, 46, 6, 3)
  graphics.lineStyle(1.5, 0xffffff, 0.3).lineBetween(-20, -45, -20, -57)
  if (data.appearance.gender === 'female') graphics.fillTriangle(-24, -34, 24, -34, 0, -53)
  graphics.fillStyle(0xffffff, 0.65).fillTriangle(-12, -60, -4, -60, -8, -51)
  if (['polo', 'linen', 'blazer'].includes(data.appearance.shirtId)) graphics.fillStyle(0xf5ecd7).fillTriangle(-13, -70, 0, -63, -7, -57).fillTriangle(13, -70, 0, -63, 7, -57).lineStyle(1.5, OUTLINE).lineBetween(0, -60, 0, -34)
  if (['hoodie', 'denim-jacket', 'raincoat'].includes(data.appearance.shirtId)) graphics.lineStyle(2, 0xf5ecd7).lineBetween(0, -63, 0, -34).lineBetween(-13, -43, 13, -43)
  graphics.fillStyle(skin)
  graphics.fillCircle(-28, -95, 6)
  graphics.fillCircle(28, -95, 6)
  graphics.fillEllipse(0, -97, 56, 59)
  graphics.lineStyle(1.5, OUTLINE, 0.35).strokeEllipse(0, -97, 56, 59)
  drawHair(graphics, data, false)
  graphics.lineStyle(2, 0xffffff, 0.16).lineBetween(-16, -124, 5, -126)
  graphics.fillStyle(OUTLINE)
  graphics.lineStyle(2, data.colors.hair, 0.65).lineBetween(-14, -105, -6, -106).lineBetween(6, -106, 14, -105)
  graphics.fillEllipse(-10, -96, 5, 7)
  graphics.fillEllipse(10, -96, 5, 7)
  graphics.fillStyle(0xffffff).fillCircle(-9, -98, 1).fillCircle(11, -98, 1)
  graphics.lineStyle(1.5, 0xa36e58, 0.5).lineBetween(0, -92, -2, -87).lineBetween(-2, -87, 2, -87)
  graphics.fillStyle(0xe57e79, 0.4).fillEllipse(-18, -85, 9, 5).fillEllipse(18, -85, 9, 5)
  graphics.lineStyle(2, OUTLINE, 0.7)
  graphics.beginPath().moveTo(-7, -80).lineTo(0, -77).lineTo(7, -80).strokePath()
  if (data.appearance.gender === 'female') {
    graphics.lineBetween(-13, -99, -16, -102).lineBetween(13, -99, 16, -102)
  }
  drawEquipment(graphics, data.lifestyle, false, riding, skin)
}

export function drawScooter(graphics: Phaser.GameObjects.Graphics, data?: PhaserAvatarData): void {
  const selected = data ? compatibleVehicle(data, 'shipper') : undefined
  const vehicleColor = selected?.color ? Number.parseInt(selected.color.slice(1), 16) : 0xf5c64c
  graphics.fillStyle(OUTLINE)
  graphics.fillCircle(-28, -3, 11).fillCircle(30, -3, 11)
  graphics.fillStyle(0xb4c5d6).fillCircle(-28, -3, 5).fillCircle(30, -3, 5)
  graphics.fillStyle(vehicleColor).lineStyle(2, OUTLINE)
  graphics.fillRoundedRect(-40, -26, 59, 19, 8).strokeRoundedRect(-40, -26, 59, 19, 8)
  graphics.fillRoundedRect(21, -41, 15, 33, 5).strokeRoundedRect(21, -41, 15, 33, 5)
  graphics.fillStyle(OUTLINE).fillRoundedRect(-22, -34, 35, 7, 3)
  graphics.lineStyle(4, OUTLINE).lineBetween(22, -43, 36, -43)
  graphics.fillStyle(0xfff8de).fillCircle(32, -33, 4)
  graphics.lineStyle(2, 0xffffff, 0.45).lineBetween(-33, -22, 9, -22)
  graphics.fillStyle(0xe8a25d).fillRoundedRect(-51, -46, 24, 20, 4)
  graphics.lineStyle(2, 0x865c48).lineBetween(-39, -46, -39, -27)
  graphics.lineStyle(1.5, 0xffffff, 0.7).lineBetween(39, -22, 48, -22).lineBetween(39, -12, 46, -12)
}
