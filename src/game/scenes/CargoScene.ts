import Phaser from 'phaser'
import { TimedJobScene } from './TimedJobScene'
import { CARGO_CONFIG as C, destinations, destinationLabels, cargoDrop, cargoPoints, cargoPatience, type CargoDestination } from '../config/cargoConfig'
import { getPhaserAvatarData } from '../avatar/avatarData'
import { orderPanel, crateArt } from '../visual/expansionArt'
import { getSceneFx } from '../visual/feedbackFx'
import type { Job } from '../../types/job'
import type { GameResult } from '../../types/game'

const colors = [0x6d9fba, 0xd69d65, 0x80ad71] as const
export class CargoScene extends TimedJobScene {
  private destination: CargoDestination = 'river'
  private sorted = 0
  private perfect = 0
  private combo = 0
  private elapsed = 0
  private roundElapsed = 0
  private remaining = 0
  private active = true
  private pointerId: number | null = null
  private box!: Phaser.GameObjects.Container
  private symbol!: Phaser.GameObjects.Graphics
  private label!: Phaser.GameObjects.Text
  private hint!: Phaser.GameObjects.Text
  constructor(job: Job, complete: (result: GameResult) => void, avatar = getPhaserAvatarData()) { super(job, complete, avatar) }
  protected createPlayArea(): void {
    orderPanel(this, 'KÉO KIỆN HÀNG VÀO XE ĐÚNG BIỂU TƯỢNG')
    this.hint = this.text(180, 142, 'COMBO x0', 22)
    const g = this.add.graphics().setDepth(-1)
    g.fillStyle(0x9babb0).fillRoundedRect(30, 286, 300, 78, 12)
    for (let x = 45; x < 330; x += 24) g.fillStyle(0xd9e1d8).fillRoundedRect(x, 296, 12, 55, 5)
    destinations.forEach((id, i) => {
      const x = 60 + i * 120
      g.fillStyle(colors[i]).fillRoundedRect(x - 47, 466, 94, 69, 10)
      g.fillStyle(0xb6dcdd).fillRoundedRect(x - 37, 475, 30, 24, 5)
      g.fillStyle(0x42535c).fillCircle(x - 26, 541, 10).fillCircle(x + 28, 541, 10)
      this.text(x, 513, destinationLabels[id], 15, '#fff9e8')
      g.fillStyle(0xfff3d0).fillCircle(x + 23, 485, 15).fillStyle(colors[i]).fillCircle(x + 23, 485, 10)
    })
    this.symbol = this.add.graphics()
    this.label = this.text(0, 17, '', 13)
    this.box = this.add.container(180, 260, [this.symbol, this.label]).setDepth(7).setName('cargo-package')
    this.text(180, 610, 'Giữ kiện hàng → kéo → thả vào xe', 15)
    this.input.on('pointerdown', this.beginDrag, this); this.input.on('pointermove', this.drag, this)
    this.input.on('pointerup', this.drop, this); this.input.on('pointerupoutside', this.drop, this)
    this.input.on('nativepause', this.interrupt, this); this.input.on('gameout', this.interrupt, this)
    this.startPackage()
  }
  private startPackage(): void {
    this.destination = destinations[Phaser.Math.Between(0, destinations.length - 1)]; this.active = true; this.pointerId = null; this.roundElapsed = 0
    this.remaining = cargoPatience(this.sorted) * 1000
    this.box.setPosition(180, 274).setVisible(true)
    crateArt(this.symbol, colors[destinations.indexOf(this.destination)])
    this.label.setText(destinationLabels[this.destination]); this.hint.setText(`COMBO x${this.combo}`)
  }
  private beginDrag(pointer: Phaser.Input.Pointer): void {
    if (!this.active || this.pointerId !== null || Math.abs(pointer.worldX - this.box.x) > 47 || Math.abs(pointer.worldY - this.box.y) > 50) return
    this.pointerId = pointer.id; this.avatar.setState('work')
  }
  private drag(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.pointerId && pointer.isDown) this.box.setPosition(Phaser.Math.Clamp(pointer.worldX, 42, 318), Phaser.Math.Clamp(pointer.worldY, 205, 555))
  }
  private interrupt(): void { this.pointerId = null; if (this.active) this.box.setPosition(180, 274); if (!this.hasFinished) this.avatar.setState('idle') }
  private drop(pointer: Phaser.Input.Pointer): void {
    if (!this.active || pointer.id !== this.pointerId) return
    const correct = cargoDrop(pointer.worldX, pointer.worldY) === this.destination
    this.pointerId = null
    if (correct) { this.sorted++; this.combo++; if (this.roundElapsed <= C.quickMs) this.perfect++ } else this.combo = 0
    this.resolve(cargoPoints(correct, this.combo), correct)
  }
  private resolve(points: number, correct: boolean): void {
    this.active = false; this.box.setVisible(false); this.pointerId = null
    this.award(points, correct ? `+${points} ĐÚNG XE! x${this.combo}` : `${points} NHẦM / TRỄ KIỆN!`, correct)
    this.countText.setText(`✓ ${this.sorted}`); if (correct) getSceneFx(this).burst(60 + destinations.indexOf(this.destination) * 120, 500, colors[destinations.indexOf(this.destination)])
    this.time.delayedCall(C.nextMs, () => { if (!this.hasFinished) this.startPackage() })
  }
  protected updatePlay(delta: number): void {
    this.elapsed += delta
    if (!this.active) return
    this.roundElapsed += delta; this.remaining -= delta
    if (this.remaining <= 0) { this.combo = 0; this.resolve(C.timeout, false); return }
    if (this.pointerId === null) this.box.setX(180 + Math.sin(this.elapsed / 950) * Math.min(70, 25 + this.sorted * 2))
  }
  protected metadata() { return { packagesSorted: this.sorted, perfectSorts: this.perfect } }
  protected cleanupInput(): void {
    this.pointerId = null
    this.input.off('pointerdown', this.beginDrag, this); this.input.off('pointermove', this.drag, this)
    this.input.off('pointerup', this.drop, this); this.input.off('pointerupoutside', this.drop, this)
    this.input.off('nativepause', this.interrupt, this); this.input.off('gameout', this.interrupt, this)
  }
}

