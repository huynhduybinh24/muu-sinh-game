import Phaser from 'phaser'
import { TimedJobScene } from './TimedJobScene'
import { GAS_CONFIG as C, fuelTypes, fuelTargets, fuelRate, fuelPatience, evaluateFuel, type FuelType } from '../config/gasConfig'
import { getPhaserAvatarData } from '../avatar/avatarData'
import { orderPanel, motorbikeArt } from '../visual/expansionArt'
import { panel } from '../visual/environment'
import { getSceneFx } from '../visual/feedbackFx'
import type { Job } from '../../types/job'
import type { GameResult } from '../../types/game'

export class GasScene extends TimedJobScene {
  private requested: FuelType = 'E5'
  private selected: FuelType | null = null
  private target = 4
  private amount = 0
  private filling = false
  private active = true
  private remaining = 0
  private served = 0
  private perfect = 0
  private order!: Phaser.GameObjects.Text
  private display!: Phaser.GameObjects.Text
  private selection!: Phaser.GameObjects.Text
  private tank!: Phaser.GameObjects.Rectangle
  private hose!: Phaser.GameObjects.Graphics
  private bike!: Phaser.GameObjects.Graphics
  constructor(job: Job, complete: (result: GameResult) => void, avatar = getPhaserAvatarData()) { super(job, complete, avatar) }
  protected createPlayArea(): void {
    this.avatar.container.setPosition(175, 460)
    orderPanel(this, 'YÊU CẦU ĐỔ XĂNG')
    this.order = this.text(180, 133, '', 24); this.selection = this.text(180, 166, 'Chọn đúng loại xăng', 13)
    panel(this, 90, 305, 123, 197, 0xeac17e)
    panel(this, 90, 251, 99, 55, 0x3c5d62)
    this.display = this.text(90, 251, '0.0 L', 22, '#fff4c9')
    this.add.rectangle(49, 346, 15, 87, 0xadc3b4)
    this.tank = this.add.rectangle(49, 390, 15, 87, 0x79b39b).setOrigin(0.5, 1).setScale(1, 0)
    this.hose = this.add.graphics().setDepth(1)
    this.bike = this.add.graphics().setPosition(253, 361); motorbikeArt(this.bike)
    this.button('E5', 92, 515, 154, () => this.choose('E5'))
    this.button('RON95', 268, 515, 154, () => this.choose('RON95'))
    this.button('GIỮ ĐỂ BƠM', 180, 580, 328, () => this.startFill())
    this.text(180, 625, 'Thả tay gần số lít khách yêu cầu', 13)
    this.input.on('pointerup', this.release, this); this.input.on('pointerupoutside', this.release, this)
    this.input.on('nativepause', this.interrupt, this); this.input.on('gameout', this.interrupt, this)
    this.startVehicle()
  }
  private choose(type: FuelType): void { if (this.active && !this.filling) { this.selected = type; this.selection.setText(`Đã chọn ${type}`) } }
  private startFill(): void { if (this.active && this.selected) { this.filling = true; this.avatar.setState('work') } else if (this.active) this.selection.setText('Chọn E5 hoặc RON95 trước!') }
  private interrupt(): void { this.filling = false; if (!this.hasFinished) this.avatar.setState('idle') }
  private startVehicle(): void {
    this.requested = fuelTypes[Phaser.Math.Between(0, fuelTypes.length - 1)]; this.target = fuelTargets[Phaser.Math.Between(0, fuelTargets.length - 1)]
    this.amount = 0; this.selected = null; this.filling = false; this.active = true
    this.remaining = fuelPatience(this.served) * 1000
    this.order.setText(`${this.requested} · ${this.target} L`); this.selection.setText('Chọn đúng loại xăng')
    this.display.setText('0.0 L'); this.tank.setScale(1, 0)
    motorbikeArt(this.bike, [0x79aaa5, 0xe4a17b, 0x929cc3][this.served % 3]); this.drawHose()
  }
  private drawHose(): void {
    this.hose.clear().lineStyle(8, 0x435459).beginPath().moveTo(149, 260).lineTo(170, 281).lineTo(169, 357).lineTo(216, 352).strokePath()
    this.hose.lineStyle(3, this.filling ? 0x87bd9d : 0x748e8c).lineBetween(170, 356, 215, 351)
    this.hose.fillStyle(0xd8d9c6).fillRoundedRect(209, 338, 27, 12, 4)
  }
  protected updatePlay(delta: number): void {
    if (!this.active) return
    this.remaining -= delta
    if (this.remaining <= 0) { this.resolve(C.timeout, false, '-25 KHÁCH CHỜ LÂU!'); return }
    if (this.filling) {
      this.amount += Math.min(delta, 100) / 1000 * fuelRate(this.served)
      this.display.setText(`${this.amount.toFixed(1)} L`); this.tank.setScale(1, Math.min(1, this.amount / this.target))
      this.drawHose()
      if (this.amount > this.target * C.overfillRatio) this.release()
    }
  }
  private release(): void {
    if (!this.active || !this.filling) return
    this.filling = false
    const result = evaluateFuel(this.selected, this.requested, this.amount, this.target)
    if (result.grade !== 'wrong') this.served++
    if (result.grade === 'perfect') this.perfect++
    this.resolve(result.points, result.grade !== 'wrong', `${result.points > 0 ? '+' : ''}${result.points} ${{ perfect: 'ĐỦ LÍT!', good: 'TỐT!', ok: 'TẠM ỔN!', wrong: 'SAI XĂNG / SAI LÍT!' }[result.grade]}`)
  }
  private resolve(points: number, success: boolean, message: string): void {
    this.active = false; this.filling = false; this.drawHose(); this.award(points, message, success)
    this.countText.setText(`✓ ${this.served}`); if (success) getSceneFx(this).burst(222, 350, 0xa0d1ad, 'water')
    this.time.delayedCall(C.nextMs, () => { if (!this.hasFinished) this.startVehicle() })
  }
  protected metadata() { return { vehiclesServed: this.served, perfectFills: this.perfect } }
  protected cleanupInput(): void {
    this.filling = false
    this.input.off('pointerup', this.release, this); this.input.off('pointerupoutside', this.release, this)
    this.input.off('nativepause', this.interrupt, this); this.input.off('gameout', this.interrupt, this)
  }
}

