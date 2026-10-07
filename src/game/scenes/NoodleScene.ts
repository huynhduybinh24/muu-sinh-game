import Phaser from 'phaser'
import { ServiceJobScene } from './ServiceJobScene'
import { getPhaserAvatarData } from '../avatar/avatarData'
import {
  NOODLE_CONFIG as CONFIG, emptyNoodleBowl, isCorrectBowl, noodleIngredients, noodleRecipes,
  type NoodleBowl, type NoodleRecipe, type NoodleIngredient,
} from '../config/noodleConfig'
import { getFastBonus } from '../config/serviceJobConfig'
import type { GameResult } from '../../types/game'
import type { Job } from '../../types/job'
import { getSceneFx } from '../visual/feedbackFx'
import { reducedMotion } from '../visual/sceneTheme'

export class NoodleScene extends ServiceJobScene {
  private recipe: NoodleRecipe = noodleRecipes[0]
  private bowl: NoodleBowl = emptyNoodleBowl()
  private orderText!: Phaser.GameObjects.Text
  private ingredientText!: Phaser.GameObjects.Text
  private bowlText!: Phaser.GameObjects.Text
  private bowlFill!: Phaser.GameObjects.Ellipse
  private bowlArt!: Phaser.GameObjects.Graphics
  private servingArt!: Phaser.GameObjects.Graphics

  constructor(job: Job, onComplete: (result: GameResult) => void, avatarData = getPhaserAvatarData()) {
    super(job, onComplete, avatarData, 0xbe7130)
  }

  protected createPlayArea(): void {
    this.text(210, 107, 'KHÁCH GỌI', 11)
    this.orderText = this.text(210, 137, '', 20)
    this.ingredientText = this.text(210, 173, '', 11)
    const props = this.add.graphics()
    props.fillStyle(0xb98259).fillRoundedRect(95, 408, 245, 32, 9)
    props.fillStyle(0xe8bc82).fillRoundedRect(95, 408, 245, 8, 4)
    props.fillStyle(0xb7c5c1).fillRoundedRect(30, 293, 83, 62, 15)
    props.fillStyle(0x566e64).fillEllipse(71, 294, 83, 27)
    props.fillStyle(0xe5c787).fillEllipse(71, 294, 65, 17)
    props.lineStyle(4, 0xb7c5c1).lineBetween(25, 306, 17, 323).lineBetween(116, 306, 123, 323)
    props.fillStyle(0x526a58).fillRoundedRect(46, 359, 49, 10, 4)
    const steam = this.add.graphics().setAlpha(0.48)
    steam.lineStyle(3, 0xffffff).beginPath().moveTo(50, 281).lineTo(55, 267).lineTo(51, 254).strokePath()
    steam.beginPath().moveTo(75, 276).lineTo(80, 261).lineTo(77, 249).strokePath()
    if (!reducedMotion()) this.tweens.add({ targets: steam, y: -7, alpha: 0.15, duration: 1400, yoyo: true, repeat: -1 })
    props.fillStyle(0x46505a, 0.13).fillEllipse(219, 386, 165, 17)
    props.fillStyle(0xe5e8de).fillEllipse(219, 358, 180, 85)
    props.fillStyle(0xf9fcf2).fillEllipse(219, 343, 178, 55)
    props.lineStyle(2, 0x759e9b).strokeEllipse(219, 343, 178, 55)
    props.lineStyle(2, 0x92b5ae).beginPath().moveTo(154, 365).lineTo(177, 380).lineTo(261, 380).lineTo(284, 365).strokePath()
    this.bowlFill = this.add.ellipse(219, 342, 161, 43, 0xe4ded2)
    this.bowlArt = this.add.graphics()
    this.servingArt = this.add.graphics().setDepth(9).setVisible(false)
    this.bowlText = this.text(219, 379, '', 10)
    this.text(219, 395, 'TÔ HỦ TIẾU CỦA BẠN', 11)
    noodleIngredients.forEach((ingredient, index) => {
      this.button(`${ingredient.icon} ${ingredient.label}`, index % 2 ? 269 : 91,
        515 + Math.floor(index / 2) * 56, 158, () => this.addIngredient(ingredient.id))
    })
    this.button('↺ LÀM LẠI', 91, 627, 158, () => { this.bowl = emptyNoodleBowl(); this.renderBowl() })
    this.button('GIAO KHÁCH →', 269, 627, 158, () => this.serve())
  }

