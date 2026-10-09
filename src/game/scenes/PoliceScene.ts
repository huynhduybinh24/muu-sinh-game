import Phaser from 'phaser'
import { TimedJobScene } from './TimedJobScene'
import { POLICE_CONFIG as C, trafficRequests, trafficDecision, trafficPoints, trafficPatience, type TrafficLane } from '../config/policeConfig'
import { getPhaserAvatarData } from '../avatar/avatarData'
import { orderPanel } from '../visual/expansionArt'
import { vehicleArt } from '../visual/professionArt'
import { getSceneFx } from '../visual/feedbackFx'
import { reducedMotion } from '../visual/sceneTheme'
import type { Job } from '../../types/job'
import type { GameResult } from '../../types/game'

export class PoliceScene extends TimedJobScene {
  private request = trafficRequests[0]
  private green: TrafficLane | null = null
  private resolved = 0
  private safe = 0
  private elapsed = 0
  private remaining = 0
  private active = true
  private hint!: Phaser.GameObjects.Text
  private sign!: Phaser.GameObjects.Text
  private signals!: Phaser.GameObjects.Graphics
  private car!: Phaser.GameObjects.Graphics
  constructor(job: Job, complete: (result: GameResult) => void, avatar = getPhaserAvatarData()) { super(job, complete, avatar) }
  protected createPlayArea(): void {
    this.avatar.container.setPosition(45, 473)
    orderPanel(this, 'NGÃ TƯ GIẢ TƯỞNG · AN TOÀN & ƯU TIÊN')
    this.hint = this.text(180, 132, '', 18); this.sign = this.text(180, 171, '', 12)
    const roads = this.add.graphics().setDepth(-1)
    roads.fillStyle(0xb3c9b0).fillRoundedRect(17, 208, 326, 249, 17)
    roads.fillStyle(0x849792).fillRect(141, 208, 79, 249).fillRect(17, 292, 326, 81)
    roads.lineStyle(2, 0xf6efd0)
    for (let y = 212; y < 447; y += 24) if (y < 281 || y > 377) roads.lineBetween(180, y, 180, y + 11)
    for (let x = 22; x < 337; x += 24) if (x < 137 || x > 226) roads.lineBetween(x, 332, x + 11, 332)
    for (let i = 0; i < 5; i++) roads.fillStyle(0xf6edd5).fillRect(143 + i * 15, 276, 8, 10).fillRect(143 + i * 15, 378, 8, 10)
    roads.fillStyle(0xdfc3a2).fillRoundedRect(29, 219, 81, 49, 6).fillRoundedRect(250, 396, 76, 42, 6)
    this.signals = this.add.graphics().setDepth(4)
    this.car = this.add.graphics().setDepth(3).setName('traffic-car')
    this.button('ĐÈN DỌC', 92, 516, 154, () => this.signal('vertical'))
    this.button('ĐÈN NGANG', 268, 516, 154, () => this.signal('horizontal'))
    this.button('ĐỎ CẢ HAI', 92, 578, 154, () => { if (this.active) { this.green = null; this.drawLights() } })
    this.button('DỪNG XE VƯỢT ĐỎ', 268, 578, 154, () => this.stopViolation())
    this.text(180, 628, 'Đỏ cả hai trước khi đổi hướng · Không hướng dẫn thực tế', 10)
    this.nextRequest()
  }
  private drawLights(): void {
    this.signals.clear()
    ;(['vertical', 'horizontal'] as const).forEach((lane, i) => {
      const x = 234 + i * 52
      this.signals.fillStyle(0x435861).fillRoundedRect(x, 229, 31, 53, 5)
      this.signals.fillStyle(this.green === lane ? 0x59615a : 0xe58b79).fillCircle(x + 15, 244, 8)
      this.signals.fillStyle(this.green === lane ? 0x9dcc8b : 0x59615a).fillCircle(x + 15, 266, 8)
    })
  }
  private nextRequest(): void {
    this.request = { ...trafficRequests[Phaser.Math.Between(0, trafficRequests.length - 1)] }
    this.active = true; this.elapsed = 0; this.remaining = trafficPatience(this.resolved) * 1000
    this.hint.setText(`${this.request.lane === 'vertical' ? 'HƯỚNG DỌC' : 'HƯỚNG NGANG'} ${this.request.emergency ? '· XE ƯU TIÊN' : '· ĐANG CHỜ'}`)
    this.sign.setText(this.request.violation ? 'XE ĐỊNH VƯỢT ĐỎ! Dừng xe trước.' : 'Chỉ mở một hướng · Cho xe đang chờ đi')
    vehicleArt(this.car, this.request.emergency ? 0xf2ede0 : 0xe9bd70, this.request.emergency)
    this.car.setPosition(this.request.lane === 'vertical' ? 179 : 68, this.request.lane === 'vertical' ? 241 : 332).setRotation(this.request.lane === 'horizontal' ? Math.PI / 2 : Math.PI)
    this.drawLights()
  }
  private stopViolation(): void {
    if (!this.active) return
    if (!this.request.violation) { this.award(C.wrong, '-40 XE KHÔNG VI PHẠM!', false); return }
    this.request.violation = false; this.safe++; this.award(C.correct, '+100 CHẶN VƯỢT ĐỎ!', true)
    this.sign.setText('Đã dừng xe · Bây giờ mở đúng hướng')
  }
  private signal(lane: TrafficLane): void {
    if (!this.active) return
    const result = trafficDecision(this.green, lane, this.request)
    if (result !== 'safe') { this.green = null; this.drawLights(); this.award(C.wrong, result === 'conflict' ? '-40 HAI HƯỚNG XUNG ĐỘT!' : '-40 CHƯA AN TOÀN!', false); return }
    this.green = lane; this.drawLights(); this.safe++; this.resolved++
    const points = trafficPoints(this.elapsed, this.request.emergency)
    this.award(points, `+${points} XE QUA AN TOÀN!`, true); this.countText.setText(`✓ ${this.resolved}`)
    getSceneFx(this).burst(180, 330, 0xa5c995)
    if (!reducedMotion()) this.tweens.add({ targets: this.car, x: lane === 'horizontal' ? 300 : 179, y: lane === 'vertical' ? 428 : 332, duration: 650 })
    this.wait()
  }
  private wait(): void { this.active = false; this.time.delayedCall(C.nextMs, () => { if (!this.hasFinished) this.nextRequest() }) }
  protected updatePlay(delta: number): void { if (this.active) { this.elapsed += delta; this.remaining -= delta; if (this.remaining <= 0) { this.award(C.congestion, '-20 ÙN XE!', false); this.wait() } } }
  protected metadata() { return { incidentsResolved: this.resolved, safeDecisions: this.safe } }
  protected cleanupInput(): void { this.active = false }
}
