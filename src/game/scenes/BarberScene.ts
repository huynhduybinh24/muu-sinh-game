import Phaser from 'phaser'
import { ServiceJobScene } from './ServiceJobScene'
import { getPhaserAvatarData } from '../avatar/avatarData'
import { BARBER_CONFIG as CONFIG, compareHaircut, haircutPatterns, type HaircutPattern } from '../config/barberConfig'
import { getFastBonus } from '../config/serviceJobConfig'
import { playAudioCue } from '../../services/audioFeedback'
import type { GameResult } from '../../types/game'
import type { Job } from '../../types/job'
import { getSceneFx } from '../visual/feedbackFx'
import { reducedMotion } from '../visual/sceneTheme'

export class BarberScene extends ServiceJobScene {
  private pattern: HaircutPattern = haircutPatterns[0]
  private sections: boolean[] = []
  private perfectHaircuts = 0
  private targetText!: Phaser.GameObjects.Text
  private targetSections: Phaser.GameObjects.Rectangle[] = []
  private hairSections: Phaser.GameObjects.Rectangle[] = []
  private hairArt: Phaser.GameObjects.Graphics[] = []
  private snipArt!: Phaser.GameObjects.Graphics
  private headArt!: Phaser.GameObjects.Graphics

  constructor(job: Job, onComplete: (result: GameResult) => void, avatarData = getPhaserAvatarData()) {
    super(job, onComplete, avatarData, 0x8258a6)
  }

  protected createPlayArea(): void {
    this.targetText = this.text(207, 108, '', 15)
    this.text(282, 165, 'Tối: giữ\nNhạt: cắt', 11)
    this.headArt = this.add.graphics()
    this.snipArt = this.add.graphics().setDepth(11).setVisible(false)
    this.snipArt.lineStyle(3, 0xe6efef).lineBetween(-13, -13, 12, 11).lineBetween(13, -13, -12, 11)
    this.snipArt.lineStyle(3, 0x7d6b9a).strokeCircle(-13, -12, 5).strokeCircle(13, -12, 5)
    for (let index = 0; index < CONFIG.sectionCount; index++) {
      this.targetSections.push(this.add.rectangle(140 + index % 3 * 25, 144 + Math.floor(index / 3) * 24, 21, 20, 0x49312c)
        .setStrokeStyle(1, 0x382252))
      const hair = this.add.rectangle(110 + index % 3 * 76, 263 + Math.floor(index / 3) * 60, 68, 54, 0x49312c)
        .setStrokeStyle().setFillStyle(0x49312c, 0).setInteractive({ useHandCursor: true }).setData('hairSection', index)
      const art = this.add.graphics().setPosition(hair.x, hair.y)
      this.hairArt.push(art)
      hair.on('pointerdown', () => this.cutSection(index))
      this.hairSections.push(hair)
    }
    this.text(204, 504, 'CHẠM Ô TÓC ĐỂ CẮT', 15)
    this.text(180, 534, 'Cắt đúng mẫu • Không cần vẽ', 12)
    this.button('XONG →', 180, 598, 308, () => this.completeHaircut())
  }

  protected startRound(): void {
    this.pattern = Phaser.Utils.Array.GetRandom(haircutPatterns.filter((pattern) => pattern.id !== this.pattern.id))
    this.sections = Array.from({ length: CONFIG.sectionCount }, () => true)
    this.targetText.setText(`MẪU: ${this.pattern.name}`)
    this.hairSections.forEach((shape) => shape.setAlpha(1).setFillStyle(0x49312c, 0))
    this.hairArt.forEach((art) => art.setVisible(true).setAlpha(1))
    this.beginRound(Phaser.Math.Between(CONFIG.patienceSeconds.min, CONFIG.patienceSeconds.max))
    const palette = this.customer.colors()
    this.renderHead(palette.skin, palette.shirt)
    this.targetSections.forEach((shape, index) => shape.setFillStyle(this.pattern.keep[index] ? palette.hair : 0xfaf5ff))
    this.hairArt.forEach((art, index) => {
      art.clear().fillStyle(palette.hair).fillRoundedRect(-38, -30, 76, 60, index < 3 ? { tl: 24, tr: 24, bl: 3, br: 3 } : { tl: 4, tr: 4, bl: 18, br: 18 })
      art.lineStyle(2, 0xd8b28e, 0.38)
      for (let line = -20; line <= 20; line += 10) art.beginPath().moveTo(line, -19).lineTo(line - 4, -5).lineTo(line - 6, 17).strokePath()
      art.lineStyle(1, 0x251e28, 0.28).lineBetween(-36, -16, -36, 15)
    })
  }

