import Phaser from 'phaser'
import { TimedJobScene } from './TimedJobScene'
import { IT_CONFIG as C, bugTickets, logicalSteps, itPatience, debugPoints, isLogicalStep } from '../config/itConfig'
import { getPhaserAvatarData } from '../avatar/avatarData'
import { orderPanel } from '../visual/expansionArt'
import { officeArt } from '../visual/professionArt'
import { getSceneFx } from '../visual/feedbackFx'
import { reducedMotion } from '../visual/sceneTheme'
import type { Job } from '../../types/job'
import type { GameResult } from '../../types/game'
import { getShopItem } from '../../data/shop'
import type { ShopItem } from '../../types/shop'

export class ItScene extends TimedJobScene {
  private ticket = bugTickets[0]
  private stage: 'bug' | 'fix' | 'steps' | 'waiting' = 'bug'
  private fixed = 0
  private perfect = 0
  private mistakes = 0
  private step = 0
  private remaining = 0
  private total = 1
  private instruction!: Phaser.GameObjects.Text
  private title!: Phaser.GameObjects.Text
  private rows: Phaser.GameObjects.Text[] = []
  private choices: Phaser.GameObjects.Text[] = []
  private readonly computer: ShopItem | undefined
  constructor(job: Job, complete: (result: GameResult) => void, avatar = getPhaserAvatarData()) {
    super(job, complete, avatar)
    const id = avatar.lifestyle?.computer, item = id ? getShopItem(id) : undefined
    this.computer = item?.style === 'laptop' || item?.style === 'desktop' ? item : undefined
  }
  protected createPlayArea(): void {
    this.avatar.container.setPosition(44, 442)
    orderPanel(this, 'TICKET BUG · LOGIC ĐỜI THƯỜNG')
    this.title = this.text(180, 127, '', 20)
    this.instruction = this.text(180, 166, '', 12)
    officeArt(this, 0x658aa3)
    const g = this.add.graphics().setDepth(1)
    const computerColor = this.computer?.color ? Number.parseInt(this.computer.color.slice(1),16) : 0x375764
    g.fillStyle(computerColor).fillRoundedRect(89, 218, 231, 164, 10)
    if (this.computer) this.text(202,444,this.computer.name,10)
    g.fillStyle(0x93b3ad).fillRoundedRect(170, 382, 61, 10, 3).fillRect(194, 380, 14, 26)
    g.fillStyle(0xa8beb4).fillRoundedRect(97, 402, 209, 19, 4)
    for (let x = 103; x < 298; x += 13) g.lineStyle(1, 0xe7ead6).lineBetween(x, 405, x, 418)
    for (let i = 0; i < 3; i++) {
      const hit = this.add.rectangle(202, 249 + i * 48, 211, 43, 0x527583).setInteractive({ useHandCursor: true }).setDepth(2)
      hit.on('pointerdown', () => { if (!this.hasFinished) this.selectBlock(i) })
      this.rows.push(this.text(201, 249 + i * 48, '', 13, '#fff3ce').setDepth(3))
      this.button('', 180, 514 + i * 53, 326, () => this.choose(i))
      this.choices.push(this.text(180, 514 + i * 53, '', 14).setDepth(6))
    }
    const cursor = this.add.rectangle(303, 231, 5, 9, 0xffd689).setDepth(4)
    if (!reducedMotion()) this.tweens.add({ targets: cursor, alpha: .2, duration: 600, repeat: -1, yoyo: true })
    this.nextTicket()
  }
  private nextTicket(): void {
    this.ticket = Phaser.Utils.Array.GetRandom(bugTickets.filter(ticket => ticket !== this.ticket))
    this.stage = 'bug'; this.step = 0; this.mistakes = 0
    this.total = itPatience(this.fixed) * 1000; this.remaining = this.total
    this.title.setText(this.ticket.title); this.refresh()
  }
  private refresh(): void {
    this.rows.forEach((row, i) => row.setText(`${i + 1}. ${this.ticket.blocks[i]}`))
    this.instruction.setText(this.stage === 'bug' ? 'Chạm dòng có logic sai trên màn hình' : this.stage === 'fix' ? 'Chọn cách sửa đúng bên dưới' : `Nối bước ${this.step + 1}/3: Đọc → Kiểm tra → Hiển thị`)
    this.choices.forEach((label, i) => label.setText(this.stage === 'fix' ? this.ticket.fixes[i] : this.stage === 'steps' ? `${i + 1}. ${logicalSteps[i]}` : '↑ Tìm dòng sai trên màn hình'))
  }
  private wrong(): void { this.mistakes++; this.award(C.wrong, '-30 THỬ LOGIC KHÁC!', false) }
  private selectBlock(index: number): void {
    if (this.stage !== 'bug') return
    this.avatar.setState('work')
    if (index !== this.ticket.broken) { this.wrong(); return }
    this.stage = 'fix'; this.refresh()
  }
  private choose(index: number): void {
    if (this.stage === 'fix') {
      if (index !== this.ticket.fix) { this.wrong(); return }
      this.stage = 'steps'; this.refresh()
    } else if (this.stage === 'steps') {
      if (!isLogicalStep(index, this.step)) { this.wrong(); this.step = 0; this.refresh(); return }
      this.step++
      if (this.step === logicalSteps.length) {
        const points = debugPoints(this.remaining, this.total)
        this.fixed++; if (this.mistakes === 0 && this.remaining / this.total >= .5) this.perfect++
        this.award(points, `+${points} HẾT BUG!`, true); this.countText.setText(`✓ ${this.fixed}`)
        getSceneFx(this).burst(201, 306, 0x9bcaa7); this.wait()
      } else this.refresh()
    }
  }
  private wait(): void { this.stage = 'waiting'; this.time.delayedCall(C.nextMs, () => { if (!this.hasFinished) this.nextTicket() }) }
  protected updatePlay(delta: number): void { if (this.stage !== 'waiting') { this.remaining -= delta; if (this.remaining <= 0) { this.award(C.timeout, '-20 TICKET QUÁ HẠN!', false); this.wait() } } }
  protected metadata() { return { bugsFixed: this.fixed, perfectFixes: this.perfect } }
  protected cleanupInput(): void { this.stage = 'waiting' }
}
