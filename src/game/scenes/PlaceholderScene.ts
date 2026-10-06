import Phaser from 'phaser'
import { createGameResult } from '../../services/resultCalculator'
import type { GameResult } from '../../types/game'
import type { Job } from '../../types/job'

export class PlaceholderScene extends Phaser.Scene {
  private readonly job: Job
  private readonly onComplete: (result: GameResult) => void
  private score = 0
  private remainingSeconds: number
  private hasFinished = false
  private scoreText!: Phaser.GameObjects.Text
  private timerText!: Phaser.GameObjects.Text

  constructor(job: Job, onComplete: (result: GameResult) => void) {
    super({ key: job.sceneKey })
    this.job = job
    this.onComplete = onComplete
    this.remainingSeconds = job.duration
  }

  create(): void {
    const centerX = this.scale.width / 2

    this.add
      .text(centerX, 38, this.job.name, {
        color: '#20211d',
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    this.timerText = this.add
      .text(centerX, 86, this.formatTime(), {
        color: '#df382b',
        fontFamily: 'Arial, sans-serif',
        fontSize: '40px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    this.scoreText = this.add
      .text(centerX, 140, 'Điểm: 0', {
        color: '#20211d',
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    this.createActionButton(centerX, 235)
    this.createFinishButton(centerX, 354)

    this.add
      .text(centerX, 426, 'Placeholder — mini-game sẽ được xây sau', {
        color: '#645520',
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
      })
      .setOrigin(0.5)

    this.time.addEvent({
      delay: 1_000,
      repeat: this.job.duration - 1,
      callback: () => {
        this.remainingSeconds -= 1
        this.timerText.setText(this.formatTime())
        if (this.remainingSeconds <= 0) this.finishGame()
      },
    })
  }

  private createActionButton(x: number, y: number): void {
    const button = this.add
      .rectangle(x, y, 260, 112, 0xffffff)
      .setStrokeStyle(3, 0x20211d)
      .setInteractive({ useHandCursor: true })

    this.add
      .text(x, y - 9, `${this.job.icon}  GHI ĐIỂM`, {
        color: '#20211d',
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    this.add
      .text(x, y + 24, '+5 mỗi lần chạm', {
        color: '#77704f',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
      })
      .setOrigin(0.5)

    button.on('pointerdown', () => {
      this.score += 5
      this.scoreText.setText(`Điểm: ${this.score}`)
      this.tweens.add({
        targets: button,
        scaleX: 0.96,
        scaleY: 0.96,
        duration: 70,
        yoyo: true,
      })
    })
  }

  private createFinishButton(x: number, y: number): void {
    const button = this.add
      .rectangle(x, y, 220, 54, 0xdf382b)
      .setInteractive({ useHandCursor: true })

    this.add
      .text(x, y, 'KẾT THÚC CA SỚM', {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    button.on('pointerdown', () => this.finishGame())
  }

  private formatTime(): string {
    return `00:${this.remainingSeconds.toString().padStart(2, '0')}`
  }

  private finishGame(): void {
    if (this.hasFinished) return
    this.hasFinished = true
    this.scene.pause()
    this.onComplete(createGameResult(this.job.id, this.score))
  }
}
