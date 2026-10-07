import Phaser from 'phaser'
import { getPhaserAvatarData, type PhaserAvatarData } from '../avatar/avatarData'
import { createPhaserAvatar, type PhaserAvatar } from '../avatar/createPhaserAvatar'
import { showFloatingFeedback, showTimeUpOverlay } from '../gameFeedback'
import {
  CONSTRUCTION_CONFIG,
  classifyPlacement,
  getComboBonus,
  type PlacementResult,
} from '../config/constructionConfig'
import { createGameResult } from '../../services/resultCalculator'
import { playAudioCue } from '../../services/audioFeedback'
import type { GameResult } from '../../types/game'
import type { Job } from '../../types/job'
import { createEnvironment, hudPanel } from '../visual/environment'
import { getSceneFx } from '../visual/feedbackFx'

interface SettledBrick {
  shape: Phaser.GameObjects.Rectangle
  width: number
}

type BrickPhase = 'waiting' | 'moving' | 'dropping' | 'finished'

const COLORS = {
  ink: 0x20211d,
  sky: 0xdff3f3,
  sun: 0xf6c945,
  orange: 0xe96c35,
  red: 0xc94632,
  green: 0x3b8d4d,
  blue: 0x3279a8,
  sand: 0xe7c67a,
  concrete: 0x777b78,
  white: 0xffffff,
} as const

const BRICK_COLORS = [COLORS.orange, COLORS.red, 0xd9822b, 0xb84a38] as const

export class ConstructionScene extends Phaser.Scene {
  private readonly job: Job
  private readonly onComplete: (result: GameResult) => void
  private readonly avatarData: PhaserAvatarData
  private avatar: PhaserAvatar | null = null
  private score = 0
  private combo = 0
  private successfulBricks = 0
  private remainingGameMs: number
  private phase: BrickPhase = 'waiting'
  private movementDirection = 1
  private hasFinished = false
  private currentBrick: Phaser.GameObjects.Rectangle | null = null
  private settledBricks: SettledBrick[] = []
  private brickArt = new Map<Phaser.GameObjects.Rectangle, Phaser.GameObjects.Graphics>()
  private timerText!: Phaser.GameObjects.Text
  private scoreText!: Phaser.GameObjects.Text
  private comboText!: Phaser.GameObjects.Text
  private bricksText!: Phaser.GameObjects.Text
  private feedbackText!: Phaser.GameObjects.Text
  private instructionText!: Phaser.GameObjects.Text

  constructor(job: Job, onComplete: (result: GameResult) => void, avatarData = getPhaserAvatarData()) {
    super({ key: job.sceneKey })
    this.job = job
    this.onComplete = onComplete
    this.avatarData = avatarData
    this.remainingGameMs = job.duration * 1_000
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.sky)
    createEnvironment(this, this.job.id)
    getSceneFx(this)
    this.createHud()
    this.createConstructionSite()
    this.createBase()
    // Below the platform: never obstructs the moving brick or the tower.
    this.avatar = createPhaserAvatar(this, this.avatarData, { x: 319, y: 643, scale: 0.4 })

