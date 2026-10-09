import Phaser from 'phaser'
import { ServiceJobScene } from './ServiceJobScene'
import { CASHIER_CONFIG as C, groceries, checkoutTotal, checkoutPayment, checkoutCorrect, changeOptions, cashierDifficulty, type Grocery } from '../config/cashierConfig'
import { getFastBonus } from '../config/serviceJobConfig'
import { getPhaserAvatarData } from '../avatar/avatarData'
import { counter } from '../visual/expansionArt'
import { panel } from '../visual/environment'
import { getSceneFx } from '../visual/feedbackFx'
import type { Job } from '../../types/job'
import type { GameResult } from '../../types/game'

export class CashierScene extends ServiceJobScene {
  private products: Grocery[] = []
  private scanned = 0
  private total = 0
  private payment = 50000
  private choices: number[] = []
  private correct = 0
  private receipt!: Phaser.GameObjects.Text
  private request!: Phaser.GameObjects.Text
  private itemLabel!: Phaser.GameObjects.Text
  private item!: Phaser.GameObjects.Graphics
  private choiceLabels: Phaser.GameObjects.Text[] = []
  constructor(job: Job, complete: (result: GameResult) => void, avatar = getPhaserAvatarData()) { super(job, complete, avatar, 0x629584) }
  protected createPlayArea(): void {
    this.request = this.text(213, 121, '', 18); this.text(214, 166, 'Quét hết hàng → tính tiền thừa', 12)
    counter(this, 'SIÊU THỊ PHỐ NHỎ', 0x63927e)
    const belt = panel(this, 169, 310, 261, 104, 0x78968c)
    belt.lineStyle(2, 0xc4d6c5)
    for (let x = 55; x < 275; x += 28) belt.lineBetween(x, 268, x, 351)
    panel(this, 280, 419, 103, 63, 0x5d7271)
    this.receipt = this.text(270, 420, '', 12, '#f8efd1')
    this.item = this.add.graphics().setPosition(170, 305).setDepth(3)
    this.itemLabel = this.text(170, 362, '', 14)
    this.button('QUÉT MÃ', 180, 511, 326, () => this.scan())
    for (let i = 0; i < 3; i++) { this.button('', 64 + i * 116, 578, 104, () => this.checkout(i)); this.choiceLabels.push(this.text(64 + i * 116, 578, '', 13).setDepth(6)) }
    this.text(180, 624, 'Chạm số tiền thừa đúng để hoàn tất', 13)
  }
  protected startRound(): void {
    const difficulty = cashierDifficulty(this.completedCustomers)
    this.products = Array.from({ length: difficulty.count }, () => groceries[Phaser.Math.Between(0, groceries.length - 1)])
    this.scanned = 0; this.total = checkoutTotal(this.products); this.payment = checkoutPayment(this.total)
    this.choices = Phaser.Utils.Array.Shuffle(changeOptions(this.total, this.payment))
    this.choiceLabels.forEach((label, i) => label.setText(this.money(this.choices[i])))
    this.request.setText(`Khách đưa: ${this.money(this.payment)}`)
    this.beginRound(difficulty.seconds); this.drawItem(); this.refreshReceipt()
  }
  private money(amount: number): string { return new Intl.NumberFormat('vi-VN').format(amount) + 'đ' }
  private refreshReceipt(): void {
    const subtotal = checkoutTotal(this.products.slice(0, this.scanned))
    this.receipt.setText(`QUÉT ${this.scanned}/${this.products.length}\n${this.money(subtotal)}`)
  }
  private drawItem(): void {
    this.item.clear()
    const product = this.products[this.scanned]
    if (!product) { this.itemLabel.setText('ĐÃ QUÉT HẾT HÀNG'); return }
    this.item.fillStyle(0x455a51, 0.15).fillEllipse(0, 35, 77, 14)
    if (product.id === 'apple') this.item.fillStyle(product.color).fillCircle(-8, 0, 24).fillCircle(13, -3, 22).lineStyle(4, 0x6b8d66).lineBetween(0, -22, 8, -33)
    else {
      this.item.fillStyle(product.color).fillRoundedRect(-28, -38, 56, 75, product.id === 'bread' ? 20 : 7)
      this.item.fillStyle(0xfff4da).fillRoundedRect(-23, -16, 46, 29, 4)
      this.item.lineStyle(2, 0x3c5458)
      for (let x = -15; x < 17; x += 5) this.item.lineBetween(x, -7, x, 7)
    }
    this.itemLabel.setText(`${product.name} · ${this.money(product.price)}`)
  }
  private scan(): void {
    if (this.scanned >= this.products.length) return
    this.scanned++; this.work(); getSceneFx(this).burst(170, 305, 0xa2d0b6)
    this.drawItem(); this.refreshReceipt()
  }
  private checkout(index: number): void {
    const correct = checkoutCorrect(this.scanned, this.products.length, this.choices[index], this.total, this.payment)
    const bonus = correct ? getFastBonus(this.roundRemainingMs, this.roundTotalMs, C.speedBonus) : 0
    if (correct) { this.completedCustomers++; this.correct++ }
    this.award((correct ? C.correct : C.wrong) + bonus, correct ? `+100 ĐÚNG TIỀN! +${bonus} NHANH` : '-40 SAI TIỀN / CHƯA QUÉT!', correct)
    this.nextRound(C.nextMs)
  }
  protected onRoundTimeout(): void { this.award(C.timeout, '-25 KHÁCH ĐỢI LÂU!', false); this.nextRound(C.nextMs) }
  protected resultMetadata() { return { customersServed: this.completedCustomers, correctCheckouts: this.correct } }
}

