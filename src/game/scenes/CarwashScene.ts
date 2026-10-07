import Phaser from 'phaser'
import { ServiceJobScene } from './ServiceJobScene'
import { getPhaserAvatarData } from '../avatar/avatarData'
import { CARWASH_CONFIG as CONFIG, distanceToScrubPath, getCleanliness } from '../config/carwashConfig'
import { getFastBonus } from '../config/serviceJobConfig'
import { playAudioCue } from '../../services/audioFeedback'
import type { GameResult } from '../../types/game'
import type { Job } from '../../types/job'
import { getSceneFx } from '../visual/feedbackFx'
import { reducedMotion, VISUAL_LIMITS } from '../visual/sceneTheme'

export class CarwashScene extends ServiceJobScene {
  private dirt: number[] = []
  private dirtShapes: Phaser.GameObjects.Graphics[] = []
  private cleanText!: Phaser.GameObjects.Text
  private cleanFill!: Phaser.GameObjects.Rectangle
  private carBody!: Phaser.GameObjects.Rectangle
  private bodyPaint!: Phaser.GameObjects.Graphics
  private scrubbing = false
  private previousPoint = { x: 0, y: 0 }
  private currentPoint = { x: 0, y: 0 }
  private vehicleIndex = 0
  private foamAt = 0
  private shine!: Phaser.GameObjects.Graphics

  constructor(job: Job, onComplete: (result: GameResult) => void, avatarData = getPhaserAvatarData()) {
    super(job, onComplete, avatarData, 0x168e98)
  }

  protected createPlayArea(): void {
    this.cleanText = this.text(180, 119, 'ĐỘ SẠCH: 0%', 21)
    this.add.rectangle(180, 156, 280, 18, 0xc0d5d5)
    this.cleanFill = this.add.rectangle(40, 156, 280, 18, 0x168e98).setOrigin(0, 0.5).setScale(0, 1)
    this.text(180, 181, 'ĐẠT 90% → TỰ GIAO XE', 11)
    const body = this.add.graphics()
    body.fillStyle(0x314a5e, 0.16).fillEllipse(184, 417, 290, 22)
    body.fillStyle(0x354354).fillCircle(112, 392, 24).fillCircle(255, 392, 24)
    body.fillStyle(0x9badb9).fillCircle(112, 392, 12).fillCircle(255, 392, 12)
    body.fillStyle(0xe0e9e9).fillCircle(112, 392, 5).fillCircle(255, 392, 5)
    // Rounded art surrounds the same dirt coordinates and original scrub area.
    this.carBody = this.add.rectangle(184, 347, 252, 62, 0x4b9fc4)
    body.lineStyle(2, 0x527f98).strokeRoundedRect(52, 308, 264, 72, 18)
    body.fillStyle(0x93c8d5).fillRoundedRect(81, 249, 197, 72, { tl: 28, tr: 28, bl: 5, br: 5 })
    body.lineStyle(3, 0x426f84).strokeRoundedRect(81, 249, 197, 72, { tl: 28, tr: 28, bl: 5, br: 5 })
    body.fillStyle(0xffffff, 0.5).fillTriangle(92, 257, 147, 257, 92, 304)
    body.lineStyle(4, 0x426f84).lineBetween(181, 250, 181, 319)
    body.lineStyle(2, 0x25586c, 0.45).lineBetween(181, 325, 181, 376)
    body.fillStyle(0xffedae).fillRoundedRect(295, 336, 14, 18, 5)
    body.fillStyle(0xef9b88).fillRoundedRect(57, 340, 8, 15, 3)
    body.fillStyle(0xe0e9e9).fillRoundedRect(236, 327, 18, 4, 2).fillRoundedRect(302, 366, 16, 7, 3)
    this.carBody.setAlpha(0)
    this.bodyPaint = this.add.graphics().setDepth(-1)
    this.shine = this.add.graphics().setDepth(4).setVisible(false)
    this.shine.fillStyle(0xffffff, 0.5).fillTriangle(0, -60, 20, -60, 35, 20).fillTriangle(0, -60, 35, 20, 15, 20)
    CONFIG.dirtSpots.forEach(({ x, y }, index) => {
      const dirt = this.add.graphics().setPosition(x, y).setAlpha(0.86)
      dirt.fillStyle(0x86795e).fillEllipse(0, 0, 38, 29).fillCircle(-11, -7, 12).fillCircle(9, 8, 11)
      dirt.fillStyle(0x655f49, 0.35).fillEllipse(-3, 0, 20, 12).fillCircle(12, -6, 4)
      dirt.setAngle(index * 29)
      this.dirtShapes.push(dirt)
    })
    this.text(180, 525, 'GIỮ & KÉO ĐỂ CHÀ SẠCH', 17)
    this.text(180, 562, 'Chà các vết bẩn trên xe\nCàng nhanh, thưởng càng nhiều!', 14)
    this.input.on('pointerdown', this.beginScrub, this)
    this.input.on('pointerup', this.stopScrub, this)
    this.input.on('gameout', this.stopScrub, this)
  }

