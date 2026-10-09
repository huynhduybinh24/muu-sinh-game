import Phaser from 'phaser'
import { TimedJobScene } from './TimedJobScene'
import { DOCTOR_CONFIG as C, careRequests, careTools, careShapes, priorityPatient, carePoints, carePatience, type CareRequest } from '../config/doctorConfig'
import { getPhaserAvatarData } from '../avatar/avatarData'
import { orderPanel } from '../visual/expansionArt'
import { createCustomer, type CustomerVisual } from '../visual/customer'
import { getSceneFx } from '../visual/feedbackFx'
import type { Job } from '../../types/job'
import type { GameResult } from '../../types/game'

export class DoctorScene extends TimedJobScene {
  private requests: CareRequest[] = []
  private stage: 'priority' | 'tool' | 'care' | 'waiting' = 'priority'
  private chosen = 0
  private step = 0
  private helped = 0
  private perfect = 0
  private mistakes = 0
  private remaining = 0
  private total = 1
  private hint!: Phaser.GameObjects.Text
  private status!: Phaser.GameObjects.Text
  private people: CustomerVisual[] = []
  private badges: Phaser.GameObjects.Text[] = []
  private choices: Phaser.GameObjects.Text[] = []
  private waitBars: Phaser.GameObjects.Rectangle[] = []
  constructor(job: Job, complete: (result: GameResult) => void, avatar = getPhaserAvatarData()) { super(job, complete, avatar) }
  protected createPlayArea(): void {
    this.avatar.container.setPosition(46, 474)
    orderPanel(this, 'BỆNH VIỆN HOẠT HÌNH · TRÒ CHƠI GIẢ TƯỞNG')
    this.hint = this.text(180, 132, '', 17)
    this.status = this.text(180, 171, '', 12)
    const hospital = this.add.graphics().setDepth(-1)
    hospital.fillStyle(0xe6f3ec).fillRoundedRect(18, 207, 324, 241, 16)
    hospital.fillStyle(0xb9d9d4).fillRoundedRect(22, 210, 63, 161, 8)
    hospital.fillStyle(0xffffff).fillRoundedRect(39, 222, 29, 47, 4)
    hospital.fillStyle(0xcf9788).fillRect(51, 229, 6, 28).fillRect(43, 240, 23, 6)
    for (let i = 0; i < 2; i++) {
      const x = 130 + i * 138
      hospital.fillStyle(0x8baea9).fillRoundedRect(x - 47, 327, 94, 64, 8).fillRect(x - 40, 384, 8, 23).fillRect(x + 30, 384, 8, 23)
      hospital.fillStyle(0xffffff).fillRoundedRect(x - 43, 323, 86, 31, 6)
      const person = createCustomer(this, x, 289, .65); this.people.push(person)
      this.badges.push(this.text(x, 236, '', 13).setDepth(10))
      this.add.rectangle(x, 307, 104, 175, 0xffffff, 0).setDepth(11).setInteractive({ useHandCursor: true }).on('pointerdown', () => { if (!this.hasFinished) this.selectPatient(i) })
      this.waitBars.push(this.add.rectangle(x - 42, 416, 84, 8, 0x9bbb83).setOrigin(0, .5))
    }
    for (let i = 0; i < 3; i++) {
      this.button('', 64 + i * 116, 563, 104, () => this.choose(i))
      this.choices.push(this.text(64 + i * 116, 563, '', 14).setDepth(6))
    }
    this.text(180, 625, 'Chỉ trò chơi · Không chẩn đoán hay hướng dẫn chữa bệnh', 10)
    this.nextPatients()
  }
  private nextPatients(): void {
    const first = careRequests[Phaser.Math.Between(0, careRequests.length - 1)]
    const others = careRequests.filter(request => request.urgency !== first.urgency)
    this.requests = Phaser.Utils.Array.Shuffle([first, Phaser.Utils.Array.GetRandom(others)])
    this.stage = 'priority'; this.mistakes = 0; this.step = 0
    this.total = carePatience(this.helped) * 1000; this.remaining = this.total
    this.people.forEach(person => person.next())
    this.badges.forEach((badge, i) => badge.setText(['', 'XANH · 1', 'VÀNG · 2', 'ĐỎ · 3'][this.requests[i].urgency]).setColor(['', '#467a6b', '#986d2e', '#b35a53'][this.requests[i].urgency]))
    this.refresh()
  }
  private refresh(): void {
    this.hint.setText(this.stage === 'priority' ? 'Chạm người có mức ưu tiên cao hơn' : this.stage === 'tool' ? `Khách muốn: ${careTools[this.requests[this.chosen].tool]}` : `Ghép vui: ${this.requests[this.chosen].sequence.map(i => careShapes[i]).join(' → ')}`)
    this.status.setText(this.stage === 'priority' ? 'Đỏ 3 > Vàng 2 > Xanh 1 · Chỉ ký hiệu trong game' : this.stage === 'tool' ? 'Chọn đồ vật đúng yêu cầu' : `Chạm ký hiệu thứ ${this.step + 1}`)
    this.choices.forEach((label, i) => label.setText(this.stage === 'care' ? careShapes[i] : careTools[i]))
  }
  private wrong(): void { this.mistakes++; this.award(C.wrong, '-40 CHƯA ĐÚNG YÊU CẦU!', false) }
  private selectPatient(index: number): void {
    if (this.stage !== 'priority') return
    if (index !== priorityPatient(this.requests)) { this.wrong(); return }
    this.chosen = index; this.stage = 'tool'; this.avatar.setState('work'); this.refresh()
  }
  private choose(index: number): void {
    if (this.stage === 'tool') {
      if (index !== this.requests[this.chosen].tool) { this.wrong(); return }
      this.stage = 'care'; this.refresh()
    } else if (this.stage === 'care') {
      if (index !== this.requests[this.chosen].sequence[this.step]) { this.wrong(); this.step = 0; this.refresh(); return }
      this.step++
      if (this.step === this.requests[this.chosen].sequence.length) {
        const points = carePoints(this.remaining, this.total)
        this.helped++; if (this.mistakes === 0 && this.remaining / this.total >= C.perfectRatio) this.perfect++
        this.people[this.chosen].react(true); this.award(points, `+${points} KHÁCH VUI!`, true)
        this.countText.setText(`✓ ${this.helped}`); getSceneFx(this).burst(200, 305, 0x9bcaba); this.wait()
      } else this.refresh()
    }
  }
  private wait(): void { this.stage = 'waiting'; this.time.delayedCall(C.nextMs, () => { if (!this.hasFinished) this.nextPatients() }) }
  protected updatePlay(delta: number): void {
    if (this.stage === 'waiting') return
    this.remaining -= delta; this.waitBars.forEach(bar => bar.setScale(Math.max(0, this.remaining / this.total), 1))
    if (this.remaining <= 0) { this.award(C.timeout, '-25 KHÁCH CHỜ LÂU!', false); this.wait() }
  }
  protected metadata() { return { patientsHelped: this.helped, perfectCare: this.perfect } }
  protected cleanupInput(): void { this.stage = 'waiting' }
}
