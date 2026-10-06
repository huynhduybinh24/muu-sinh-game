import Phaser from 'phaser'
import { showFloatingFeedback, showTimeUpOverlay } from '../gameFeedback'
import {
  SHIPPER_CONFIG,
  deliveryRoutes,
  getActiveObstacleCount,
  getFastDeliveryBonus,
  obstacleConfigs,
  type DeliveryObjective,
  type MoveDirection,
  type ObstacleConfig,
} from '../config/shipperConfig'
import { createGameResult } from '../../services/resultCalculator'
import { playAudioCue } from '../../services/audioFeedback'
import type { GameResult } from '../../types/game'
import type { Job } from '../../types/job'

interface MovementKeys {
  up: Phaser.Input.Keyboard.Key
  down: Phaser.Input.Keyboard.Key
  left: Phaser.Input.Keyboard.Key
  right: Phaser.Input.Keyboard.Key
}

interface ObstacleView {
  config: ObstacleConfig
  background: Phaser.GameObjects.Rectangle
  icon: Phaser.GameObjects.Text
}

const COLORS = {
  ink: 0x20211d,
  road: 0x626b70,
  roadLine: 0xf5d45d,
  sidewalk: 0xd7d0bd,
  buildingBlue: 0x89b9c7,
  buildingRed: 0xd78068,
  green: 0x4c9a61,
  orange: 0xf19a34,
  red: 0xd84835,
  white: 0xffffff,
  controls: 0x273238,
} as const

export class ShipperScene extends Phaser.Scene {
  private readonly job: Job
  private readonly onComplete: (result: GameResult) => void
  private score = 0
  private deliveries = 0
  private remainingGameMs: number
  private elapsedGameMs = 0
  private deliveryElapsedMs = 0
  private routeIndex = 0
  private objective: DeliveryObjective = 'pickup'
  private hasFinished = false
  private collisionCooldownUntil = 0
  private slowedUntil = 0
  private player!: Phaser.GameObjects.Container
  private pickupMarker!: Phaser.GameObjects.Container
  private destinationMarker!: Phaser.GameObjects.Container
  private objectiveText!: Phaser.GameObjects.Text
  private directionText!: Phaser.GameObjects.Text
  private timerText!: Phaser.GameObjects.Text
  private scoreText!: Phaser.GameObjects.Text
  private deliveriesText!: Phaser.GameObjects.Text
  private feedbackText!: Phaser.GameObjects.Text
  private obstacles: ObstacleView[] = []
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null
  private wasd: MovementKeys | null = null
  private touchMovement: Record<MoveDirection, boolean> = {
    up: false,
    down: false,
    left: false,
    right: false,
  }
  private controlButtons: Phaser.GameObjects.Rectangle[] = []

  constructor(job: Job, onComplete: (result: GameResult) => void) {
    super({ key: job.sceneKey })
    this.job = job
    this.onComplete = onComplete
    this.remainingGameMs = job.duration * 1_000
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0xf3e7c9)
    this.createHud()
    this.createMap()
    this.createTargets()
    this.createObstacles()
    this.createPlayer()
    this.createControls()
    this.configureKeyboard()
    this.setRoute(0)

