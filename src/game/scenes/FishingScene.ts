import Phaser from 'phaser'
import { TimedJobScene } from './TimedJobScene'
import { getPhaserAvatarData } from '../avatar/avatarData'
import { FISHING_CONFIG as CONFIG, chooseFishTier, evaluateCatch, fishingMarker, fishTiers, type FishTier } from '../config/fishingConfig'
import { panel } from '../visual/environment'
import { getSceneFx } from '../visual/feedbackFx'
import type { GameResult } from '../../types/game'
import type { Job } from '../../types/job'

type Phase = 'ready' | 'waiting' | 'bite' | 'tension' | 'transition'
export class FishingScene extends TimedJobScene {
  private phase: Phase = 'ready'
  private phaseMs = 0
  private fishTier: FishTier = 'common'
  private fishCaught = 0
  private rareFishCaught = 0
  private statusText!: Phaser.GameObjects.Text
  private marker!: Phaser.GameObjects.Rectangle
  private bobber!: Phaser.GameObjects.Graphics
  private actionLabel!: Phaser.GameObjects.Text
  private lineArt!: Phaser.GameObjects.Graphics
  constructor(job: Job, onComplete: (result: GameResult) => void, avatarData = getPhaserAvatarData()) { super(job, onComplete, avatarData) }
  protected createPlayArea(): void {
    panel(this, 180, 147, 332, 108)
    this.statusText = this.text(180, 124, 'THẢ CÂU ĐỂ BẮT ĐẦU', 17)
    this.text(180, 164, 'Cá cắn → chạm nhanh → canh vùng xanh', 12)
    const g = this.add.graphics()
    g.fillStyle(0x557f84).fillRoundedRect(86, 218, 251, 233, 24)
    g.fillStyle(0x88b9ba, 0.65).fillRoundedRect(94, 226, 235, 215, 20)
    g.lineStyle(2, 0xd5e8cd, 0.45)
    for (let y = 263; y < 421; y += 36) g.lineBetween(104, y, 313, y - 4)
    g.fillStyle(0x5b9699, 0.6).fillEllipse(178, 356, 46, 12).fillTriangle(157, 356, 147, 347, 147, 365)
    g.fillStyle(0x678e73).fillRoundedRect(14, 407, 86, 37, 10)
    g.lineStyle(4, 0xad855e).lineBetween(47, 352, 133, 251)
    this.lineArt = this.add.graphics()
    this.lineArt.lineStyle(1, 0xfff8d5).lineBetween(132, 251, 224, 319)
    this.bobber = this.add.graphics().setPosition(224, 319)
    this.bobber.fillStyle(0xffeed1).fillEllipse(0, 2, 26, 7).fillStyle(0xcf6d61).fillCircle(0, -4, 6)
    this.bobber.lineStyle(2, 0xffe0a2).lineBetween(0, -4, 0, -18)
    g.fillStyle(0xc4c8b1).fillRoundedRect(69, 445, 255, 22, 7)
    g.fillStyle(0x98b594).fillRect(69 + 255 * CONFIG.catchZone[0], 445, 255 * (CONFIG.catchZone[1] - CONFIG.catchZone[0]), 22)
    g.fillStyle(0xf0d281).fillRect(69 + 255 * CONFIG.perfectZone[0], 445, 255 * (CONFIG.perfectZone[1] - CONFIG.perfectZone[0]), 22)
    this.marker = this.add.rectangle(69, 456, 5, 29, 0x315e5b).setVisible(false)
    const button = this.button('', 180, 590, 310, () => this.action())
    button.setData('fishingAction', true)
    this.actionLabel = this.text(180, 590, 'THẢ CÂU', 17).setDepth(5)
    this.text(180, 534, 'Chạm nút khi cá cắn và khi canh nhịp', 13)
  }
  protected updatePlay(delta: number): void {
    if (this.phase === 'ready' || this.phase === 'transition') return
    this.phaseMs -= delta
    if (this.phase === 'waiting' && this.phaseMs <= 0) {
      this.phase = 'bite'; this.phaseMs = CONFIG.biteWindowMs
      this.statusText.setText('CÁ CẮN! CHẠM NGAY!'); this.actionLabel.setText('GIẬT CẦN!'); getSceneFx(this).burst(224, 319, 0xeaffff, 'water')
      return
    }
    if (this.phase === 'bite' && this.phaseMs <= 0) { this.loseFish('CÁ THOÁT MẤT!'); return }
    if (this.phase === 'tension') {
      this.marker.setX(69 + fishingMarker(CONFIG.tensionMs - this.phaseMs) * 255)
      if (this.phaseMs <= 0) this.loseFish('CHẬM TAY! CÁ BƠI XA!')
    }
    this.bobber.setY(this.phase === 'bite' ? 324 : 319)
  }
  private action(): void {
    if (this.phase === 'ready') {
      this.phase = 'waiting'; this.phaseMs = Phaser.Math.Between(CONFIG.waitMs.min, CONFIG.waitMs.max)
      this.fishTier = chooseFishTier(Math.random()); this.statusText.setText('Đợi cá cắn câu…'); this.actionLabel.setText('ĐANG CHỜ…'); this.avatar.setState('work')
    } else if (this.phase === 'bite') {
      this.phase = 'tension'; this.phaseMs = CONFIG.tensionMs; this.marker.setVisible(true).setX(69)
      this.statusText.setText(`CANH NHỊP · ${fishTiers[this.fishTier].name}`); this.actionLabel.setText('KÉO CÁ!')
    } else if (this.phase === 'tension') {
      const result = evaluateCatch(this.fishTier, fishingMarker(CONFIG.tensionMs - this.phaseMs))
      if (!result.caught) { this.loseFish('LỆCH NHỊP! CÁ THOÁT!'); return }
      this.fishCaught++; if (this.fishTier !== 'common') this.rareFishCaught++
      this.countText.setText(`✓ ${this.fishCaught}`)
      this.award(result.points, `+${result.points} ${fishTiers[this.fishTier].name}${result.perfect ? ' · CHUẨN NHỊP!' : ''}`, true)
      getSceneFx(this).burst(224, 319, fishTiers[this.fishTier].color, 'water'); this.nextCast()
    }
  }
  private loseFish(message: string): void { this.award(CONFIG.miss, message, false); this.nextCast() }
  private nextCast(): void {
    this.phase = 'transition'; this.marker.setVisible(false); this.bobber.setY(319)
    this.time.delayedCall(CONFIG.nextCastMs, () => {
      if (this.hasFinished) return
      this.phase = 'ready'; this.statusText.setText('THẢ CÂU ĐỂ BẮT ĐẦU'); this.actionLabel.setText('THẢ CÂU'); this.avatar.setState('idle')
    })
  }
  protected metadata() { return { fishCaught: this.fishCaught, rareFishCaught: this.rareFishCaught } }
  protected cleanupInput(): void { /* Button handlers are removed by the timer shell. */ }
}