  protected startRound(): void {
    const choices = noodleRecipes.filter((recipe) => recipe.id !== this.recipe.id)
    this.recipe = Phaser.Utils.Array.GetRandom(choices)
    this.bowl = emptyNoodleBowl()
    this.orderText.setText(this.recipe.name)
    this.ingredientText.setText(noodleIngredients.filter(({ id }) => this.recipe.ingredients.includes(id))
      .map(({ label }) => label.replace('THÊM ', '')).join(' · '))
    this.renderBowl()
    this.beginRound(Phaser.Math.Between(CONFIG.patienceSeconds.min, CONFIG.patienceSeconds.max))
  }

  private addIngredient(id: NoodleIngredient): void {
    this.bowl[id] = true
    this.work()
    this.renderBowl()
    getSceneFx(this).burst(219, 338, 0xf0d28a, 'water')
  }

  private renderBowl(): void {
    this.bowlFill.setFillStyle(this.bowl.broth ? 0xe9b558 : 0xe4ded2)
    this.bowlText.setText(this.bowl.broth ? 'NƯỚC DÙNG NÓNG' : '')
    this.bowlArt.clear()
    if (this.bowl.noodles) {
      this.bowlArt.lineStyle(3, 0xffefbc)
      for (let i = 0; i < 5; i++) this.bowlArt.beginPath().moveTo(169 + i * 7, 340).lineTo(180 + i * 7, 332).lineTo(205 + i * 7, 343).lineTo(243 + i * 5, 333).strokePath()
    }
    if (this.bowl.meat) {
      this.bowlArt.fillStyle(0xd6a091).fillEllipse(190, 338, 26, 11).fillEllipse(245, 348, 24, 12)
      this.bowlArt.lineStyle(2, 0xf2c9b6).lineBetween(180, 338, 199, 338)
    }
    if (this.bowl.vegetables) {
      for (let i = 0; i < 6; i++) this.bowlArt.fillStyle(i % 2 ? 0x619f53 : 0x86b95c).fillEllipse(202 + i * 9, 334 + i % 3 * 5, 13, 5)
    }
  }

  private serve(): void {
    const correct = isCorrectBowl(this.bowl, this.recipe)
    const bonus = correct ? getFastBonus(this.roundRemainingMs, this.roundTotalMs, CONFIG.maximumFastBonus) : 0
    if (correct) this.completedCustomers++
    if (!reducedMotion()) {
      this.tweens.killTweensOf(this.servingArt)
      this.servingArt.clear().setPosition(219, 342).setScale(1).setAlpha(1).setVisible(true)
      this.servingArt.fillStyle(0xfafff0).fillEllipse(0, 0, 130, 42).fillStyle(0xe5ba79).fillEllipse(0, -3, 112, 28)
      this.tweens.add({ targets: this.servingArt, x: 56, y: 174, scale: 0.3, alpha: 0, duration: 260, onComplete: () => this.servingArt.setVisible(false) })
    }
    this.award(correct ? CONFIG.correct + bonus : CONFIG.wrong,
      correct ? `+100 ĐÚNG MÓN! +${bonus} NHANH TAY` : '-50 SAI MÓN!', correct)
    this.nextRound(CONFIG.nextCustomerMs)
  }

  protected onRoundTimeout(): void {
    this.award(CONFIG.timeout, '-30 KHÁCH BỎ ĐI!', false)
    this.nextRound(CONFIG.nextCustomerMs)
  }
  protected resultMetadata() { return { customersServed: this.completedCustomers } }
}