    this.input.addPointer(2)
    this.input.on('pointerup', this.releaseTouchControls, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this)
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this)
  }

  update(_time: number, delta: number): void {
    if (this.hasFinished) return

    this.remainingGameMs = Math.max(0, this.remainingGameMs - delta)
    this.elapsedGameMs += delta
    if (this.objective === 'deliver') this.deliveryElapsedMs += delta
    this.timerText.setText(`⏱ ${Math.ceil(this.remainingGameMs / 1_000)}s`)

    if (this.remainingGameMs <= 0) {
      this.finishGame()
      return
    }

    this.movePlayer(delta)
    this.updateDirectionIndicator()
    this.checkTargetReached()
  }

  private createHud(): void {
    this.add.rectangle(180, 42, 360, 84, COLORS.ink)
    this.add
      .text(180, 19, '🛵 SHIPPER', this.textStyle(21, '#f5d45d', 'bold'))
      .setOrigin(0.5)

    this.timerText = this.add
      .text(61, 59, `⏱ ${this.job.duration}s`, this.textStyle(15, '#ffffff', 'bold'))
      .setOrigin(0.5)
    this.scoreText = this.add
      .text(177, 59, '⭐ 0', this.textStyle(15, '#ffffff', 'bold'))
      .setOrigin(0.5)
    this.deliveriesText = this.add
      .text(292, 59, '📦 0', this.textStyle(15, '#ffffff', 'bold'))
      .setOrigin(0.5)
  }

  private createMap(): void {
    this.add.rectangle(180, 309, 360, 450, COLORS.sidewalk)
    this.add.rectangle(180, 309, 142, 376, COLORS.road)
    this.add.rectangle(180, 309, 328, 116, COLORS.road)

    for (let y = 142; y <= 470; y += 42) {
      this.add.rectangle(180, y, 4, 21, COLORS.roadLine).setAlpha(0.9)
    }
    for (let x = 34; x <= 326; x += 42) {
      this.add.rectangle(x, 309, 21, 4, COLORS.roadLine).setAlpha(0.9)
    }

    this.createBuilding(48, 173, 70, 72, COLORS.buildingBlue, 'TIỆM')
    this.createBuilding(312, 174, 70, 72, COLORS.buildingRed, 'NHÀ')
    this.createBuilding(49, 444, 72, 68, COLORS.buildingRed, 'CHỢ')
    this.createBuilding(311, 444, 72, 68, COLORS.buildingBlue, 'QUÁN')

    this.add.rectangle(180, 108, 332, 34, COLORS.white).setStrokeStyle(2, COLORS.ink)
    this.objectiveText = this.add
      .text(168, 108, '', this.textStyle(13, '#20211d', 'bold'))
      .setOrigin(0.5)
    this.directionText = this.add
      .text(320, 108, '↓', this.textStyle(22, '#d84835', 'bold'))
      .setOrigin(0.5)

    this.feedbackText = this.add
      .text(180, 137, '', {
        ...this.textStyle(15, '#ffffff', 'bold'),
        align: 'center',
        backgroundColor: '#20211d',
        padding: { x: 8, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(30)
  }

  private createBuilding(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
    label: string,
  ): void {
    this.add.rectangle(x, y, width, height, color).setStrokeStyle(2, COLORS.ink)
    this.add
      .text(x, y, label, this.textStyle(11, '#20211d', 'bold'))
      .setOrigin(0.5)
  }

  private createTargets(): void {
    this.pickupMarker = this.createMarker('📦', COLORS.orange)
    this.destinationMarker = this.createMarker('🙂', COLORS.green)
  }

  private createMarker(icon: string, color: number): Phaser.GameObjects.Container {
    const ring = this.add.circle(0, 0, SHIPPER_CONFIG.targetRadius, color, 0.3)
      .setStrokeStyle(3, color)
    const label = this.add.text(0, 0, icon, this.textStyle(25, '#20211d')).setOrigin(0.5)
    return this.add.container(0, 0, [ring, label]).setDepth(10)
  }

  private createObstacles(): void {
    this.obstacles = obstacleConfigs.map((config, index) => {
      const background = this.add
        .rectangle(config.x, config.y, config.width, config.height, config.color, 0.88)
        .setStrokeStyle(2, COLORS.ink)
        .setDepth(12)
      const icon = this.add
        .text(config.x, config.y, config.icon, this.textStyle(20, '#20211d'))
        .setOrigin(0.5)
        .setDepth(13)
      const visible = index < SHIPPER_CONFIG.initialObstacleCount
      background.setVisible(visible)
      icon.setVisible(visible)
      return { config, background, icon }
    })
  }

  private createPlayer(): void {
    const body = this.add.circle(0, 0, SHIPPER_CONFIG.playerRadius, 0xf5d45d)
      .setStrokeStyle(3, COLORS.ink)
    const icon = this.add.text(0, 0, '🛵', this.textStyle(24, '#20211d')).setOrigin(0.5)
    this.player = this.add.container(180, 470, [body, icon]).setDepth(20)
  }

  private createControls(): void {
    this.add.rectangle(180, 574, 360, 152, 0xf3e7c9)
    this.createControlButton('↑', 'up', 180, 526)
    this.createControlButton('←', 'left', 104, 594)
    this.createControlButton('↓', 'down', 180, 594)
    this.createControlButton('→', 'right', 256, 594)
  }

  private createControlButton(
    label: string,
    direction: MoveDirection,
    x: number,
    y: number,
  ): void {
    const button = this.add
      .rectangle(x, y, 66, 56, COLORS.controls)
      .setStrokeStyle(2, COLORS.ink)
      .setInteractive({ useHandCursor: true })
      .setDepth(25)
    this.add
      .text(x, y, label, this.textStyle(28, '#ffffff', 'bold'))
      .setOrigin(0.5)
      .setDepth(26)

    button.on('pointerdown', () => {
      if (!this.hasFinished) {
        playAudioCue('click')
        this.touchMovement[direction] = true
      }
    })
    button.on('pointerup', () => {
      this.touchMovement[direction] = false
    })
    button.on('pointerout', () => {
      this.touchMovement[direction] = false
    })
    this.controlButtons.push(button)
  }

  private configureKeyboard(): void {
    if (!this.input.keyboard) return
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as MovementKeys
    this.input.keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.W,
      Phaser.Input.Keyboard.KeyCodes.A,
      Phaser.Input.Keyboard.KeyCodes.S,
      Phaser.Input.Keyboard.KeyCodes.D,
    ])
  }

  private movePlayer(delta: number): void {
    const horizontal = Number(this.isMoving('right')) - Number(this.isMoving('left'))
    const vertical = Number(this.isMoving('down')) - Number(this.isMoving('up'))
    if (horizontal === 0 && vertical === 0) return

    const length = Math.hypot(horizontal, vertical) || 1
    const speed =
      this.elapsedGameMs < this.slowedUntil
        ? SHIPPER_CONFIG.playerSpeed * SHIPPER_CONFIG.slowedSpeedMultiplier
        : SHIPPER_CONFIG.playerSpeed
    const distance = speed * (delta / 1_000)
    const previousX = this.player.x
    const previousY = this.player.y

    this.player.x = Phaser.Math.Clamp(
      this.player.x + (horizontal / length) * distance,
      SHIPPER_CONFIG.mapBounds.left + SHIPPER_CONFIG.playerRadius,
      SHIPPER_CONFIG.mapBounds.right - SHIPPER_CONFIG.playerRadius,
    )
    this.player.y = Phaser.Math.Clamp(
      this.player.y + (vertical / length) * distance,
      SHIPPER_CONFIG.mapBounds.top + SHIPPER_CONFIG.playerRadius,
      SHIPPER_CONFIG.mapBounds.bottom - SHIPPER_CONFIG.playerRadius,
    )

    if (horizontal !== 0) this.player.setScale(horizontal < 0 ? -1 : 1, 1)
    this.handleObstacleCollision(previousX, previousY)
  }

  private isMoving(direction: MoveDirection): boolean {
    const cursorKey = this.cursors?.[direction]
    const wasdKey = this.wasd?.[direction]
    return this.touchMovement[direction] || Boolean(cursorKey?.isDown) || Boolean(wasdKey?.isDown)
  }

  private handleObstacleCollision(previousX: number, previousY: number): void {
    const activeCount = getActiveObstacleCount(this.deliveries)
    const collided = this.obstacles
      .slice(0, activeCount)
      .some(({ config }) => this.circleIntersectsRectangle(config))
    if (!collided) return

    this.player.setPosition(previousX, previousY)
    if (this.elapsedGameMs < this.collisionCooldownUntil) return

    this.score = Math.max(0, this.score - SHIPPER_CONFIG.obstaclePenalty)
    this.collisionCooldownUntil = this.elapsedGameMs + SHIPPER_CONFIG.collisionCooldownMs
    this.slowedUntil = this.elapsedGameMs + SHIPPER_CONFIG.slowDurationMs
    this.scoreText.setText(`⭐ ${this.score}`)
    playAudioCue('error')
    this.showFeedback('-20 VA CHẠM!', '#d84835')
  }

  private circleIntersectsRectangle(obstacle: ObstacleConfig): boolean {
    const closestX = Phaser.Math.Clamp(
      this.player.x,
      obstacle.x - obstacle.width / 2,
      obstacle.x + obstacle.width / 2,
    )
    const closestY = Phaser.Math.Clamp(
      this.player.y,
      obstacle.y - obstacle.height / 2,
      obstacle.y + obstacle.height / 2,
    )
    return (
      Phaser.Math.Distance.Between(this.player.x, this.player.y, closestX, closestY) <
      SHIPPER_CONFIG.playerRadius
    )
  }

  private checkTargetReached(): void {
    const target = this.objective === 'pickup' ? this.pickupMarker : this.destinationMarker
    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      target.x,
      target.y,
    )
    if (distance > SHIPPER_CONFIG.playerRadius + SHIPPER_CONFIG.targetRadius) return

    if (this.objective === 'pickup') {
      this.objective = 'deliver'
      this.deliveryElapsedMs = 0
      this.pickupMarker.setVisible(false)
      this.destinationMarker.setVisible(true)
      this.objectiveText.setText('GIAO ĐẾN KHÁCH HÀNG')
      playAudioCue('click')
      this.showFeedback('ĐÃ LẤY HÀNG!', '#f19a34')
      return
    }

    this.completeDelivery()
  }

  private completeDelivery(): void {
    const fastBonus = getFastDeliveryBonus(this.deliveryElapsedMs, this.deliveries)
    this.score += SHIPPER_CONFIG.successfulDeliveryScore + fastBonus
    this.deliveries += 1
    this.scoreText.setText(`⭐ ${this.score}`)
    this.deliveriesText.setText(`📦 ${this.deliveries}`)
    playAudioCue('success')

    const bonusMessage = fastBonus > 0 ? `\n+${fastBonus} GIAO NHANH!` : ''
    this.showFeedback(`+100 GIAO THÀNH CÔNG!${bonusMessage}`, '#4c9a61')
    this.updateObstaclePressure()
    this.setRoute((this.routeIndex + 1) % deliveryRoutes.length)
  }

  private setRoute(index: number): void {
    this.routeIndex = index
    this.objective = 'pickup'
    this.deliveryElapsedMs = 0
    const route = deliveryRoutes[index]
    this.pickupMarker.setPosition(route.pickup.x, route.pickup.y).setVisible(true)
    this.destinationMarker
      .setPosition(route.destination.x, route.destination.y)
      .setVisible(false)
    this.objectiveText.setText('ĐẾN ĐIỂM LẤY HÀNG')
    this.updateDirectionIndicator()
  }

  private updateObstaclePressure(): void {
    const activeCount = getActiveObstacleCount(this.deliveries)
    this.obstacles.forEach(({ background, icon }, index) => {
      const visible = index < activeCount
      background.setVisible(visible)
      icon.setVisible(visible)
    })
  }

  private updateDirectionIndicator(): void {
    const target = this.objective === 'pickup' ? this.pickupMarker : this.destinationMarker
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y)
    const directions = ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗'] as const
    const index = Math.round(Phaser.Math.Angle.Normalize(angle) / (Math.PI / 4)) % 8
    this.directionText.setText(directions[index])
  }

  private showFeedback(message: string, color: string): void {
    showFloatingFeedback(this, this.feedbackText, message, color)
  }

  private releaseTouchControls(): void {
    this.touchMovement.up = false
    this.touchMovement.down = false
    this.touchMovement.left = false
    this.touchMovement.right = false
  }

  private finishGame(): void {
    if (this.hasFinished) return
    this.hasFinished = true
    this.releaseTouchControls()
    this.input.off('pointerup', this.releaseTouchControls, this)
    this.controlButtons.forEach((button) => button.disableInteractive())
    this.time.removeAllEvents()
    this.tweens.killAll()
    showTimeUpOverlay(this, () => {
      this.onComplete(
        createGameResult(this.job.id, this.score, {
          deliveries: this.deliveries,
        }),
      )
    })
  }

  private cleanup(): void {
    this.releaseTouchControls()
    this.input.off('pointerup', this.releaseTouchControls, this)
    this.controlButtons.forEach((button) => button.removeAllListeners())
    this.controlButtons = []
    this.input.keyboard?.removeAllKeys(true)
    this.time.removeAllEvents()
    this.tweens.killAll()
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
