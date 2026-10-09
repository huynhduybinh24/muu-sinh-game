import Phaser from 'phaser'
import { ServiceJobScene } from './ServiceJobScene'
import { BANHMI_CONFIG as C, breadIngredients, breadOrders, breadPatience, emptySandwich, evaluateSandwich, ingredientLabels, type Sandwich, type BreadIngredient } from '../config/banhmiConfig'
import { getFastBonus } from '../config/serviceJobConfig'
import { getPhaserAvatarData } from '../avatar/avatarData'
import { counter, sandwichArt } from '../visual/expansionArt'
import { getSceneFx } from '../visual/feedbackFx'
import type { Job } from '../../types/job'
import type { GameResult } from '../../types/game'

export class BanhmiScene extends ServiceJobScene {
  private order = breadOrders[0]
  private sandwich: Sandwich = emptySandwich()
  private orderText!: Phaser.GameObjects.Text
  private ingredientsText!: Phaser.GameObjects.Text
  private bread!: Phaser.GameObjects.Graphics
  constructor(job: Job, complete: (result: GameResult) => void, avatar = getPhaserAvatarData()) { super(job, complete, avatar, 0xc28c4d) }
  protected createPlayArea(): void {
    this.orderText = this.text(215, 117, '', 18)
    this.ingredientsText = this.text(214, 155, '', 12)
    counter(this, 'BÁNH MÌ NÓNG GIÒN', 0xb57949)
    const cart = this.add.graphics()
    cart.fillStyle(0xe8c17c).fillRoundedRect(77, 258, 252, 77, 14)
    cart.lineStyle(3, 0xffffff, 0.7).strokeRoundedRect(83, 264, 240, 66, 10)
    cart.fillStyle(0xcc8965).fillTriangle(73, 227, 202, 201, 331, 227)
    this.bread = this.add.graphics().setPosition(206, 331).setDepth(3)
    breadIngredients.forEach((id, i) => this.button(ingredientLabels[id], 66 + (i % 3) * 114, 510 + Math.floor(i / 3) * 55, 104, () => this.addIngredient(id)))
    this.button('LÀM LẠI', 294, 565, 104, () => this.resetBread())
    this.button('GIAO KHÁCH', 180, 620, 326, () => this.serve())
  }
  protected startRound(): void {
    this.order = Phaser.Utils.Array.GetRandom(breadOrders.filter(order => order !== this.order))
    this.orderText.setText(this.order.name)
    this.ingredientsText.setText(this.order.ingredients.map(id => ingredientLabels[id]).join(' · ')).setWordWrapWidth(239)
    this.resetBread(); this.beginRound(breadPatience(this.completedCustomers))
  }
  private resetBread(): void { this.sandwich = emptySandwich(); sandwichArt(this.bread, this.sandwich) }
  private addIngredient(id: BreadIngredient): void {
    this.sandwich[id] = !this.sandwich[id]; this.work(); sandwichArt(this.bread, this.sandwich)
    getSceneFx(this).burst(205, 327, 0xffd991)
  }
  private serve(): void {
    const correct = evaluateSandwich(this.sandwich, this.order.ingredients)
    const bonus = correct ? getFastBonus(this.roundRemainingMs, this.roundTotalMs, C.speedBonus) : 0
    if (correct) this.completedCustomers++
    this.award((correct ? C.correct : C.wrong) + bonus, correct ? `+100 GIÒN NGON! +${bonus} NHANH` : '-50 SAI NHÂN!', correct)
    this.nextRound(C.nextMs)
  }
  protected onRoundTimeout(): void { this.award(C.timeout, '-30 BÁNH NGUỘI RỒI!', false); this.nextRound(C.nextMs) }
  protected resultMetadata() { return { customersServed: this.completedCustomers } }
}

