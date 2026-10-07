import Phaser from 'phaser'
import { createPhaserAvatar, type PhaserAvatar } from '../avatar/createPhaserAvatar'
import type { PhaserAvatarData } from '../avatar/avatarData'
import { SERVICE_JOB_CONFIG as COLORS } from '../config/serviceJobConfig'
import { showFloatingFeedback, showTimeUpOverlay } from '../gameFeedback'
import { playAudioCue } from '../../services/audioFeedback'
import { createGameResult } from '../../services/resultCalculator'
import type { GameResult, GameResultMetadata } from '../../types/game'
import type { Job } from '../../types/job'
import { createEnvironment, hudPanel, panel, decorateButton } from '../visual/environment'
import { getSceneFx } from '../visual/feedbackFx'
import { createCustomer, type CustomerVisual } from '../visual/customer'

/** Small shared shell for the three service jobs; existing game scenes stay independent. */
export abstract class ServiceJobScene extends Phaser.Scene {
  protected score = 0
  protected completedCustomers = 0
  protected roundActive = false
  protected hasFinished = false
  protected roundRemainingMs = 0
  protected roundTotalMs = 0
  protected avatar!: PhaserAvatar
  protected customer!: CustomerVisual
  private remainingMs: number
  private timerText!: Phaser.GameObjects.Text
  private scoreText!: Phaser.GameObjects.Text
  private countText!: Phaser.GameObjects.Text
  private feedbackText!: Phaser.GameObjects.Text
  private patienceFill!: Phaser.GameObjects.Rectangle
  private workTimer: Phaser.Time.TimerEvent | null = null
  private buttons: Phaser.GameObjects.Rectangle[] = []
  protected readonly job: Job
  private readonly onComplete: (result: GameResult) => void
  private readonly avatarData: PhaserAvatarData
  private readonly accent: number

  constructor(job: Job, onComplete: (result: GameResult) => void,
    avatarData: PhaserAvatarData, accent: number) {
    super({ key: job.sceneKey })
    this.job = job
    this.onComplete = onComplete
    this.avatarData = avatarData
    this.accent = accent
    this.remainingMs = job.duration * 1000
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.cream)
    createEnvironment(this, this.job.id)
    getSceneFx(this)
    this.createHud()
    this.feedbackText = this.text(180, COLORS.feedbackY, '', 16).setDepth(30)
    this.avatar = createPhaserAvatar(this, this.avatarData, { x: 48, y: 445, scale: 0.5 })
    if (this.job.id !== 'carwash') this.customer = createCustomer(this, 52, 143, 0.78)
    this.createPlayArea()
    this.startRound()
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this)
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this)
  }

  update(_time: number, delta: number): void {
    if (this.hasFinished) return
    this.remainingMs = Math.max(0, this.remainingMs - delta)
    this.timerText.setText(`⏱ ${Math.ceil(this.remainingMs / 1000)}s`)
    if (this.remainingMs <= 0) { this.finishGame(); return }
    if (!this.roundActive) return
    this.roundRemainingMs = Math.max(0, this.roundRemainingMs - delta)
    this.patienceFill.setScale(this.roundRemainingMs / this.roundTotalMs, 1)
    if (this.roundRemainingMs <= 0) this.onRoundTimeout()
  }

  protected abstract createPlayArea(): void
  protected abstract startRound(): void
  protected abstract onRoundTimeout(): void
  protected abstract resultMetadata(): GameResultMetadata
  protected cleanupExtras(): void { /* Optional scene-specific input cleanup. */ }

  protected text(x: number, y: number, value: string, size = 16, color = '#272438'): Phaser.GameObjects.Text {
    return this.add.text(x, y, value, {
      fontFamily: 'Arial, sans-serif', fontSize: `${size}px`, color, fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5)
  }

  protected button(label: string, x: number, y: number, width: number, action: () => void): Phaser.GameObjects.Rectangle {
    const shape = this.add.rectangle(x, y, width, 48, COLORS.white).setStrokeStyle(2, COLORS.ink)
      .setInteractive({ useHandCursor: true })
    this.text(x, y, label, 13)
    decorateButton(this, shape, 0xfffaf0)
    // Keep the existing label/hitbox association; artwork is below labels.
    this.children.list.filter((object): object is Phaser.GameObjects.Text => object instanceof Phaser.GameObjects.Text && object.x === x && object.y === y)
      .forEach((object) => object.setDepth(4))
    shape.on('pointerdown', () => {
      if (!this.roundActive || this.hasFinished) return
      playAudioCue('click')
      action()
    })
    this.buttons.push(shape)
    return shape
  }

  protected beginRound(seconds: number): void {
    this.roundTotalMs = seconds * 1000
    this.roundRemainingMs = this.roundTotalMs
    this.roundActive = true
    this.patienceFill.setScale(1, 1)
    this.avatar.setState('idle')
    this.customer?.next()
  }

  protected work(): void {
    this.workTimer?.remove()
    this.avatar.setState('work')
    this.workTimer = this.time.delayedCall(180, () => {
      this.avatar.setState('idle')
      this.workTimer = null
    })
  }

  protected award(points: number, message: string, success: boolean): void {
    this.score = Math.max(0, this.score + points)
    this.scoreText.setText(`⭐ ${this.score}`)
    this.countText.setText(`✓ ${this.completedCustomers}`)
    this.avatar.setState('idle')
    this.avatar.setState(success ? 'success' : 'fail')
    this.customer?.react(success)
    getSceneFx(this).pulse(this.scoreText)
    playAudioCue(success ? 'success' : 'error')
    showFloatingFeedback(this, this.feedbackText, message, success ? '#31865a' : '#cb443d')
  }

  protected nextRound(delayMs: number): void {
    this.roundActive = false
    this.customer?.exit()
    this.workTimer?.remove()
    this.workTimer = null
    this.time.delayedCall(delayMs, () => { if (!this.hasFinished) this.startRound() })
  }

  private createHud(): void {
    hudPanel(this, this.job.id)
    this.text(180, 20, this.job.name.toLocaleUpperCase('vi-VN'), 21, '#ffdf9d')
    this.timerText = this.text(55, 58, `⏱ ${this.job.duration}s`, 15, '#ffffff')
    this.scoreText = this.text(178, 58, '⭐ 0', 15, '#ffffff')
    this.countText = this.text(302, 58, '✓ 0', 15, '#ffffff')
    this.text(57, 208, 'KIÊN NHẪN', 10)
    this.add.rectangle(219, 208, 228, 10, 0xdad9ce)
    this.patienceFill = this.add.rectangle(105, 208, 228, 10, this.accent).setOrigin(0, 0.5)
    panel(this, 180, 142, 332, 101, 0xfff9ed)
  }

  private finishGame(): void {
    if (this.hasFinished) return
    this.hasFinished = true
    this.roundActive = false
    this.input.enabled = false
    this.cleanup()
    showTimeUpOverlay(this, () => this.onComplete(createGameResult(this.job.id, this.score, this.resultMetadata())))
  }

  private cleanup(): void {
    this.cleanupExtras()
    this.avatar.destroy()
    this.workTimer?.remove()
    this.workTimer = null
    this.time.removeAllEvents()
    this.tweens.killAll()
    for (const button of this.buttons) button.removeAllListeners()
    this.buttons = []
  }
}
