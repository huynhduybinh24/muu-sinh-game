import Phaser from 'phaser'
import { TimedJobScene } from './TimedJobScene'
import { ELECTRICIAN_CONFIG as C, wireColors, wireNames, circuitPoints, circuitDifficulty } from '../config/electricianConfig'
import { getPhaserAvatarData } from '../avatar/avatarData'
import { orderPanel, counter } from '../visual/expansionArt'
import { panel } from '../visual/environment'
import { getSceneFx } from '../visual/feedbackFx'
import type { Job } from '../../types/job'
import type { GameResult } from '../../types/game'

export class ElectricianScene extends TimedJobScene {
  private right = [0, 1, 2]
  private matched = new Set<number>()
  private selected: number | null = null
  private mistakes = 0
  private fixed = 0
  private perfect = 0
  private remaining = 0
  private active = true
  private wires!: Phaser.GameObjects.Graphics
  private bulb!: Phaser.GameObjects.Arc
  private leftButtons: Phaser.GameObjects.Rectangle[] = []
  private rightButtons: Phaser.GameObjects.Rectangle[] = []
  private rightLabels: Phaser.GameObjects.Text[] = []
  private ports: Phaser.GameObjects.Arc[] = []
  private stateText!: Phaser.GameObjects.Text
  constructor(job: Job, complete: (result: GameResult) => void, avatar = getPhaserAvatarData()) { super(job, complete, avatar) }
  protected createPlayArea(): void {
    this.avatar.container.setPosition(48, 528)
    orderPanel(this, 'ĐỒ CHƠI MẠCH MÀU · KHÔNG PHẢI HƯỚNG DẪN ĐIỆN')
    this.stateText = this.text(180, 140, 'Nối hai đầu cùng màu', 19)
    counter(this, '', 0x7d94ac); panel(this, 180, 335, 326, 249, 0xe8e6d9)
    this.text(180, 198, 'BÀN SỬA ĐỒ CHƠI', 11)
    this.wires = this.add.graphics().setDepth(3)
    this.bulb = this.add.circle(180, 230, 15, 0xb3bbaa).setDepth(4)
    for (let i = 0; i < 4; i++) {
      this.leftButtons.push(this.button(wireNames[i], 68, 279 + i * 56, 88, () => this.select(i)))
      this.rightButtons.push(this.button('', 292, 279 + i * 56, 88, () => this.connect(i)))
      this.rightLabels.push(this.text(292, 279 + i * 56, '', 14).setDepth(6))
      this.ports.push(this.add.circle(22, 279 + i * 56, 7, wireColors[i]).setDepth(6),
        this.add.circle(340, 279 + i * 56, 7, wireColors[i]).setDepth(6))
    }
    this.button('KIỂM TRA', 180, 569, 326, () => { if (this.active) { this.mistakes++; this.award(C.invalid, '-30 CHƯA NỐI ĐỦ!', false) } })
    this.text(180, 619, 'Chạm đầu trái rồi chạm màu tương ứng bên phải', 11)
    this.startCircuit()
  }
  private startCircuit(): void {
    const difficulty = circuitDifficulty(this.fixed)
    this.right = Phaser.Utils.Array.Shuffle(Array.from({ length: difficulty.count }, (_, i) => i)); this.matched.clear(); this.selected = null; this.mistakes = 0
    this.active = true; this.remaining = difficulty.seconds * 1000; this.wires.clear(); this.bulb.setFillStyle(0xb3bbaa)
    this.leftButtons.forEach((button, i) => button.setVisible(i < difficulty.count).setAlpha(1))
    // Hide associated artwork/labels for the fourth socket until it is unlocked.
    this.children.list.forEach(object => {
      const button = object.getData('buttonFor') as unknown
      if (object instanceof Phaser.GameObjects.Container && (button === this.leftButtons[3] || button === this.rightButtons[3])) object.setVisible(difficulty.count === 4)
      if (object instanceof Phaser.GameObjects.Text && object.x === 68 && object.y === 447) object.setVisible(difficulty.count === 4)
    })
    this.rightButtons.forEach((button, i) => button.setVisible(i < difficulty.count).setAlpha(1))
    this.rightLabels.forEach((label, i) => label.setText(i < difficulty.count ? wireNames[this.right[i]] : '').setVisible(i < difficulty.count))
    this.ports.forEach((port, i) => { const row = Math.floor(i / 2); port.setVisible(row < difficulty.count); if (i % 2 && row < difficulty.count) port.setFillStyle(wireColors[this.right[row]]) })
    this.stateText.setText('Nối hai đầu cùng màu')
  }
  private select(color: number): void {
    if (!this.active || color >= this.right.length || this.matched.has(color)) return
    this.selected = color; this.stateText.setText(`Đang nối: ${wireNames[color]}`); this.avatar.setState('work')
  }
  private connect(index: number): void {
    if (!this.active || this.selected === null || index >= this.right.length) return
    const color = this.selected; this.selected = null
    if (color !== this.right[index]) { this.mistakes++; this.award(C.invalid, '-30 LỆCH MÀU!', false); return }
    this.matched.add(color)
    this.wires.lineStyle(7, 0x687c79).beginPath().moveTo(111, 279 + color * 56).lineTo(160, 271 + color * 56).lineTo(206, 291 + index * 56).lineTo(248, 279 + index * 56).strokePath()
    this.wires.lineStyle(4, wireColors[color]).lineBetween(112, 279 + color * 56, 160, 271 + color * 56).lineBetween(160, 271 + color * 56, 206, 291 + index * 56).lineBetween(206, 291 + index * 56, 248, 279 + index * 56)
    this.stateText.setText(`Đã nối ${this.matched.size} / ${this.right.length}`)
    if (this.matched.size === this.right.length) {
      this.fixed++; if (this.mistakes === 0) this.perfect++
      const points = circuitPoints(this.mistakes, true)
      this.bulb.setFillStyle(0xffdc79); getSceneFx(this).burst(180, 230, 0xffdd84)
      this.award(points, `+${points} ĐÈN SÁNG!`, true); this.countText.setText(`✓ ${this.fixed}`); this.nextCircuit()
    }
  }
  private nextCircuit(): void { this.active = false; this.time.delayedCall(C.nextMs, () => { if (!this.hasFinished) this.startCircuit() }) }
  protected updatePlay(delta: number): void { if (this.active) { this.remaining -= delta; if (this.remaining <= 0) { this.award(C.invalid, '-30 HẾT GIỜ MẠCH!', false); this.nextCircuit() } } }
  protected metadata() { return { circuitsFixed: this.fixed, perfectCircuits: this.perfect } }
  protected cleanupInput(): void { this.selected = null }
}

