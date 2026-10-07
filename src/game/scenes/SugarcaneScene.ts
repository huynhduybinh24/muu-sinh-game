import Phaser from 'phaser'
import { getPhaserAvatarData, type PhaserAvatarData } from '../avatar/avatarData'
import { createPhaserAvatar, type PhaserAvatar } from '../avatar/createPhaserAvatar'
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
import { createEnvironment, hudPanel, panel, decorateButton, updateButtonArt } from '../visual/environment'
import { createCustomer, type CustomerVisual } from '../visual/customer'
import { getSceneFx } from '../visual/feedbackFx'
import { reducedMotion } from '../visual/sceneTheme'

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

export class SugarcaneScene extends Phaser.Scene {
  private readonly job: Job
  private readonly onComplete: (result: GameResult) => void
  private readonly avatarData: PhaserAvatarData
  private avatar: PhaserAvatar | null = null
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
  private customer!: CustomerVisual
  private cupFill!: Phaser.GameObjects.Rectangle
  private cupDetails!: Phaser.GameObjects.Graphics
  private orderNameText!: Phaser.GameObjects.Text
  private orderDetailsText!: Phaser.GameObjects.Text
  private drinkStatusText!: Phaser.GameObjects.Text
  private feedbackText!: Phaser.GameObjects.Text
  private patienceFill!: Phaser.GameObjects.Rectangle
  private processingFill!: Phaser.GameObjects.Rectangle
  private machineRoller!: Phaser.GameObjects.Arc
  private serveButton!: Phaser.GameObjects.Rectangle
  private interactiveButtons: Phaser.GameObjects.Rectangle[] = []

  constructor(job: Job, onComplete: (result: GameResult) => void, avatarData = getPhaserAvatarData()) {
    super({ key: job.sceneKey })
    this.job = job
    this.onComplete = onComplete
    this.avatarData = avatarData
    this.remainingGameMs = job.duration * 1_000
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.cream)
    createEnvironment(this, this.job.id)
    getSceneFx(this)
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
    hudPanel(this, this.job.id)
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
    panel(this, 180, 164, 332, 136)
    this.add.circle(62, 151, 39, 0xe6f3dc)
    this.customer = createCustomer(this, 62, 149, 0.95)

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
    const stall = this.add.graphics()
    stall.fillStyle(0x62834e).fillRoundedRect(28, 262, 94, 120, 13)
    stall.fillStyle(0x38634c).fillRoundedRect(35, 270, 80, 105, 10)
    stall.fillStyle(0x9fb8a4).fillRoundedRect(37, 278, 76, 60, 8)
    stall.fillStyle(0xe9e6ca).fillRoundedRect(43, 282, 64, 54, 6)
    for (let x = 42; x <= 103; x += 14) {
      stall.lineStyle(6, 0xadb752).lineBetween(x, 267, x + 16, 241)
      stall.lineStyle(1, 0x6e8c47).lineBetween(x + 1, 263, x + 14, 247)
    }
    stall.fillStyle(0x243f35).fillRoundedRect(44, 349, 62, 19, 4)
    stall.fillStyle(0xc5d7c3).fillRoundedRect(48, 351, 53, 6, 3)
    this.machineRoller = this.add.circle(76, 303, 21, 0xb0bca8).setStrokeStyle(3, 0x46604d)
    const spoke = this.add.graphics().setPosition(76, 303)
    spoke.lineStyle(3, 0x52634e).lineBetween(-14, 0, 14, 0).lineBetween(0, -14, 0, 14)
    this.machineRoller.setData('spoke', spoke)
    this.add
      .text(76, 263, 'MÁY ÉP', this.textStyle(12, '#20211d', 'bold'))
      .setOrigin(0.5)
    this.add
      .text(76, 325, '≋', this.textStyle(29, '#20211d', 'bold'))
      .setOrigin(0.5)

    stall.fillStyle(0x413f3b, 0.13).fillEllipse(255, 382, 79, 12)
    stall.fillStyle(0xffffff, 0.9).fillRoundedRect(217, 295, 76, 83, { tl: 5, tr: 5, bl: 18, br: 18 })
    this.cupFill = this.add.rectangle(255, 372, 60, 68, 0xb8d571).setOrigin(0.5, 1).setScale(1, 0)
    this.cupDetails = this.add.graphics()
    this.cupDetails.lineStyle(3, 0x75917c).strokeRoundedRect(217, 295, 76, 83, { tl: 5, tr: 5, bl: 18, br: 18 })
    this.cupDetails.lineStyle(5, 0xe0f2ee).lineBetween(229, 308, 229, 356)
    this.cupDetails.lineStyle(4, 0xea9b63).lineBetween(268, 314, 279, 281)
    this.cupDetails.lineStyle(3, 0xffffff).lineBetween(214, 295, 296, 295)
    this.avatar = createPhaserAvatar(this, this.avatarData, { x: 166, y: 377, scale: 0.65 })
    this.add
      .text(255, 276, 'LY HIỆN TẠI', this.textStyle(11, '#20211d', 'bold'))
      .setOrigin(0.5)
    // Original cup/tray illustration; the drink state remains the same data.
    stall.fillStyle(0xf8f1d6).fillRoundedRect(137, 241, 59, 18, 6)
    stall.fillStyle(0xcfe8ec).fillRoundedRect(142, 244, 12, 11, 3).fillRoundedRect(156, 244, 12, 11, 3)
    stall.fillStyle(0xe0aa4e).fillCircle(181, 250, 6)

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
    decorateButton(this, button, color, textColor === '#ffffff')
    labelText.setDepth(3)

