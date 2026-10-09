import Phaser from 'phaser'
import { TimedJobScene } from './TimedJobScene'
import { ACCOUNTANT_CONFIG as C, invoiceSamples, invoiceTotal, invoiceValid, balanceOptions, accountantPatience, balancePoints, vnMoney } from '../config/accountantConfig'
import { getPhaserAvatarData } from '../avatar/avatarData'
import { orderPanel } from '../visual/expansionArt'
import { officeArt, receiptArt } from '../visual/professionArt'
import { getSceneFx } from '../visual/feedbackFx'
import type { Job } from '../../types/job'
import type { GameResult } from '../../types/game'

export class AccountantScene extends TimedJobScene {
  private invoice = invoiceSamples[0]
  private stage: 'check' | 'balance' | 'waiting' = 'check'
  private processed = 0
  private perfect = 0
  private mistakes = 0
  private remaining = 0
  private total = 1
  private options: number[] = []
  private status!: Phaser.GameObjects.Text
  private paper!: Phaser.GameObjects.Text
  private choices: Phaser.GameObjects.Text[] = []
  constructor(job: Job, complete: (result: GameResult) => void, avatar = getPhaserAvatarData()) { super(job, complete, avatar) }
  protected createPlayArea(): void {
    this.avatar.container.setPosition(43, 443)
    orderPanel(this, 'ĐỐI CHIẾU HÓA ĐƠN · CÂN SỔ')
    this.status = this.text(180, 135, '', 17)
    this.text(180, 172, 'Số lượng × đơn giá = thành tiền', 12)
    officeArt(this, 0x65a28e)
    receiptArt(this.add.graphics().setDepth(1))
    this.paper = this.text(199, 291, '', 16).setDepth(3).setLineSpacing(13)
    const calculator = this.add.graphics().setDepth(2)
    calculator.fillStyle(0x749a8e).fillRoundedRect(252, 349, 63, 70, 7).fillStyle(0xd3e5c9).fillRect(260, 356, 47, 15)
    for (let i = 0; i < 9; i++) calculator.fillStyle(0xf4edcf).fillRoundedRect(260 + i % 3 * 16, 380 + Math.floor(i / 3) * 10, 11, 6, 2)
    this.button('HÓA ĐƠN ĐÚNG', 92, 500, 154, () => this.check(true))
    this.button('HÓA ĐƠN SAI', 268, 500, 154, () => this.check(false))
    for (let i = 0; i < 3; i++) {
      this.button('', 64 + i * 116, 580, 104, () => this.balance(i))
      this.choices.push(this.text(64 + i * 116, 580, '', 13).setDepth(6))
    }
    this.text(180, 626, 'Chọn giao dịch đúng tổng để cân sổ', 13)
    this.nextInvoice()
  }
  private nextInvoice(): void {
    this.invoice = Phaser.Utils.Array.GetRandom(invoiceSamples.filter(invoice => invoice !== this.invoice))
    this.stage = 'check'; this.mistakes = 0; this.total = accountantPatience(this.processed) * 1000; this.remaining = this.total
    this.options = Phaser.Utils.Array.Shuffle(balanceOptions(this.invoice))
    this.paper.setText(this.invoice.items.map(item => `${item.name}: ${item.quantity} × ${vnMoney(item.price)}`).join('\n') + `\nGhi trên phiếu: ${vnMoney(this.invoice.claimed)}`)
    this.choices.forEach((label, i) => label.setText(vnMoney(this.options[i])))
    this.status.setText('Phiếu ghi tổng có đúng không?')
  }
  private wrong(): void { this.mistakes++; this.award(C.wrong, '-40 SỔ CHƯA CÂN!', false) }
  private check(valid: boolean): void {
    if (this.stage !== 'check') return
    if (valid !== invoiceValid(this.invoice)) { this.wrong(); return }
    this.stage = 'balance'; this.status.setText('Khớp giao dịch: tổng đúng là bao nhiêu?'); this.avatar.setState('work')
  }
  private balance(index: number): void {
    if (this.stage !== 'balance') return
    if (this.options[index] !== invoiceTotal(this.invoice)) { this.wrong(); return }
    const points = balancePoints(this.mistakes, this.remaining / this.total)
    this.processed++; if (points === C.perfect) this.perfect++
    this.award(points, `+${points} SỔ CÂN!`, true); this.countText.setText(`✓ ${this.processed}`)
    getSceneFx(this).burst(199, 310, 0xa1cda6); this.wait()
  }
  private wait(): void { this.stage = 'waiting'; this.time.delayedCall(C.nextMs, () => { if (!this.hasFinished) this.nextInvoice() }) }
  protected updatePlay(delta: number): void { if (this.stage !== 'waiting') { this.remaining -= delta; if (this.remaining <= 0) { this.award(C.timeout, '-25 PHIẾU CHỜ LÂU!', false); this.wait() } } }
  protected metadata() { return { invoicesProcessed: this.processed, perfectBalances: this.perfect } }
  protected cleanupInput(): void { this.stage = 'waiting' }
}
