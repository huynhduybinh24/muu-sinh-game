import Phaser from 'phaser'
import { ServiceJobScene } from './ServiceJobScene'
import { getPhaserAvatarData } from '../avatar/avatarData'
import { MECHANIC_CONFIG as CONFIG, mechanicProblems, mechanicTools, matchesRepair, type MechanicProblem, type MechanicTool } from '../config/mechanicConfig'
import { getFastBonus } from '../config/serviceJobConfig'
import { getSceneFx } from '../visual/feedbackFx'
import { reducedMotion } from '../visual/sceneTheme'
import type { GameResult } from '../../types/game'
import type { Job } from '../../types/job'

export class MechanicScene extends ServiceJobScene {
  private problem: MechanicProblem = mechanicProblems[0]
  private symptomText!: Phaser.GameObjects.Text
  private problemText!: Phaser.GameObjects.Text
  private repairing = false
  private vehiclesRepaired = 0
  private correctRepairs = 0
  private repairArt!: Phaser.GameObjects.Graphics
  constructor(job: Job, onComplete: (result: GameResult) => void, avatarData = getPhaserAvatarData()) { super(job, onComplete, avatarData, 0x55859a) }
  protected createPlayArea(): void {
    this.problemText = this.text(208, 115, '', 18)
    this.symptomText = this.text(208, 155, '', 12)
    this.text(208, 178, 'Chọn đúng dụng cụ bên dưới', 11)
    const g = this.add.graphics()
    g.fillStyle(0x3b4a54, 0.15).fillEllipse(206, 425, 249, 19)
    g.fillStyle(0x35414b).fillCircle(135, 386, 34).fillCircle(277, 386, 34)
    g.fillStyle(0xb1bdc3).fillCircle(135, 386, 17).fillCircle(277, 386, 17)
    g.lineStyle(8, 0xcb815e).lineBetween(134, 384, 187, 342).lineBetween(187, 342, 261, 372)
    g.fillStyle(0x6c9caa).fillRoundedRect(161, 322, 100, 49, 15)
    g.fillStyle(0x38444f).fillRoundedRect(168, 312, 73, 10, 4)
    g.lineStyle(7, 0x869a9d).lineBetween(260, 373, 254, 291).lineBetween(246, 292, 278, 292)
    g.fillStyle(0xffe5a2).fillCircle(265, 310, 12)
    g.lineStyle(3, 0xe1d3b6).lineBetween(124, 400, 244, 400)
    g.fillStyle(0x536f79).fillRoundedRect(98, 268, 152, 18, 5)
    this.repairArt = this.add.graphics().setPosition(210, 339).setDepth(8).setVisible(false)
    this.repairArt.lineStyle(4, 0xf9e5ac).lineBetween(-11, -11, 11, 11).strokeCircle(-11, -11, 7)
    mechanicTools.forEach((tool, index) => this.button(tool.label, index % 2 ? 269 : 91, 532 + Math.floor(index / 2) * 61, 158, () => this.repair(tool.id)))
    this.text(180, 635, 'Mỗi triệu chứng cần một dụng cụ', 12)
  }
  protected startRound(): void {
    this.repairing = false
    this.problem = Phaser.Utils.Array.GetRandom(mechanicProblems.filter((entry) => entry.id !== this.problem.id))
    this.problemText.setText(this.problem.name); this.symptomText.setText(this.problem.symptom)
    this.beginRound(Phaser.Math.Between(CONFIG.patience.min, CONFIG.patience.max))
  }
  private repair(tool: MechanicTool): void {
    if (this.repairing || !this.roundActive || this.hasFinished) return
    this.repairing = true
    this.roundActive = false // Commit one tool choice; patience pauses only during the short repair animation.
    const correct = matchesRepair(this.problem, tool)
    const bonus = correct ? getFastBonus(this.roundRemainingMs, this.roundTotalMs, CONFIG.fastBonus) : 0
    this.avatar.setState('work'); this.repairArt.setVisible(true)
    if (!reducedMotion()) this.tweens.add({ targets: this.repairArt, angle: 20, duration: 90, yoyo: true, repeat: 1 })
    this.time.delayedCall(CONFIG.repairMs, () => {
      if (this.hasFinished) return
      this.repairArt.setVisible(false)
      if (correct) { this.vehiclesRepaired++; this.correctRepairs++; this.completedCustomers++; getSceneFx(this).burst(233, 355, 0xffe4a5) }
      this.award(correct ? CONFIG.correct + bonus : CONFIG.wrong, correct ? `+100 SỬA ĐÚNG! +${bonus} NHANH` : '-40 SAI DỤNG CỤ!', correct)
      this.nextRound(CONFIG.nextVehicleMs)
    })
  }
  protected onRoundTimeout(): void { this.repairArt.setVisible(false); this.award(CONFIG.timeout, '-25 KHÁCH CHỜ LÂU!', false); this.nextRound(CONFIG.nextVehicleMs) }
  protected resultMetadata() { return { vehiclesRepaired: this.vehiclesRepaired, correctRepairs: this.correctRepairs } }
}