    this.input.on('pointerdown', this.dropBrick, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this)
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this)

    this.spawnBrick()
  }

  update(_time: number, delta: number): void {
    if (this.hasFinished) return

    this.remainingGameMs = Math.max(0, this.remainingGameMs - delta)
    this.timerText.setText(`⏱ ${Math.ceil(this.remainingGameMs / 1_000)}s`)

    if (this.remainingGameMs <= 0) {
      this.finishGame()
      return
    }

    if (this.phase === 'moving' && this.currentBrick) {
      this.moveBrick(delta)
    }
  }

  private createHud(): void {
    hudPanel(this, this.job.id)
    this.add
      .text(180, 19, '🧱 PHỤ HỒ', this.textStyle(21, '#f6c945', 'bold'))
      .setOrigin(0.5)

    this.timerText = this.add
      .text(47, 59, `⏱ ${this.job.duration}s`, this.textStyle(14, '#ffffff', 'bold'))
      .setOrigin(0.5)
    this.scoreText = this.add
      .text(133, 59, '⭐ 0', this.textStyle(14, '#ffffff', 'bold'))
      .setOrigin(0.5)
    this.comboText = this.add
      .text(218, 59, '🔥 x0', this.textStyle(14, '#ffffff', 'bold'))
      .setOrigin(0.5)
    this.bricksText = this.add
      .text(310, 59, '🧱 0', this.textStyle(14, '#ffffff', 'bold'))
      .setOrigin(0.5)
  }

  private createConstructionSite(): void {
    const ground = this.add.graphics()
    ground.fillStyle(0x576877).fillRoundedRect(15, 577, 330, 16, 5)
    ground.fillStyle(0xbec9c5).fillRoundedRect(15, 574, 330, 8, 4)

    this.instructionText = this.add
      .text(180, 105, 'CHẠM ĐỂ THẢ GẠCH', this.textStyle(15, '#20211d', 'bold'))
      .setOrigin(0.5)
      .setPadding(12, 7, 12, 7)
      .setBackgroundColor('#ffffff')

    this.feedbackText = this.add
      .text(180, 142, '', {
        ...this.textStyle(17, '#3b8d4d', 'bold'),
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(20)
  }

  private createBase(): void {
    const base = this.createBrickShape(
      180,
      CONSTRUCTION_CONFIG.baseY,
      CONSTRUCTION_CONFIG.startingBrickWidth + 20,
      COLORS.concrete,
    )
    this.settledBricks.push({
      shape: base,
      width: CONSTRUCTION_CONFIG.startingBrickWidth + 20,
    })
  }

  private spawnBrick(): void {
    if (this.hasFinished) return

    const width = Math.max(
      CONSTRUCTION_CONFIG.minimumBrickWidth,
      CONSTRUCTION_CONFIG.startingBrickWidth -
        this.successfulBricks * CONSTRUCTION_CONFIG.widthReductionPerBrick,
    )
    const startsLeft = this.successfulBricks % 2 === 0
    const x = startsLeft
      ? CONSTRUCTION_CONFIG.horizontalPadding
      : CONSTRUCTION_CONFIG.sceneWidth - CONSTRUCTION_CONFIG.horizontalPadding

    this.movementDirection = startsLeft ? 1 : -1
    this.currentBrick = this.createBrickShape(
      x,
      CONSTRUCTION_CONFIG.spawnY,
      width,
      BRICK_COLORS[this.successfulBricks % BRICK_COLORS.length],
    )
    this.phase = 'moving'
  }

  private createBrickShape(
    x: number,
    y: number,
    width: number,
    color: number,
  ): Phaser.GameObjects.Rectangle {
    const brick = this.add
      .rectangle(x, y, width, CONSTRUCTION_CONFIG.brickHeight, color)
      .setStrokeStyle()
      .setDepth(5)

    const h = CONSTRUCTION_CONFIG.brickHeight
    const art = this.add.graphics().setPosition(x, y).setDepth(6)
    art.fillStyle(color).fillRoundedRect(-width / 2, -h / 2, width, h, 4)
    art.fillStyle(0xffffff, 0.24).fillRoundedRect(-width / 2 + 2, -h / 2 + 2, width - 4, 4, 2)
    art.fillStyle(0x613c3b, 0.25).fillRect(-width / 2 + 2, h / 2 - 5, width - 4, 4)
    art.lineStyle(1, 0x553e41, 0.4).strokeRoundedRect(-width / 2, -h / 2, width, h, 4)
    art.lineStyle(1, 0x553e41, 0.35).lineBetween(-width / 6, -h / 2 + 5, -width / 6, h / 2 - 4)
    art.lineBetween(width / 6, -h / 2 + 5, width / 6, h / 2 - 4)
    brick.setAlpha(0)
    this.brickArt.set(brick, art)

    return brick
  }

  private moveBrick(delta: number): void {
    if (!this.currentBrick) return

    const speed = Math.min(
      CONSTRUCTION_CONFIG.maximumSpeed,
      CONSTRUCTION_CONFIG.baseSpeed +
        this.successfulBricks * CONSTRUCTION_CONFIG.speedIncreasePerBrick,
    )
    this.currentBrick.x += this.movementDirection * speed * (delta / 1_000)

    const leftBound = CONSTRUCTION_CONFIG.horizontalPadding
    const rightBound = CONSTRUCTION_CONFIG.sceneWidth - CONSTRUCTION_CONFIG.horizontalPadding

    if (this.currentBrick.x <= leftBound) {
      this.currentBrick.x = leftBound
      this.movementDirection = 1
    } else if (this.currentBrick.x >= rightBound) {
      this.currentBrick.x = rightBound
      this.movementDirection = -1
    }

    this.syncBrickDecoration(this.currentBrick)
  }

  private dropBrick(): void {
    if (this.hasFinished || this.phase !== 'moving' || !this.currentBrick) return

    this.phase = 'dropping'
    this.avatar?.setState('work')
    playAudioCue('click')
    this.instructionText.setVisible(false)

    const brick = this.currentBrick
    const target = this.getTopBrick()
    const placement = classifyPlacement(brick.x, brick.width, target.shape.x, target.width)

    if (placement.grade === 'miss') {
      this.tweens.add({
        targets: brick,
        y: CONSTRUCTION_CONFIG.sceneHeight + 30,
        angle: this.movementDirection * 24,
        duration: CONSTRUCTION_CONFIG.dropDurationMs + 160,
        ease: 'Quad.easeIn',
        onUpdate: () => this.syncBrickDecoration(brick),
        onComplete: () => this.resolveMiss(brick, placement),
      })
      return
    }

    const landingY = target.shape.y - CONSTRUCTION_CONFIG.brickHeight
    const landingX = placement.grade === 'perfect' ? target.shape.x : brick.x
    this.tweens.add({
      targets: brick,
      x: landingX,
      y: landingY,
      duration: CONSTRUCTION_CONFIG.dropDurationMs,
      ease: 'Quad.easeIn',
      onUpdate: () => this.syncBrickDecoration(brick),
      onComplete: () => this.resolveSuccess(brick, placement),
    })
  }

  private resolveSuccess(
    brick: Phaser.GameObjects.Rectangle,
    placement: PlacementResult,
  ): void {
    this.successfulBricks += 1
    getSceneFx(this).burst(brick.x, brick.y + CONSTRUCTION_CONFIG.brickHeight / 2, 0xe5d5b3, 'dust')
    if (placement.grade === 'perfect') {
      getSceneFx(this).burst(brick.x, brick.y - 8, 0xffdf8e)
      getSceneFx(this).shake()
    }
    this.avatar?.setState('idle')
    if (placement.grade === 'perfect') this.avatar?.setState('success')
    this.combo = placement.grade === 'perfect' ? this.combo + 1 : 0
    const comboBonus = placement.grade === 'perfect' ? getComboBonus(this.combo) : 0
    this.score += placement.points + comboBonus
    this.settledBricks.push({ shape: brick, width: brick.width })
    this.currentBrick = null

    const bonusMessage = comboBonus > 0 ? `  +${comboBonus} COMBO` : ''
    playAudioCue(comboBonus > 0 ? 'combo' : 'success')
    this.showFeedback(`${placement.message}${bonusMessage}`, this.getFeedbackColor(placement.grade))
    this.updateHud()
    this.keepTowerVisible()
    this.queueNextBrick()
  }

  private resolveMiss(
    brick: Phaser.GameObjects.Rectangle,
    placement: PlacementResult,
  ): void {
    this.score = Math.max(0, this.score + placement.points)
    this.avatar?.setState('idle')
    this.avatar?.setState('fail')
    this.combo = 0
    getSceneFx(this).burst(Phaser.Math.Clamp(brick.x, 25, 335), 572, 0xd5ad80, 'dust')
    getSceneFx(this).shake()
    this.currentBrick = null
    this.destroyBrick(brick)
    playAudioCue('error')
    this.showFeedback(placement.message, this.getFeedbackColor(placement.grade))
    this.updateHud()
    this.queueNextBrick()
  }

  private queueNextBrick(): void {
    this.phase = 'waiting'
    this.time.delayedCall(CONSTRUCTION_CONFIG.nextBrickDelayMs, () => this.spawnBrick())
  }

  private keepTowerVisible(): void {
    const top = this.getTopBrick()
    if (top.shape.y >= CONSTRUCTION_CONFIG.cameraTopY) return

    this.settledBricks.forEach(({ shape }) => {
      shape.y += CONSTRUCTION_CONFIG.brickHeight
      this.syncBrickDecoration(shape)
    })

    this.settledBricks = this.settledBricks.filter(({ shape }) => {
      if (shape.y <= CONSTRUCTION_CONFIG.baseY + CONSTRUCTION_CONFIG.brickHeight) return true
      this.destroyBrick(shape)
      return false
    })
  }

  private getTopBrick(): SettledBrick {
    return this.settledBricks[this.settledBricks.length - 1]
  }

  private updateHud(): void {
    this.scoreText.setText(`⭐ ${this.score}`)
    getSceneFx(this).pulse(this.scoreText)
    this.comboText.setText(`🔥 x${this.combo}`)
    if (this.combo > 1) getSceneFx(this).pulse(this.comboText)
    this.bricksText.setText(`🧱 ${this.successfulBricks}`)
  }

  private showFeedback(message: string, color: string): void {
    showFloatingFeedback(this, this.feedbackText, message, color)
  }

  private getFeedbackColor(grade: PlacementResult['grade']): string {
    if (grade === 'perfect') return '#3b8d4d'
    if (grade === 'good') return '#3279a8'
    if (grade === 'ok') return '#c06b16'
    return '#c94632'
  }

  private syncBrickDecoration(brick: Phaser.GameObjects.Rectangle): void {
    this.brickArt.get(brick)?.setPosition(brick.x, brick.y).setAngle(brick.angle)
  }

  private destroyBrick(brick: Phaser.GameObjects.Rectangle): void {
    this.brickArt.get(brick)?.destroy()
    this.brickArt.delete(brick)
    brick.destroy()
  }

  private finishGame(): void {
    if (this.hasFinished) return
    this.hasFinished = true
    this.avatar?.destroy()
    this.avatar = null
    this.phase = 'finished'
    this.input.off('pointerdown', this.dropBrick, this)
    this.time.removeAllEvents()
    this.tweens.killAll()
    showTimeUpOverlay(this, () => {
      this.onComplete(
        createGameResult(this.job.id, this.score, {
          successfulBricks: this.successfulBricks,
        }),
      )
    })
  }

  private cleanup(): void {
    this.avatar?.destroy()
    this.avatar = null
    this.input.off('pointerdown', this.dropBrick, this)
    this.time.removeAllEvents()
    this.tweens.killAll()
    this.currentBrick = null
    this.settledBricks = []
    this.brickArt.clear()
  }

  private textStyle(
    fontSize: number,
    color: string,
    fontStyle: 'normal' | 'bold' = 'normal',
  ): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      color,
      fontFamily: 'Arial, sans-serif',
      fontSize: `${fontSize}px`,
      fontStyle,
    }
  }
}
