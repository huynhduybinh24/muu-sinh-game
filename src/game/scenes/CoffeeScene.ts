import Phaser from 'phaser'
import { ServiceJobScene } from './ServiceJobScene'
import { getPhaserAvatarData } from '../avatar/avatarData'
import { COFFEE_CONFIG as CONFIG, coffeeRecipes, emptyCoffeeCup, extractionGrade, evaluateCoffee, type CoffeeCup, type CoffeeRecipe, type CoffeeIngredient } from '../config/coffeeConfig'
import { getFastBonus } from '../config/serviceJobConfig'
import { getSceneFx } from '../visual/feedbackFx'
import type { GameResult } from '../../types/game'
import type { Job } from '../../types/job'

export class CoffeeScene extends ServiceJobScene {
  private recipe: CoffeeRecipe = coffeeRecipes[0]
  private cup: CoffeeCup = emptyCoffeeCup()
  private extracting = false
  private extractionMs = 0
  private stoppedRatio: number | null = null
  private perfectBrews = 0
  private orderText!: Phaser.GameObjects.Text
  private recipeText!: Phaser.GameObjects.Text
  private brewText!: Phaser.GameObjects.Text
  private meter!: Phaser.GameObjects.Rectangle
  private cupArt!: Phaser.GameObjects.Graphics
  constructor(job: Job, onComplete: (result: GameResult) => void, avatarData = getPhaserAvatarData()) { super(job, onComplete, avatarData, 0x99705a) }
  protected createPlayArea(): void {
    this.orderText = this.text(210, 118, '', 20); this.recipeText = this.text(210, 154, '', 11)
    this.text(210, 177, 'Đá có trong cả ba món', 11)
    const g = this.add.graphics()
    g.fillStyle(0x3b403b, 0.12).fillEllipse(215, 405, 123, 14)
    g.fillStyle(0xf5f0e0).fillRoundedRect(166, 304, 98, 91, 15)
    g.lineStyle(4, 0x89958a).strokeRoundedRect(166, 304, 98, 91, 15)
    g.fillStyle(0xadb7b3).fillRoundedRect(174, 263, 82, 48, 10).fillRoundedRect(164, 256, 102, 9, 4)
    g.fillStyle(0x718780).fillRoundedRect(180, 275, 70, 7, 3)
    this.cupArt = this.add.graphics()
    this.brewText = this.text(212, 421, 'Chọn nguyên liệu → BẮT ĐẦU PHA', 11)
    g.fillStyle(0xbab5aa).fillRoundedRect(85, 239, 238, 16, 5)
    g.fillStyle(0xe5b56d).fillRect(85 + 238 * CONFIG.acceptableZone[0], 239, 238 * (CONFIG.acceptableZone[1] - CONFIG.acceptableZone[0]), 16)
    g.fillStyle(0x71a58b).fillRect(85 + 238 * CONFIG.perfectZone[0], 239, 238 * (CONFIG.perfectZone[1] - CONFIG.perfectZone[0]), 16)
    this.meter = this.add.rectangle(85, 247, 5, 25, 0x3b514c).setDepth(5)
    this.button('THÊM SỮA', 91, 508, 158, () => this.addIngredient('condensed'))
    this.button('THÊM SỮA TƯƠI', 269, 508, 158, () => this.addIngredient('fresh'))
    this.button('THÊM ĐÁ', 91, 562, 158, () => this.addIngredient('ice'))
    this.button('LÀM LẠI', 269, 562, 158, () => this.resetCup())
    this.button('BẮT ĐẦU PHA', 76, 617, 122, () => this.startExtraction())
    this.button('DỪNG', 191, 617, 90, () => this.stopExtraction())
    this.button('GIAO KHÁCH', 294, 617, 108, () => this.serve())
  }
  protected startRound(): void {
    this.recipe = Phaser.Utils.Array.GetRandom(coffeeRecipes.filter((recipe) => recipe.id !== this.recipe.id))
    this.orderText.setText(this.recipe.name)
    this.recipeText.setText(['Cà phê', this.recipe.condensed ? 'sữa đặc' : '', this.recipe.fresh ? 'sữa tươi' : '', 'đá'].filter(Boolean).join(' · '))
    this.resetCup(); this.beginRound(Phaser.Math.Between(CONFIG.patience.min, CONFIG.patience.max))
  }
  update(time: number, delta: number): void {
    super.update(time, delta)
    if (!this.extracting || !this.roundActive || this.hasFinished) return
    this.extractionMs = Math.min(CONFIG.extractionMs, this.extractionMs + delta)
    this.meter.setX(85 + this.extractionMs / CONFIG.extractionMs * 238)
    this.renderCup()
    if (this.extractionMs === CONFIG.extractionMs) this.stopExtraction()
  }
  private addIngredient(id: CoffeeIngredient): void {
    if (this.extracting) return
    this.cup[id] = true; this.work(); this.renderCup(); getSceneFx(this).burst(214, 337, 0xead0a3, 'water')
  }
  private resetCup(): void {
    this.cup = emptyCoffeeCup(); this.extracting = false; this.extractionMs = 0; this.stoppedRatio = null
    this.meter.setX(85); this.brewText.setText('Chọn nguyên liệu → BẮT ĐẦU PHA'); this.avatar.setState('idle'); this.renderCup()
  }
  private startExtraction(): void {
    if (this.extracting || this.stoppedRatio !== null) return
    this.extracting = true; this.extractionMs = 0; this.brewText.setText('DỪNG trong vùng xanh để pha chuẩn!'); this.avatar.setState('work')
  }
  private stopExtraction(): void {
    if (!this.extracting) return
    this.extracting = false; this.stoppedRatio = this.extractionMs / CONFIG.extractionMs
    const labels = { perfect: 'PHA CHUẨN!', acceptable: 'TẠM ỔN', weak: 'DỪNG SỚM · NHẠT', bitter: 'DỪNG MUỘN · ĐẮNG' }
    this.brewText.setText(labels[extractionGrade(this.stoppedRatio)]); this.avatar.setState('idle'); this.renderCup()
  }
  private renderCup(): void {
    const fill = Math.min(1, this.extractionMs / (CONFIG.extractionMs * 0.5))
    this.cupArt.clear()
    if (fill > 0) this.cupArt.fillStyle(this.cup.fresh ? 0xc7a982 : this.cup.condensed ? 0xb68d65 : 0x694d40).fillRoundedRect(173, 387 - 61 * fill, 84, 61 * fill, 7)
    if (this.cup.condensed) this.cupArt.fillStyle(0xf1d7a5).fillRoundedRect(173, 374, 84, 13, 5)
    if (this.cup.fresh) this.cupArt.fillStyle(0xfff4dc, 0.65).fillRoundedRect(173, 359, 84, 14, 4)
    if (this.cup.ice) this.cupArt.fillStyle(0xeaf5f2, 0.8).fillRoundedRect(184, 333, 15, 13, 3).fillRoundedRect(226, 344, 15, 13, 3)
    if (this.extracting) this.cupArt.fillStyle(0x7d5b47).fillCircle(214, 316 + this.extractionMs % 150 / 150 * 15, 3)
  }
  private serve(): void {
    if (this.extracting) { this.brewText.setText('DỪNG trước khi giao khách!'); return }
    const result = evaluateCoffee(this.cup, this.recipe, this.stoppedRatio)
    const success = result.grade !== 'wrong'
    const bonus = success ? getFastBonus(this.roundRemainingMs, this.roundTotalMs, CONFIG.fastBonus) : 0
    if (success) this.completedCustomers++
    if (result.grade === 'perfect') this.perfectBrews++
    this.award(result.points + bonus, success ? `+${result.points} CÀ PHÊ NGON! +${bonus} NHANH` : '-50 SAI MÓN / SAI NHỊP!', success)
    this.nextRound(CONFIG.nextCustomerMs)
  }
  protected onRoundTimeout(): void { this.extracting = false; this.award(CONFIG.timeout, '-30 KHÁCH CHỜ LÂU!', false); this.nextRound(CONFIG.nextCustomerMs) }
  protected resultMetadata() { return { customersServed: this.completedCustomers, perfectBrews: this.perfectBrews } }
}
