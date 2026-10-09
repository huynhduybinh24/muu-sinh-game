import Phaser from 'phaser'
import { TimedJobScene } from './TimedJobScene'
import { CLEANING_CONFIG as C, litterSpots, sweepHazards, sweepDistance, cleaningPoints, cleaningDifficulty, type SweepPoint } from '../config/cleaningConfig'
import { getPhaserAvatarData } from '../avatar/avatarData'
import { orderPanel } from '../visual/expansionArt'
import { getSceneFx } from '../visual/feedbackFx'
import type { Job } from '../../types/job'
import type { GameResult } from '../../types/game'

export class CleaningScene extends TimedJobScene {
  private sections = 0
  private collected = 0
  private mistakes = 0
  private elapsed = 0
  private hazardAt = -1000
  private remaining = 0
  private active = true
  private count = 8
  private pointerId: number | null = null
  private previous: SweepPoint = { x: 0, y: 0 }
  private litter: Phaser.GameObjects.Graphics[] = []
  private hazards: Phaser.GameObjects.Graphics[] = []
  private broom!: Phaser.GameObjects.Graphics
  private status!: Phaser.GameObjects.Text
  constructor(job: Job, complete: (result: GameResult) => void, avatar = getPhaserAvatarData()) { super(job, complete, avatar) }
  protected createPlayArea(): void {
    this.avatar.container.setPosition(46, 532)
    orderPanel(this, 'QUÉT RÁC · TRÁNH MIỆNG CỐNG')
    this.status = this.text(180, 141, '', 20)
    const street = this.add.graphics().setDepth(-1)
    street.fillStyle(0xbac2b7).fillRoundedRect(26, 208, 312, 241, 18)
    street.lineStyle(2, 0xe5e8cf).lineBetween(37, 229, 326, 229).lineBetween(38, 439, 325, 439)
    street.fillStyle(0x689187).fillRoundedRect(286, 554, 49, 61, 8)
    street.fillStyle(0x91bba0).fillRoundedRect(281, 547, 59, 12, 4)
    this.text(180, 576, 'Giữ và quét qua rác', 18); this.text(180, 613, 'Lá · Giấy · Chai  |  Cống: -10', 13)
    this.litter = litterSpots.map(({x,y}, i) => {
      const g = this.add.graphics().setPosition(x, y).setDepth(4).setName(`litter-${i}`)
      if (i % 3 === 0) { g.fillStyle(0xc59b64).fillEllipse(0, 0, 30, 15); g.lineStyle(2, 0x877358).lineBetween(-13, 0, 13, 0) }
      else if (i % 3 === 1) { g.fillStyle(0xfff2d4).fillRoundedRect(-12, -12, 26, 26, 4); g.lineStyle(2, 0xc2af8c).lineBetween(-8, -3, 7, -3).lineBetween(-8, 4, 7, 4) }
      else { g.fillStyle(0x8fbcb7).fillRoundedRect(-8, -15, 17, 30, 5).fillRect(-4, -21, 9, 9); g.fillStyle(0xe0efe2).fillRect(-7, -5, 15, 12) }
      return g
    })
    this.hazards = sweepHazards.map(({x,y}) => {
      const g = this.add.graphics().setPosition(x,y)
      g.fillStyle(0x727d77).fillEllipse(0, 0, 45, 36).lineStyle(3, 0xe6c68e)
      for (let i = -12; i <= 12; i += 8) g.lineBetween(i, -12, i, 12)
      return g
    })
    this.broom = this.add.graphics().setDepth(6).setVisible(false)
    this.broom.lineStyle(6, 0xb8976c).lineBetween(0, -42, 0, 0).fillStyle(0xe1ba73).fillTriangle(0, -4, -22, 18, 22, 18)
    this.input.on('pointerdown', this.beginSweep, this); this.input.on('pointermove', this.sweep, this)
    this.input.on('pointerup', this.interrupt, this); this.input.on('pointerupoutside', this.interrupt, this)
    this.input.on('gameout', this.interrupt, this); this.input.on('nativepause', this.interrupt, this)
    this.startSection()
  }
  private startSection(): void {
    const difficulty = cleaningDifficulty(this.sections)
    this.active = true; this.mistakes = 0; this.count = difficulty.count; this.remaining = difficulty.seconds * 1000
    this.litter.forEach((item, i) => item.setVisible(i < this.count))
    this.hazards[1].setVisible(this.sections >= 3); this.refreshStatus()
  }
  private refreshStatus(): void { this.status.setText(`Sạch ${this.count - this.litter.filter(item => item.visible).length} / ${this.count}`) }
  private beginSweep(pointer: Phaser.Input.Pointer): void {
    if (!this.active || this.pointerId !== null || pointer.worldY < 210 || pointer.worldY > 450) return
    this.pointerId = pointer.id; this.previous.x = pointer.worldX; this.previous.y = pointer.worldY
    this.avatar.setState('work'); this.sweep(pointer)
  }
  private sweep(pointer: Phaser.Input.Pointer): void {
    if (!this.active || pointer.id !== this.pointerId || !pointer.isDown) return
    const current = pointer
    this.broom.setPosition(current.worldX, current.worldY).setVisible(true)
    const end = { x: current.worldX, y: current.worldY }
    let touched = false
    for (let i = 0; i < this.count; i++) if (this.litter[i].visible && sweepDistance(litterSpots[i], this.previous, end) <= C.radius) {
      this.litter[i].setVisible(false); this.collected++; touched = true
    }
    if (touched) { this.refreshStatus(); getSceneFx(this).burst(end.x, end.y, 0xd9c58a, 'dust') }
    if (this.elapsed - this.hazardAt >= C.hazardCooldownMs && sweepHazards.some((point, i) => this.hazards[i].visible && sweepDistance(point, this.previous, end) < C.hazardRadius)) {
      this.hazardAt = this.elapsed; this.mistakes++; this.award(C.mistake, '-10 NÉ CỐNG NHA!', false)
    }
    this.previous.x = end.x; this.previous.y = end.y
    if (!this.litter.some(item => item.visible)) {
      this.sections++; this.countText.setText(`✓ ${this.sections}`)
      this.award(cleaningPoints(this.mistakes), `+${cleaningPoints(this.mistakes)} ĐƯỜNG SẠCH!`, true); this.nextSection()
    }
  }
  private interrupt(): void { this.pointerId = null; this.broom.setVisible(false); if (!this.hasFinished) this.avatar.setState('idle') }
  private nextSection(): void { this.active = false; this.interrupt(); this.time.delayedCall(C.nextMs, () => { if (!this.hasFinished) this.startSection() }) }
  protected updatePlay(delta: number): void {
    this.elapsed += delta
    if (!this.active) return
    this.remaining -= delta
    if (this.remaining <= 0) { this.award(C.mistake, '-10 CÒN RÁC!', false); this.nextSection() }
  }
  protected metadata() { return { streetsCleaned: this.sections, trashCollected: this.collected } }
  protected cleanupInput(): void {
    this.pointerId = null
    this.input.off('pointerdown', this.beginSweep, this); this.input.off('pointermove', this.sweep, this)
    this.input.off('pointerup', this.interrupt, this); this.input.off('pointerupoutside', this.interrupt, this)
    this.input.off('gameout', this.interrupt, this); this.input.off('nativepause', this.interrupt, this)
  }
}

