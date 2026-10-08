import Phaser from 'phaser'
import { createPhaserAvatar, type PhaserAvatar } from '../avatar/createPhaserAvatar'
import type { PhaserAvatarData } from '../avatar/avatarData'
import { createEnvironment, decorateButton, hudPanel } from '../visual/environment'
import { getSceneFx } from '../visual/feedbackFx'
import { showFloatingFeedback, showTimeUpOverlay } from '../gameFeedback'
import { playAudioCue } from '../../services/audioFeedback'
import { createGameResult } from '../../services/resultCalculator'
import type { GameResult, GameResultMetadata } from '../../types/game'
import type { Job } from '../../types/job'

/** Timer/HUD/input lifecycle only. Precision and fishing keep their own state machines. */
export abstract class TimedJobScene extends Phaser.Scene {
  protected score = 0
  protected hasFinished = false
  protected avatar!: PhaserAvatar
  protected readonly job: Job
  private readonly avatarData: PhaserAvatarData
  private readonly onComplete: (result: GameResult) => void
  private remainingMs: number
  private timerText!: Phaser.GameObjects.Text
  private scoreText!: Phaser.GameObjects.Text
  private feedback!: Phaser.GameObjects.Text
  protected countText!: Phaser.GameObjects.Text
  constructor(job: Job, onComplete: (result: GameResult) => void, avatarData: PhaserAvatarData) {
    super({ key: job.sceneKey }); this.job = job; this.onComplete = onComplete; this.avatarData = avatarData; this.remainingMs = job.duration * 1000
  }
  create(): void {
    createEnvironment(this, this.job.id); getSceneFx(this); hudPanel(this, this.job.id)
    this.text(180, 20, this.job.name.toLocaleUpperCase('vi-VN'), 21, '#ffdf9d')
    this.timerText = this.text(55, 58, '⏱ 45s', 15, '#ffffff')
    this.scoreText = this.text(178, 58, '⭐ 0', 15, '#ffffff')
    this.countText = this.text(300, 58, '✓ 0', 15, '#ffffff')
    this.feedback = this.text(180, 480, '', 16).setDepth(30)
    this.avatar = createPhaserAvatar(this, this.avatarData, { x: 46, y: 448, scale: 0.55 })
    this.createPlayArea()
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this)
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this)
  }
  update(_time: number, delta: number): void {
    if (this.hasFinished) return
    this.remainingMs = Math.max(0, this.remainingMs - delta)
    this.timerText.setText(`⏱ ${Math.ceil(this.remainingMs / 1000)}s`)
    if (this.remainingMs === 0) { this.finish(); return }
    this.updatePlay(delta)
  }
  protected abstract createPlayArea(): void
  protected abstract updatePlay(delta: number): void
  protected abstract metadata(): GameResultMetadata
  protected abstract cleanupInput(): void
  protected text(x: number, y: number, value: string, size = 16, color = '#294a49'): Phaser.GameObjects.Text {
    return this.add.text(x, y, value, { fontFamily: 'Arial, sans-serif', fontSize: `${size}px`, color, fontStyle: 'bold', align: 'center' }).setOrigin(0.5)
  }
  protected button(label: string, x: number, y: number, width: number, action: () => void): Phaser.GameObjects.Rectangle {
    const shape = this.add.rectangle(x, y, width, 48, 0xfffaf0).setInteractive({ useHandCursor: true })
    decorateButton(this, shape, 0xfffaf0)
    this.text(x, y, label, 14).setDepth(5)
    shape.on('pointerdown', () => { if (!this.hasFinished) { playAudioCue('click'); action() } })
    return shape
  }
  protected award(points: number, message: string, success: boolean): void {
    this.score = Math.max(0, this.score + points); this.scoreText.setText(`⭐ ${this.score}`)
    this.avatar.setState('idle'); this.avatar.setState(success ? 'success' : 'fail')
    getSceneFx(this).pulse(this.scoreText); playAudioCue(success ? 'success' : 'error')
    showFloatingFeedback(this, this.feedback, message, success ? '#31865a' : '#cb443d')
  }
  private finish(): void {
    this.hasFinished = true; this.input.enabled = false
    this.cleanup()
    showTimeUpOverlay(this, () => this.onComplete(createGameResult(this.job.id, this.score, this.metadata())))
  }
  private cleanup(): void {
    this.cleanupInput(); this.avatar?.destroy(); this.time.removeAllEvents(); this.tweens.killAll()
    this.children.list.forEach((object) => object.removeAllListeners())
  }
}
