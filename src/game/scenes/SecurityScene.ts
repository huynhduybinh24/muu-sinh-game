import Phaser from 'phaser'
import { TimedJobScene } from './TimedJobScene'
import { SECURITY_CONFIG as C, incidents, incidentNames, detectionPoints, securityDifficulty, type Incident } from '../config/securityConfig'
import { getPhaserAvatarData } from '../avatar/avatarData'
import { orderPanel, counter } from '../visual/expansionArt'
import { panel } from '../visual/environment'
import { createCustomer } from '../visual/customer'
import { getSceneFx } from '../visual/feedbackFx'
import { reducedMotion } from '../visual/sceneTheme'
import type { Job } from '../../types/job'
import type { GameResult } from '../../types/game'

export class SecurityScene extends TimedJobScene {
  private incident: Incident | null = null
  private pending: Incident = 'door'
  private wait = 0
  private remaining = 0
  private reaction = 0
  private handled = 0
  private detected = 0
  private display: Phaser.GameObjects.Graphics[] = []
  private hint!: Phaser.GameObjects.Text
  constructor(job: Job, complete: (result: GameResult) => void, avatar = getPhaserAvatarData()) { super(job, complete, avatar) }
  protected createPlayArea(): void {
    this.avatar.container.setPosition(180, 482)
    orderPanel(this, 'CHỈ TÌM DẤU HIỆU CỦA ĐỒ VẬT')
    this.hint = this.text(180, 139, 'Quan sát bốn ô camera', 19)
    this.text(180, 169, 'Không đánh giá ai qua ngoại hình', 12)
    counter(this, '', 0x687f98)
    this.text(180, 204, 'BÀN TRỰC AN TOÀN', 11)
    incidents.forEach((id, i) => {
      const x = 96 + i % 2 * 168, y = 273 + Math.floor(i / 2) * 112
      panel(this, x, y, 152, 98, 0x3a5862)
      this.display.push(this.add.graphics().setPosition(x, y).setDepth(2))
      this.text(x, y + 36, incidentNames[id], 12, '#e9f4da').setDepth(4)
      this.button(incidentNames[id], x, 518 + Math.floor(i / 2) * 57, 155, () => this.alert(id))
    })
    const passer = createCustomer(this, 300, 472, 0.24)
    if (!reducedMotion()) this.tweens.add({ targets: passer.container, x: 236, duration: 2300, yoyo: true, repeat: -1 })
    this.text(180, 624, 'Chạm tên ô có sự cố · Chờ khi mọi thứ bình thường', 11)
    this.nextIncident()
  }
  private draw(): void {
    this.display.forEach((g, i) => {
      const active = this.incident === incidents[i]
      g.clear().fillStyle(0xbed8cc).fillRoundedRect(-65, -39, 130, 64, 7)
      g.fillStyle(0x859e91).fillRect(-65, 16, 130, 9)
      if (i === 0) { g.fillStyle(0x938372).fillRect(-25, -30, active ? 14 : 47, 46); g.fillStyle(0xf2dab0).fillCircle(13, -7, 3); if (active) g.fillStyle(0xf1cb76).fillTriangle(-10, 16, 38, 16, 0, -32) }
      if (i === 1) { g.lineStyle(5, 0x6d939d).lineBetween(-25, -27, 15, -27).lineBetween(15, -27, 15, -11); if (active) { g.fillStyle(0x79bcca).fillEllipse(15, 19, 73, 8); for (let y = -2; y < 19; y += 8) g.fillCircle(15, y, 3) } }
      if (i === 2) { g.fillStyle(0xc99a65).fillRoundedRect(active ? -36 : -21, active ? -2 : -26, 44, 39, 5); g.lineStyle(3, 0xf3d99c).lineBetween(-16, -24, -16, 11); if (active) g.fillStyle(0xf5d188).fillCircle(37, -13, 8) }
      if (i === 3) { g.fillStyle(active ? 0xf1bd66 : 0x93aa8e).fillEllipse(0, -10, 42, 31); g.fillStyle(0x687f7c).fillCircle(0, 9, 5); if (active) g.lineStyle(3, 0xd47967).strokeCircle(0, -10, 27).lineBetween(-31, -17, -40, -22).lineBetween(31, -17, 40, -22) }
      if (active) g.lineStyle(3, 0xf3cc79).strokeRoundedRect(-65, -39, 130, 64, 7)
    })
  }
  private nextIncident(): void {
    const difficulty = securityDifficulty(this.detected)
    this.incident = null; this.pending = incidents[Phaser.Math.Between(0, incidents.length - 1)]
    this.wait = difficulty.wait; this.remaining = difficulty.window; this.reaction = 0; this.draw()
    this.hint.setText('Quan sát bốn ô camera')
  }
  private alert(choice: Incident): void {
    if (this.wait < 0) return
    const points = detectionPoints(choice, this.incident, this.reaction), success = this.incident === choice
    this.handled++; if (success) this.detected++
    this.award(points, success ? `+${points} PHÁT HIỆN ĐÚNG!` : '-40 BÁO NHẦM!', success)
    this.countText.setText(`✓ ${this.detected}`); if (success) getSceneFx(this).burst(180, 351, 0xffdd84)
    this.cooldown()
  }
  private cooldown(): void { this.incident = null; this.wait = -1; this.draw(); this.time.delayedCall(C.nextMs, () => { if (!this.hasFinished) this.nextIncident() }) }
  protected updatePlay(delta: number): void {
    if (this.wait < 0) return
    if (this.incident === null) {
      this.wait -= delta
      if (this.wait <= 0) { this.wait = 0; this.incident = this.pending; this.draw() }
    } else {
      this.reaction += delta; this.remaining -= delta
      if (this.remaining <= 0) { this.award(C.missed, '-25 BỎ LỠ SỰ CỐ!', false); this.cooldown() }
    }
  }
  protected metadata() { return { incidentsHandled: this.handled, correctDetections: this.detected } }
  protected cleanupInput(): void { this.incident = null; this.wait = -1 }
}

