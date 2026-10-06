import Phaser from 'phaser'
import { showFloatingFeedback, showTimeUpOverlay } from '../gameFeedback'
import {
  CUSTOMER_PATIENCE_RANGE,
  PRESS_DURATION_MS,
  createEmptyDrink,
  getIceLabel,
  getNextIceLevel,
  isCorrectDrink,
  sugarcaneOrders,
  type DrinkState,
  type SugarcaneOrder,
} from '../config/sugarcaneOrders'
import { createGameResult } from '../../services/resultCalculator'
import { playAudioCue } from '../../services/audioFeedback'
import type { GameResult } from '../../types/game'
import type { Job } from '../../types/job'

const COLORS = {
  ink: 0x20211d,
  cream: 0xfff7df,
  yellow: 0xf6c945,
  green: 0x3b8d4d,
  paleGreen: 0xdff1c8,
  orange: 0xf19035,
  red: 0xdf382b,
  white: 0xffffff,
  muted: 0x8a815f,
} as const

const CUSTOMER_FACES = ['🙂', '😎', '🤓', '😊'] as const

export class SugarcaneScene extends Phaser.Scene {
  private readonly job: Job
  private readonly onComplete: (result: GameResult) => void
  private score = 0
  private customersServed = 0
  private remainingGameMs: number
  private customerRemainingMs = 0
  private customerTotalMs = 0
  private drink: DrinkState = createEmptyDrink()
  private currentOrder: SugarcaneOrder = sugarcaneOrders[0]
  private hasSpawnedCustomer = false
  private hasFinished = false
  private isProcessing = false
  private customerTransition = false
  private pressTween: Phaser.Tweens.Tween | null = null
  private timerText!: Phaser.GameObjects.Text
  private scoreText!: Phaser.GameObjects.Text
  private servedText!: Phaser.GameObjects.Text
  private customerFaceText!: Phaser.GameObjects.Text
  private orderNameText!: Phaser.GameObjects.Text
  private orderDetailsText!: Phaser.GameObjects.Text
  private drinkStatusText!: Phaser.GameObjects.Text
  private feedbackText!: Phaser.GameObjects.Text
  private patienceFill!: Phaser.GameObjects.Rectangle
  private processingFill!: Phaser.GameObjects.Rectangle
  private machineRoller!: Phaser.GameObjects.Arc
  private serveButton!: Phaser.GameObjects.Rectangle
  private interactiveButtons: Phaser.GameObjects.Rectangle[] = []