  private renderHead(skin: number, shirt: number): void {
    const head = this.headArt.clear()
    head.fillStyle(shirt).fillRoundedRect(112, 398, 149, 43, 17)
    head.fillStyle(0xffffff, 0.2).fillRoundedRect(116, 402, 141, 10, 5)
    head.fillStyle(skin).fillEllipse(186, 347, 237, 174).fillEllipse(66, 350, 21, 34).fillEllipse(306, 350, 21, 34)
    head.lineStyle(2, 0x574b52, 0.3).strokeEllipse(186, 347, 237, 174)
    head.fillStyle(0xeab297, 0.5).fillEllipse(143, 384, 28, 13).fillEllipse(230, 384, 28, 13)
    head.fillStyle(0x493647).fillEllipse(151, 370, 9, 12).fillEllipse(221, 370, 9, 12)
    head.fillStyle(0xffffff).fillCircle(153, 367, 2).fillCircle(223, 367, 2)
    head.lineStyle(2, 0x7d5757).beginPath().moveTo(173, 396).lineTo(186, 400).lineTo(199, 396).strokePath()
    head.lineStyle(2, 0x7d5757, 0.4).lineBetween(184, 380, 181, 386)
  }

  private cutSection(index: number): void {
    if (!this.roundActive || this.hasFinished || !this.sections[index]) return
    this.sections[index] = false
    this.hairSections[index].setFillStyle(0xf0bd96, 0)
    this.hairArt[index].setAlpha(0.12)
    const section = this.hairSections[index]
    getSceneFx(this).burst(section.x, section.y, 0x80594c, 'dust')
    if (!reducedMotion()) {
      this.tweens.killTweensOf(this.snipArt)
      this.snipArt.setPosition(section.x, section.y).setAngle(-15).setAlpha(1).setVisible(true)
      this.tweens.add({ targets: this.snipArt, angle: 15, alpha: 0, duration: 170, onComplete: () => this.snipArt.setVisible(false) })
    }
    this.work()
    playAudioCue('click')
  }

  private completeHaircut(): void {
    const placement = compareHaircut(this.sections, this.pattern)
    const success = placement.grade !== 'bad'
    const bonus = success ? getFastBonus(this.roundRemainingMs, this.roundTotalMs, CONFIG.maximumFastBonus) : 0
    if (success) this.completedCustomers++
    if (placement.grade === 'perfect') this.perfectHaircuts++
    if (success) getSceneFx(this).burst(292, 286, 0xffdd97)
    const label = { perfect: 'CHUẨN MẪU!', good: 'TÓC ĐẸP!', acceptable: 'TẠM ỔN!', bad: 'LỆCH MẪU!' }[placement.grade]
    this.award(placement.points + bonus, `${success ? '+' : ''}${placement.points} ${label}${success ? ` +${bonus} NHANH TAY` : ''}`, success)
    this.nextRound(CONFIG.nextCustomerMs)
  }

  protected onRoundTimeout(): void {
    this.award(CONFIG.timeout, '-30 KHÁCH CHỜ LÂU QUÁ!', false)
    this.nextRound(CONFIG.nextCustomerMs)
  }
  protected resultMetadata() { return { customersServed: this.completedCustomers, perfectHaircuts: this.perfectHaircuts } }
  protected cleanupExtras(): void { this.hairSections.forEach((shape) => shape.removeAllListeners()) }
}