  protected startRound(): void {
    this.scrubbing = false
    this.dirt = CONFIG.dirtSpots.map(() => 1)
    this.dirtShapes.forEach((shape) => shape.setAlpha(0.86).setVisible(true))
    this.carBody.setFillStyle([0x4b9fc4, 0xea9761, 0x83b178][this.vehicleIndex++ % 3])
    this.bodyPaint.clear().fillStyle(this.carBody.fillColor).fillRoundedRect(52, 308, 264, 72, 18)
    this.bodyPaint.fillStyle(0xffffff, 0.2).fillRoundedRect(62, 315, 242, 7, 4)
    this.bodyPaint.fillStyle(0x285564, 0.14).fillRoundedRect(58, 366, 252, 12, 6)
    this.cleanFill.setScale(0, 1)
    this.cleanText.setText('ĐỘ SẠCH: 0%')
    this.beginRound(CONFIG.vehicleSeconds)
  }

  update(time: number, delta: number): void {
    super.update(time, delta)
    if (!this.roundActive || this.hasFinished || !this.scrubbing) return
    const pointer = this.input.activePointer
    if (!pointer.isDown) { this.stopScrub(); return }
    this.currentPoint.x = pointer.worldX
    this.currentPoint.y = pointer.worldY
    if (time - this.foamAt >= VISUAL_LIMITS.foamIntervalMs) {
      this.foamAt = time
      getSceneFx(this).burst(this.currentPoint.x, this.currentPoint.y, 0xefffff, 'water')
    }
    const amount = CONFIG.scrubPerSecond * Math.min(delta, CONFIG.maximumFrameMs) / 1000
    for (let index = 0; index < this.dirt.length; index++) {
      if (this.dirt[index] > 0 && distanceToScrubPath(CONFIG.dirtSpots[index], this.previousPoint, this.currentPoint) <= CONFIG.scrubRadius) {
        this.dirt[index] = Math.max(0, this.dirt[index] - amount)
        this.dirtShapes[index].setAlpha(this.dirt[index] * 0.86)
      }
    }
    this.previousPoint.x = this.currentPoint.x
    this.previousPoint.y = this.currentPoint.y
    const cleanliness = getCleanliness(this.dirt)
    this.cleanFill.setScale(cleanliness, 1)
    this.cleanText.setText(`ĐỘ SẠCH: ${Math.floor(cleanliness * 100)}%`)
    if (cleanliness >= CONFIG.targetCleanliness) this.completeVehicle()
  }

  private beginScrub(pointer: Phaser.Input.Pointer): void {
    if (!this.roundActive || this.hasFinished || pointer.worldY < 235 || pointer.worldY > 414) return
    this.previousPoint.x = pointer.worldX
    this.previousPoint.y = pointer.worldY
    this.scrubbing = true
    this.avatar.setState('work')
    playAudioCue('click')
  }

  private stopScrub(): void {
    this.scrubbing = false
    this.avatar.setState('idle')
  }

  private completeVehicle(): void {
    const bonus = getFastBonus(this.roundRemainingMs, this.roundTotalMs, CONFIG.maximumFastBonus)
    this.completedCustomers++
    getSceneFx(this).burst(245, 285, 0xf9ffff)
    if (!reducedMotion()) {
      this.tweens.killTweensOf(this.shine)
      this.shine.setPosition(85, 330).setAlpha(0.65).setVisible(true)
      this.tweens.add({ targets: this.shine, x: 275, alpha: 0, duration: 300, onComplete: () => this.shine.setVisible(false) })
    }
    this.stopScrub()
    this.award(CONFIG.completed + bonus, `+100 XE SẠCH! +${bonus} NHANH TAY`, true)
    this.nextRound(CONFIG.nextVehicleMs)
  }

  protected onRoundTimeout(): void {
    this.stopScrub()
    this.award(CONFIG.timeout, '-20 KHÁCH LẤY XE VỀ!', false)
    this.nextRound(CONFIG.nextVehicleMs)
  }
  protected resultMetadata() { return { vehiclesWashed: this.completedCustomers } }
  protected cleanupExtras(): void {
    this.scrubbing = false
    this.input.off('pointerdown', this.beginScrub, this)
    this.input.off('pointerup', this.stopScrub, this)
    this.input.off('gameout', this.stopScrub, this)
  }
}