    button.on('pointerdown', () => {
      if (this.hasFinished || this.customerTransition) return
      playAudioCue('click')
      onPress()
      if (!reducedMotion()) this.tweens.add({ targets: labelText, scale: 0.96, duration: 65, yoyo: true })
    })

    this.interactiveButtons.push(button)
    return button
  }

  private addIce(): void {
    if (this.isProcessing) return
    this.drink.iceLevel = getNextIceLevel(this.drink.iceLevel)
    this.updateDrinkDisplay()
    getSceneFx(this).burst(252, 326, 0xdffaff, 'water')
  }

  private toggleKumquat(): void {
    if (this.isProcessing) return
    this.drink.kumquat = !this.drink.kumquat
    this.updateDrinkDisplay()
    getSceneFx(this).burst(255, 331, 0xeab652)
  }

  private pressSugarcane(): void {
    if (this.isProcessing || this.drink.pressed) return

    this.isProcessing = true
    this.avatar?.setState('work')
    this.processingFill.setScale(0, 1)
    this.machineRoller.setAngle(0)
    this.updateDrinkDisplay()

    this.tweens.add({
      targets: this.machineRoller,
      angle: 360,
      duration: PRESS_DURATION_MS,
      ease: 'Linear',
      onUpdate: () => {
        const spoke = this.machineRoller.getData('spoke') as Phaser.GameObjects.Graphics
        if (!reducedMotion()) spoke.setAngle(this.machineRoller.angle)
      },
    })

    this.pressTween = this.tweens.add({
      targets: this.processingFill,
      scaleX: 1,
      duration: PRESS_DURATION_MS,
      ease: 'Linear',
      onComplete: () => {
        if (this.hasFinished || this.customerTransition) return
        this.isProcessing = false
        this.avatar?.setState('idle')
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
      this.avatar?.setState('success')
      this.customer.react(true)
      getSceneFx(this).burst(255, 332, 0xf4d57d)
      this.showFeedback(`+100 CHÍNH XÁC!  +${fastBonus} NHANH TAY!`, '#3b8d4d')
    } else {
      this.score = Math.max(0, this.score - 50)
      playAudioCue('error')
      this.avatar?.setState('fail')
      this.customer.react(false)
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
    this.avatar?.setState('fail')
    this.customer.react(false)
    this.updateHud()
    this.queueNextCustomer()
  }

  private queueNextCustomer(): void {
    this.customerTransition = true
    this.customer.exit()
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

    this.customer.next()
    this.orderNameText.setText(this.currentOrder.name)
    this.orderDetailsText.setText(this.currentOrder.shortDescription)
    this.updatePatienceBar()
  }

  private resetDrink(): void {
    this.avatar?.setState('idle')
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
    const color = this.drink.pressed && !this.isProcessing ? 0xc25c4d : 0x8b998c
    if (this.serveButton) updateButtonArt(this, this.serveButton, color)
    this.tweens.killTweensOf(this.cupFill)
    if (this.drink.pressed && !reducedMotion()) this.tweens.add({ targets: this.cupFill, scaleY: 1, duration: 200 })
    else this.cupFill.setScale(1, this.drink.pressed ? 1 : 0)
    this.cupDetails.clear()
    this.cupDetails.lineStyle(3, 0x75917c).strokeRoundedRect(217, 295, 76, 83, { tl: 5, tr: 5, bl: 18, br: 18 })
    this.cupDetails.lineStyle(5, 0xffffff, 0.7).lineBetween(229, 308, 229, 356)
    this.cupDetails.lineStyle(4, 0xea9b63).lineBetween(268, 314, 279, 281)
    this.cupDetails.lineStyle(3, 0xffffff).lineBetween(214, 295, 296, 295)
    if (this.drink.iceLevel !== 'none') {
      this.cupDetails.fillStyle(0xe6f7ff, 0.8).fillRoundedRect(233, 316, 14, 12, 3)
      if (this.drink.iceLevel === 'normal') this.cupDetails.fillRoundedRect(254, 328, 14, 12, 3)
    }
    if (this.drink.kumquat) this.cupDetails.fillStyle(0xe8b650).fillCircle(273, 344, 8).lineStyle(1, 0xfff4bc).strokeCircle(273, 344, 5)
  }

  private updateHud(): void {
    this.scoreText.setText(`⭐ ${this.score}`)
    getSceneFx(this).pulse(this.scoreText)
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
    this.avatar?.destroy()
    this.avatar = null
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
    this.avatar?.destroy()
    this.avatar = null
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
