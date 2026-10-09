import Phaser from 'phaser'
import { TimedJobScene } from './TimedJobScene'
import { TEACHER_CONFIG as C, lessonQuestions, lessonSteps, schoolTools, lessonPoints, teacherPatience } from '../config/teacherConfig'
import { getPhaserAvatarData } from '../avatar/avatarData'
import { orderPanel } from '../visual/expansionArt'
import { createCustomer, type CustomerVisual } from '../visual/customer'
import { getSceneFx } from '../visual/feedbackFx'
import type { Job } from '../../types/job'
import type { GameResult } from '../../types/game'

export class TeacherScene extends TimedJobScene {
  private question = lessonQuestions[0]
  private stage: 'lesson' | 'request' | 'answer' | 'waiting' = 'lesson'
  private step = 0
  private request = 0
  private student = 0
  private lessons = 0
  private answers = 0
  private attention = 50
  private remaining = 0
  private hint!: Phaser.GameObjects.Text
  private boardText!: Phaser.GameObjects.Text
  private meter!: Phaser.GameObjects.Rectangle
  private pupils: CustomerVisual[] = []
  private hand!: Phaser.GameObjects.Text
  private choices: Phaser.GameObjects.Text[] = []
  constructor(job: Job, complete: (result: GameResult) => void, avatar = getPhaserAvatarData()) { super(job, complete, avatar) }
  protected createPlayArea(): void {
    this.avatar.container.setPosition(46, 465)
    orderPanel(this, 'LỚP HỌC VUI · SOẠN BÀI & LẮNG NGHE')
    this.hint = this.text(180, 137, '', 16)
    this.text(180, 174, 'Chú ý lớp học = thưởng thêm tối đa 50', 12)
    const room = this.add.graphics().setDepth(-1)
    room.fillStyle(0xf4e7ca).fillRoundedRect(18, 207, 324, 253, 14)
    room.fillStyle(0x547968).fillRoundedRect(61, 213, 268, 98, 9)
    room.lineStyle(4, 0xc9ac7c).strokeRoundedRect(61, 213, 268, 98, 9)
    this.boardText = this.text(195, 260, '', 17, '#fff3ce').setDepth(2).setWordWrapWidth(242)
    for (let i = 0; i < 3; i++) {
      const x = 86 + i * 106
      this.pupils.push(createCustomer(this, x, 369, .55))
      room.fillStyle(0xc9a578).fillRoundedRect(x - 40, 387, 81, 23, 4).fillRect(x - 34, 410, 7, 29).fillRect(x + 27, 410, 7, 29)
    }
    this.hand = this.text(80, 326, '✋', 22).setDepth(9)
    this.add.rectangle(202, 454, 225, 9, 0xd6d7be)
    this.meter = this.add.rectangle(90, 454, 225, 9, 0x96b87d).setOrigin(0, .5)
    this.button('CẢ LỚP CHÚ Ý NÀO!', 180, 503, 326, () => { if (this.stage !== 'waiting') { this.attention = Math.min(C.bonus, this.attention + C.attentionBoost); this.avatar.setState('work') } })
    for (let i = 0; i < 3; i++) {
      this.button('', 64 + i * 116, 574, 104, () => this.choose(i))
      this.choices.push(this.text(64 + i * 116, 574, '', 12).setDepth(6))
    }
    this.text(180, 626, 'Soạn đúng thứ tự → đáp yêu cầu → trả lời câu hỏi', 11)
    this.nextLesson()
  }
  private nextLesson(): void {
    this.question = lessonQuestions[Phaser.Math.Between(0, lessonQuestions.length - 1)]
    this.stage = 'lesson'; this.step = 0; this.request = Phaser.Math.Between(0, 2); this.student = Phaser.Math.Between(0, 2)
    this.remaining = teacherPatience(this.lessons) * 1000
    this.hand.setX(86 + this.student * 106); this.pupils.forEach(person => person.next()); this.refresh()
  }
  private refresh(): void {
    this.hint.setText(this.stage === 'lesson' ? `Xếp tiết học · Bước ${this.step + 1}/3` : this.stage === 'request' ? `Bạn bàn ${this.student + 1} xin ${schoolTools[this.request]}` : 'Cả lớp cùng trả lời!')
    this.boardText.setText(this.stage === 'lesson' ? 'Đọc đề → Thảo luận → Trả lời' : this.stage === 'request' ? `Cần: ${schoolTools[this.request]}` : this.question.question)
    this.choices.forEach((label, i) => label.setText(this.stage === 'lesson' ? lessonSteps[i] : this.stage === 'request' ? schoolTools[i] : this.question.answers[i]))
  }
  private choose(index: number): void {
    if (this.stage === 'waiting') return
    const expected = this.stage === 'lesson' ? this.step : this.stage === 'request' ? this.request : this.question.correct
    if (index !== expected) { this.attention = Math.max(0, this.attention - C.attentionPenalty); this.award(C.wrong, '-30 THỬ LẠI NHA!', false); return }
    this.avatar.setState('work')
    if (this.stage === 'lesson') { this.step++; if (this.step === lessonSteps.length) this.stage = 'request'; this.refresh() }
    else if (this.stage === 'request') { this.stage = 'answer'; this.refresh() }
    else {
      this.lessons++; this.answers++; const points = lessonPoints(this.attention)
      this.pupils[this.student].react(true); this.award(points, `+${points} CẢ LỚP HIỂU BÀI!`, true)
      this.countText.setText(`✓ ${this.lessons}`); getSceneFx(this).burst(195, 270, 0xf0d592); this.wait()
    }
  }
  private wait(): void { this.stage = 'waiting'; this.time.delayedCall(C.nextMs, () => { if (!this.hasFinished) this.nextLesson() }) }
  protected updatePlay(delta: number): void {
    if (this.stage === 'waiting') return
    this.attention = Math.max(0, this.attention - delta / 1000 * C.attentionDrain); this.meter.setScale(this.attention / C.bonus, 1)
    this.remaining -= delta
    if (this.remaining <= 0) { this.award(C.timeout, '-20 HẾT GIỜ TIẾT HỌC!', false); this.wait() }
  }
  protected metadata() { return { lessonsCompleted: this.lessons, correctAnswers: this.answers } }
  protected cleanupInput(): void { this.stage = 'waiting' }
}
