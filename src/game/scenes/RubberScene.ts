import Phaser from 'phaser'
import { TimedJobScene } from './TimedJobScene'
import { getPhaserAvatarData } from '../avatar/avatarData'
import { RUBBER_CONFIG as CONFIG, evaluateRubberTrace, tappingGuide } from '../config/rubberConfig'
import { getFastBonus } from '../config/serviceJobConfig'
import { getSceneFx } from '../visual/feedbackFx'
import { panel } from '../visual/environment'
import type { ScrubPoint } from '../config/carwashConfig'
import type { GameResult } from '../../types/game'
import type { Job } from '../../types/job'

export class RubberScene extends TimedJobScene {
  private guide = tappingGuide()
  private trace: ScrubPoint[] = []
  private pointerId: number | null = null
  private treeRemaining = CONFIG.treeSeconds * 1000
  private active = true
  private treesTapped = 0
  private perfectTaps = 0
  private pathArt!: Phaser.GameObjects.Graphics
  private knife!: Phaser.GameObjects.Graphics
  private latex!: Phaser.GameObjects.Rectangle
  private coverageText!: Phaser.GameObjects.Text
  private elapsed = 0
  private traceStarted = 0
  constructor(job: Job, onComplete: (result: GameResult) => void, avatarData = getPhaserAvatarData()) { super(job, onComplete, avatarData) }
  protected createPlayArea(): void {
    panel(this, 180, 147, 332, 108)
    this.text(180, 118, 'KÉO THEO ĐƯỜNG CẠO', 18)
    this.coverageText = this.text(180, 153, 'Bắt đầu ở chấm trái → thả ở chấm phải', 12)
    this.text(180, 179, 'Không cần vẽ hoàn hảo từng pixel', 11)
    const tree = this.add.graphics()
    tree.fillStyle(0x584d3c, 0.18).fillEllipse(184, 437, 224, 24)
    tree.fillStyle(0x9d7653).fillRoundedRect(76, 223, 212, 209, 31)
    tree.fillStyle(0xbd9b71).fillRoundedRect(85, 226, 37, 201, 18)
    tree.lineStyle(3, 0x755e46, 0.35)
    for (let x = 136; x < 280; x += 27) tree.lineBetween(x, 239, x - 12, 421)
    const guide = this.add.graphics()
    guide.lineStyle(13, 0x427457, 0.3).beginPath().moveTo(this.guide[0].x, this.guide[0].y)
    this.guide.slice(1).forEach(({ x, y }) => guide.lineTo(x, y)); guide.strokePath()
    guide.lineStyle(4, 0xf9efca).beginPath().moveTo(this.guide[0].x, this.guide[0].y)
    this.guide.slice(1).forEach(({ x, y }) => guide.lineTo(x, y)); guide.strokePath()
    guide.fillStyle(0xb2e4a7).fillCircle(this.guide[0].x, this.guide[0].y, 8)
    guide.fillStyle(0xffd489).fillCircle(this.guide.at(-1)!.x, this.guide.at(-1)!.y, 8)
    tree.fillStyle(0xf3f0df).fillRoundedRect(265, 397, 39, 32, 9)
    tree.lineStyle(2, 0x898d78).strokeRoundedRect(265, 397, 39, 32, 9)
    this.latex = this.add.rectangle(284, 426, 29, 21, 0xffffff).setOrigin(0.5, 1).setScale(1, 0)
    this.pathArt = this.add.graphics().setDepth(6)
    this.knife = this.add.graphics().setDepth(7).setVisible(false)
    this.knife.fillStyle(0x5d6f78).fillTriangle(-8, 3, 10, -4, 4, 10).fillStyle(0xcba170).fillRoundedRect(-5, -14, 6, 16, 2)
    this.text(180, 531, 'Giữ và kéo ngón tay / chuột', 16)
    this.text(180, 563, 'Thả tay để thu mủ · Mỗi cây có 11 giây', 12)
    this.input.on('pointerdown', this.startTrace, this)
    this.input.on('pointermove', this.moveTrace, this)
    this.input.on('pointerup', this.endTrace, this)
    this.input.on('gameout', this.cancelTrace, this)
    this.input.on('nativepause', this.interruptTrace, this)
  }
  protected updatePlay(delta: number): void {
    this.elapsed += delta
    if (!this.active) return
    this.treeRemaining = Math.max(0, this.treeRemaining - delta)
    if (this.treeRemaining === 0) this.finishTree(false)
  }
  private startTrace(pointer: Phaser.Input.Pointer): void {
    if (!this.active || this.hasFinished || this.pointerId !== null || pointer.worldX < 65 || pointer.worldX > 310 || pointer.worldY < 222 || pointer.worldY > 444) return
    this.pointerId = pointer.id; this.trace = [{ x: pointer.worldX, y: pointer.worldY }]; this.traceStarted = this.elapsed
    this.avatar.setState('work'); this.knife.setVisible(true); this.drawTrace()
  }
  private moveTrace(pointer: Phaser.Input.Pointer): void {
    if (!this.active || this.pointerId !== pointer.id || !pointer.isDown || this.hasFinished) return
    const last = this.trace.at(-1)!
    if (Math.hypot(last.x - pointer.worldX, last.y - pointer.worldY) < 3) return
    if (this.trace.length < CONFIG.maximumTracePoints) this.trace.push({ x: pointer.worldX, y: pointer.worldY })
    this.drawTrace()
    if (this.trace.length % 4 === 0) this.coverageText.setText(`Độ phủ: ${Math.round(evaluateRubberTrace(this.trace).coverage * 100)}%`)
  }
  private drawTrace(): void {
    const last = this.trace.at(-1)!
    this.knife.setPosition(last.x, last.y)
    this.pathArt.clear().lineStyle(5, 0x5c392c).beginPath().moveTo(this.trace[0].x, this.trace[0].y)
    this.trace.slice(1).forEach(({ x, y }) => this.pathArt.lineTo(x, y)); this.pathArt.strokePath()
  }
  private endTrace(pointer: Phaser.Input.Pointer): void {
    if (this.pointerId !== pointer.id || !this.active || this.hasFinished) return
    if (this.trace.length < CONFIG.maximumTracePoints) this.trace.push({ x: pointer.worldX, y: pointer.worldY })
    this.finishTree(true)
  }
  private cancelTrace(): void { if (this.pointerId !== null && this.active && !this.hasFinished) this.finishTree(true) }
  private interruptTrace(): void {
    // Android pause cancels the held gesture, not the tree; no scoring or timer reset.
    this.pointerId = null; this.trace = []; this.pathArt.clear(); this.knife.setVisible(false)
    if (!this.hasFinished) this.avatar.setState('idle')
  }
  private finishTree(evaluate: boolean): void {
    this.active = false; this.pointerId = null; this.knife.setVisible(false)
    const placement = evaluateRubberTrace(evaluate ? this.trace : [])
    const success = placement.grade !== 'bad'
    const bonus = success ? getFastBonus(Math.max(0, CONFIG.treeSeconds * 1000 - (this.elapsed - this.traceStarted)), CONFIG.treeSeconds * 1000, CONFIG.fastBonus) : 0
    if (success) { this.treesTapped++; this.latex.setScale(1); getSceneFx(this).burst(284, 406, 0xffffff, 'water') }
    if (placement.grade === 'perfect') this.perfectTaps++
    const label = { perfect: 'HOÀN HẢO!', good: 'CẠO TỐT!', ok: 'TẠM ỔN!', bad: 'LỆCH ĐƯỜNG!' }[placement.grade]
    this.award(placement.points + bonus, `${success ? '+' : ''}${placement.points} ${label}${bonus ? ` +${bonus} NHANH` : ''}`, success)
    this.countText.setText(`✓ ${this.treesTapped}`)
    this.time.delayedCall(CONFIG.nextTreeMs, () => {
      if (this.hasFinished) return
      this.trace = []; this.pathArt.clear(); this.latex.setScale(1, 0); this.treeRemaining = CONFIG.treeSeconds * 1000; this.active = true
      this.coverageText.setText('Cây mới · Kéo trái → phải'); this.avatar.setState('idle')
    })
  }
  protected metadata() { return { treesTapped: this.treesTapped, perfectTaps: this.perfectTaps } }
  protected cleanupInput(): void {
    this.pointerId = null
    this.input.off('pointerdown', this.startTrace, this); this.input.off('pointermove', this.moveTrace, this)
    this.input.off('pointerup', this.endTrace, this); this.input.off('gameout', this.cancelTrace, this)
    this.input.off('nativepause', this.interruptTrace, this)
  }
}