  constructor(job: Job, onComplete: (result: GameResult) => void) {
    super({ key: job.sceneKey })
    this.job = job
    this.onComplete = onComplete
    this.remainingGameMs = job.duration * 1_000
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.cream)
    this.createHud()
    this.createCustomerArea()
    this.createWorkArea()
    this.createControls()
    this.spawnCustomer()

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this)
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this)
  }

  update(_time: number, delta: number): void {
    if (this.hasFinished) return

    this.remainingGameMs = Math.max(0, this.remainingGameMs - delta)
    this.timerText.setText(`⏱ ${Math.ceil(this.remainingGameMs / 1_000)}s`)

    if (this.remainingGameMs <= 0) {
      this.finishGame()
      return
    }

    if (!this.customerTransition) {
      this.customerRemainingMs = Math.max(0, this.customerRemainingMs - delta)
      this.updatePatienceBar()

      if (this.customerRemainingMs <= 0) this.handlePatienceExpired()
    }
  }

  private createHud(): void {
    this.add.rectangle(180, 42, 360, 84, COLORS.ink)
    this.add
      .text(180, 20, 'BÁN NƯỚC MÍA', this.textStyle(21, '#f6c945', 'bold'))
      .setOrigin(0.5)

    this.timerText = this.add
      .text(55, 58, `⏱ ${this.job.duration}s`, this.textStyle(16, '#ffffff', 'bold'))
      .setOrigin(0.5)
    this.scoreText = this.add
      .text(180, 58, '⭐ 0', this.textStyle(16, '#ffffff', 'bold'))
      .setOrigin(0.5)
    this.servedText = this.add
      .text(300, 58, '💰 0 khách', this.textStyle(14, '#ffffff', 'bold'))
      .setOrigin(0.5)
  }

  private createCustomerArea(): void {
    this.add.rectangle(180, 164, 332, 136, COLORS.white).setStrokeStyle(2, COLORS.ink)
    this.add.circle(62, 151, 37, COLORS.paleGreen).setStrokeStyle(2, COLORS.ink)
    this.customerFaceText = this.add
      .text(62, 151, '🙂', this.textStyle(39, '#20211d'))
      .setOrigin(0.5)

    this.add.text(112, 105, 'KHÁCH GỌI', this.textStyle(11, '#8a815f', 'bold'))
    this.orderNameText = this.add.text(112, 122, '', this.textStyle(21, '#20211d', 'bold'))
    this.orderDetailsText = this.add.text(112, 150, '', this.textStyle(13, '#57594f'))
    this.add.text(29, 200, 'Kiên nhẫn', this.textStyle(11, '#57594f', 'bold'))
    this.add.rectangle(228, 207, 208, 12, 0xe6dfc9).setOrigin(0.5)
    this.patienceFill = this.add
      .rectangle(124, 207, 208, 12, COLORS.green)
      .setOrigin(0, 0.5)
  }

  private createWorkArea(): void {
    this.add.rectangle(180, 336, 332, 206, 0xffefb1).setStrokeStyle(2, COLORS.ink)

    this.add.rectangle(76, 324, 92, 120, COLORS.green).setStrokeStyle(3, COLORS.ink)
    this.machineRoller = this.add.circle(76, 303, 25, COLORS.yellow).setStrokeStyle(3, COLORS.ink)
    this.add.rectangle(76, 365, 54, 18, COLORS.ink)
    this.add
      .text(76, 263, 'MÁY ÉP', this.textStyle(12, '#20211d', 'bold'))
      .setOrigin(0.5)
    this.add
      .text(76, 325, '≋', this.textStyle(29, '#20211d', 'bold'))
      .setOrigin(0.5)

    this.add.rectangle(255, 330, 82, 100, COLORS.white).setStrokeStyle(3, COLORS.ink)
    this.add.rectangle(255, 366, 68, 20, 0xa8d273)
    this.add
      .text(255, 276, 'LY HIỆN TẠI', this.textStyle(11, '#20211d', 'bold'))
      .setOrigin(0.5)
    this.add
      .text(255, 323, '🥤', this.textStyle(38, '#20211d'))
      .setOrigin(0.5)

    this.drinkStatusText = this.add
      .text(180, 397, '', {
        ...this.textStyle(13, '#20211d', 'bold'),
        align: 'center',
      })
      .setOrigin(0.5)

    this.add.rectangle(180, 430, 260, 8, 0xd7c98f)
    this.processingFill = this.add
      .rectangle(50, 430, 260, 8, COLORS.orange)
      .setOrigin(0, 0.5)
      .setScale(0, 1)

    this.feedbackText = this.add
      .text(180, 446, '', {
        ...this.textStyle(15, '#df382b', 'bold'),
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(10)
  }

  private createControls(): void {
    this.createButton('🧊 THÊM ĐÁ', 91, 485, 152, 46, COLORS.white, () => this.addIce())
    this.createButton('🍊 THÊM TẮC', 269, 485, 152, 46, COLORS.white, () => this.toggleKumquat())
    this.createButton('🎋 ÉP MÍA', 91, 541, 152, 46, COLORS.green, () => this.pressSugarcane(), '#ffffff')
    this.createButton('↺ LÀM LẠI', 269, 541, 152, 46, COLORS.white, () => this.resetDrink())
    this.serveButton = this.createButton(
      'GIAO KHÁCH →',
      180,
      604,
      330,
      58,
      COLORS.red,
      () => this.serveDrink(),
      '#ffffff',
    )
    this.updateDrinkDisplay()
  }

  private createButton(
    label: string,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
    onPress: () => void,
    textColor = '#20211d',
  ): Phaser.GameObjects.Rectangle {
    const button = this.add
      .rectangle(x, y, width, height, color)
      .setStrokeStyle(2, COLORS.ink)
      .setInteractive({ useHandCursor: true })

    const labelText = this.add
      .text(x, y, label, this.textStyle(14, textColor, 'bold'))
      .setOrigin(0.5)

    button.on('pointerdown', () => {
      if (this.hasFinished || this.customerTransition) return
      playAudioCue('click')
      onPress()
      this.tweens.add({ targets: [button, labelText], scale: 0.96, duration: 65, yoyo: true })
    })

    this.interactiveButtons.push(button)
    return button
  }

  private addIce(): void {
    if (this.isProcessing) return
    this.drink.iceLevel = getNextIceLevel(this.drink.iceLevel)
    this.updateDrinkDisplay()
  }

  private toggleKumquat(): void {
    if (this.isProcessing) return
    this.drink.kumquat = !this.drink.kumquat
    this.updateDrinkDisplay()
  }

  private pressSugarcane(): void {
    if (this.isProcessing || this.drink.pressed) return

    this.isProcessing = true
    this.processingFill.setScale(0, 1)
    this.machineRoller.setAngle(0)
    this.updateDrinkDisplay()

    this.tweens.add({
      targets: this.machineRoller,
      angle: 360,
      duration: PRESS_DURATION_MS,
      ease: 'Linear',
    })

    this.pressTween = this.tweens.add({
      targets: this.processingFill,
      scaleX: 1,
      duration: PRESS_DURATION_MS,
      ease: 'Linear',
      onComplete: () => {
        if (this.hasFinished || this.customerTransition) return
        this.isProcessing = false
        this.drink.pressed = true
        this.pressTween = null
        this.showFeedback('ÉP XONG! SẴN SÀNG GIAO', '#3b8d4d')
        this.updateDrinkDisplay()
      },
    })
  }

  private serveDrink(): void {
    if (this.isProcessing) {
      this.showFeedback('MÁY ĐANG ÉP...', '#df382b')
      return
    }

    if (!this.drink.pressed) {
      this.showFeedback('ÉP MÍA TRƯỚC ĐÃ!', '#df382b')
      return
    }

    if (isCorrectDrink(this.drink, this.currentOrder)) {
      const fastBonus = Math.round(50 * (this.customerRemainingMs / this.customerTotalMs))
      this.score += 100 + fastBonus
      this.customersServed += 1
      playAudioCue('success')
      this.showFeedback(`+100 CHÍNH XÁC!  +${fastBonus} NHANH TAY!`, '#3b8d4d')
    } else {
      this.score = Math.max(0, this.score - 50)
      playAudioCue('error')
      this.showFeedback('-50 SAI MÓN!', '#df382b')
    }

    this.updateHud()
    this.queueNextCustomer()
  }

  private handlePatienceExpired(): void {
    if (this.customerTransition || this.hasFinished) return
    this.score = Math.max(0, this.score - 30)
    playAudioCue('error')
    this.showFeedback('KHÁCH BỎ ĐI!  -30', '#df382b')
    this.updateHud()
    this.queueNextCustomer()
  }

  private queueNextCustomer(): void {
    this.customerTransition = true
    this.resetDrink()
    this.time.delayedCall(550, () => {
      if (this.hasFinished) return
      this.spawnCustomer()
      this.customerTransition = false
    })
  }

  private spawnCustomer(): void {
    const candidates = this.hasSpawnedCustomer
      ? sugarcaneOrders.filter((order) => order.id !== this.currentOrder.id)
      : [...sugarcaneOrders]
    this.currentOrder = Phaser.Utils.Array.GetRandom(candidates)
    this.hasSpawnedCustomer = true
    this.customerTotalMs = Phaser.Math.Between(
      CUSTOMER_PATIENCE_RANGE.min * 1_000,
      CUSTOMER_PATIENCE_RANGE.max * 1_000,
    )
    this.customerRemainingMs = this.customerTotalMs

    this.customerFaceText.setText(Phaser.Utils.Array.GetRandom([...CUSTOMER_FACES]))
    this.orderNameText.setText(this.currentOrder.name)
    this.orderDetailsText.setText(this.currentOrder.shortDescription)
    this.updatePatienceBar()
  }

  private resetDrink(): void {
    this.pressTween?.stop()
    this.pressTween = null
    this.isProcessing = false
    this.drink = createEmptyDrink()
    this.processingFill.setScale(0, 1)
    this.machineRoller.setAngle(0)
    this.updateDrinkDisplay()
  }

  private updateDrinkDisplay(): void {
    const pressedLabel = this.isProcessing ? 'Đang ép...' : this.drink.pressed ? 'Đã ép' : 'Chưa ép'
    this.drinkStatusText.setText(
      `Đá: ${getIceLabel(this.drink.iceLevel)}   •   Tắc: ${this.drink.kumquat ? 'Có' : 'Không'}\nMía: ${pressedLabel}`,
    )
    this.serveButton?.setFillStyle(
      this.drink.pressed && !this.isProcessing ? COLORS.red : COLORS.muted,
    )
  }

  private updateHud(): void {
    this.scoreText.setText(`⭐ ${this.score}`)
    this.servedText.setText(`💰 ${this.customersServed} khách`)
  }

  private updatePatienceBar(): void {
    const ratio = Phaser.Math.Clamp(this.customerRemainingMs / this.customerTotalMs, 0, 1)
    const color = ratio > 0.55 ? COLORS.green : ratio > 0.25 ? COLORS.orange : COLORS.red
    this.patienceFill.setScale(ratio, 1).setFillStyle(color)
  }

  private showFeedback(message: string, color: string): void {
    showFloatingFeedback(this, this.feedbackText, message, color)
  }

  private finishGame(): void {
    if (this.hasFinished) return
    this.hasFinished = true
    this.interactiveButtons.forEach((button) => button.disableInteractive())
    this.time.removeAllEvents()
    this.tweens.killAll()
    showTimeUpOverlay(this, () => {
      this.onComplete(
        createGameResult(this.job.id, this.score, {
          customersServed: this.customersServed,
        }),
      )
    })
  }

  private cleanup(): void {
    this.pressTween?.stop()
    this.pressTween = null
    this.time.removeAllEvents()
    this.interactiveButtons.forEach((button) => button.removeAllListeners())
    this.interactiveButtons = []
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
