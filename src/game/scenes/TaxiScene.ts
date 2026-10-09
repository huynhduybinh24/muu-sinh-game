import Phaser from 'phaser'
import { TimedJobScene } from './TimedJobScene'
import { TAXI_CONFIG as C, taxiNodes, taxiNeighbor, taxiMoveOutcome, taxiTripPoints, taxiPatience, type TaxiDirection } from '../config/taxiConfig'
import { getPhaserAvatarData } from '../avatar/avatarData'
import { orderPanel } from '../visual/expansionArt'
import { vehicleArt } from '../visual/professionArt'
import { createCustomer } from '../visual/customer'
import { getSceneFx } from '../visual/feedbackFx'
import { reducedMotion } from '../visual/sceneTheme'
import type { Job } from '../../types/job'
import type { GameResult } from '../../types/game'
import { compatibleVehicle } from '../../services/lifestyle'

export class TaxiScene extends TimedJobScene {
  private stage: 'offered' | 'pickup' | 'destination' | 'waiting' = 'offered'
  private node = 6
  private pickup = 0
  private destination = 8
  private obstacle = 2
  private moving = false
  private elapsed = 0
  private signalElapsed = 0
  private obstacleElapsed = 0
  private remaining = 0
  private mood = 100
  private mistakes = 0
  private trips = 0
  private fiveStars = 0
  private readonly vehicleColor: number
  private hint!: Phaser.GameObjects.Text
  private status!: Phaser.GameObjects.Text
  private car!: Phaser.GameObjects.Graphics
  private trafficCar!: Phaser.GameObjects.Graphics
  private signal!: Phaser.GameObjects.Graphics
  private target!: Phaser.GameObjects.Arc
  private passenger!: Phaser.GameObjects.Container
  private upLabel!: Phaser.GameObjects.Text
  constructor(job: Job, complete: (result: GameResult) => void, avatar = getPhaserAvatarData()) {
    super(job, complete, avatar)
    const color = compatibleVehicle(avatar, 'taxi')?.color
    this.vehicleColor = color ? Number.parseInt(color.slice(1), 16) : 0xedc76d
  }
  protected createPlayArea(): void {
    this.avatar.container.setPosition(45, 471)
    orderPanel(this, 'TAXI PHỐ NHỎ · KHÁCH & CHUYẾN ĐI ÊM')
    this.hint = this.text(180, 130, '', 18); this.status = this.text(180, 168, '', 12)
    const city = this.add.graphics().setDepth(-1)
    city.fillStyle(0xbad3b7).fillRoundedRect(18, 208, 325, 254, 17)
    for (const x of [70, 180, 290]) city.fillStyle(0x8fa49e).fillRect(x - 25, 208, 50, 254)
    for (const y of [240, 330, 420]) city.fillStyle(0x8fa49e).fillRect(18, y - 23, 325, 46)
    for (const x of [105, 215]) for (const y of [276, 366]) {
      city.fillStyle(0xe6c7a4).fillRoundedRect(x, y, 48, 25, 4)
      city.fillStyle(0xb98870).fillTriangle(x - 4, y, x + 23, y - 12, x + 52, y)
      city.fillStyle(0x719e90).fillEllipse(x + 51, y + 15, 15, 19)
    }
    taxiNodes.forEach(({ x, y }, i) => { this.add.circle(x, y, 4, 0xf9efd0); this.text(x + 18, y + 27, String(i + 1), 10) })
    this.target = this.add.circle(0, 0, 25, 0xedd68b, .55).setStrokeStyle(3, 0xfff8dd).setDepth(2)
    this.car = this.add.graphics().setDepth(6).setName('taxi-car'); vehicleArt(this.car, this.vehicleColor)
    this.trafficCar = this.add.graphics().setDepth(4); vehicleArt(this.trafficCar, 0xb899bc)
    this.signal = this.add.graphics().setDepth(7)
    this.passenger = createCustomer(this, 300, 474, .4).container
    this.button('', 180, 521, 104, () => { if (this.stage === 'offered') this.accept(); else this.move('up') })
    this.upLabel = this.text(180, 521, '', 12).setDepth(6)
    this.button('←', 64, 582, 104, () => this.move('left'))
    this.button('↓', 180, 582, 104, () => this.move('down'))
    this.button('→', 296, 582, 104, () => this.move('right'))
    this.text(180, 627, 'Đón khách → chở tới điểm sáng · Đèn đỏ: chờ', 12)
    this.offer()
  }
  private green(): boolean { return this.signalElapsed % (C.signalMs * 2) >= C.signalMs }
  private offer(): void {
    this.stage = 'offered'; this.moving = false; this.elapsed = 0; this.mood = 100; this.mistakes = 0
    const available = taxiNodes.map((_, i) => i).filter(i => i !== this.node)
    this.pickup = Phaser.Utils.Array.GetRandom(available)
    this.destination = Phaser.Utils.Array.GetRandom(available.filter(i => i !== this.pickup))
    this.remaining = taxiPatience(this.trips); this.refreshObstacle(); this.refresh()
    this.car.setPosition(taxiNodes[this.node].x, taxiNodes[this.node].y)
    this.passenger.setVisible(false)
  }
  private accept(): void { this.stage = 'pickup'; this.avatar.setState('work'); this.refresh() }
  private refresh(): void {
    const target = this.stage === 'destination' ? this.destination : this.pickup
    this.target.setPosition(taxiNodes[target].x, taxiNodes[target].y)
    this.hint.setText(this.stage === 'offered' ? `Khách ở điểm ${this.pickup + 1} → tới ${this.destination + 1}` : this.stage === 'pickup' ? `ĐÓN KHÁCH · ĐIỂM ${this.pickup + 1}` : `CHỞ KHÁCH · ĐIỂM ${this.destination + 1}`)
    this.status.setText(`Hài lòng ${Math.ceil(this.mood)}% · Đèn giữa: ${this.green() ? 'XANH' : 'ĐỎ'}`)
    this.upLabel.setText(this.stage === 'offered' ? 'NHẬN CUỐC' : '↑')
    this.signal.clear().fillStyle(0x435761).fillRoundedRect(208, 306, 23, 42, 4)
    this.signal.fillStyle(this.green() ? 0x687b6e : 0xe9a190).fillCircle(220, 317, 6)
    this.signal.fillStyle(this.green() ? 0xa5ce8b : 0x687b6e).fillCircle(220, 336, 6)
  }
  private refreshObstacle(): void {
    const candidates = taxiNodes.map((_, i) => i).filter(i => i !== this.node && i !== this.pickup && i !== this.destination && i !== 4)
    this.obstacle = Phaser.Utils.Array.GetRandom(candidates)
    this.trafficCar.setPosition(taxiNodes[this.obstacle].x, taxiNodes[this.obstacle].y).setRotation(Math.PI / 2)
  }
  private move(direction: TaxiDirection): void {
    if (this.moving || this.stage === 'offered' || this.stage === 'waiting') return
    const target = taxiNeighbor(this.node, direction), outcome = taxiMoveOutcome(target, this.green(), this.obstacle)
    if (outcome === 'edge' || target === null) return
    if (outcome !== 'safe') {
      this.mistakes++; this.mood = Math.max(0, this.mood - (outcome === 'violation' ? C.violationMood : C.collisionMood))
      this.award(outcome === 'violation' ? C.violation : C.collision, outcome === 'violation' ? '-30 VƯỢT ĐÈN ĐỎ!' : '-40 VA XE!', false); this.refresh(); return
    }
    this.moving = true; this.avatar.setState('work')
    this.car.setRotation({ up: 0, down: Math.PI, left: -Math.PI / 2, right: Math.PI / 2 }[direction])
    const { x, y } = taxiNodes[target]
    if (!reducedMotion()) this.tweens.add({ targets: this.car, x, y, duration: C.moveMs, ease: 'Sine.easeInOut' })
    this.time.delayedCall(C.moveMs, () => {
      if (this.hasFinished || this.stage === 'waiting') return
      this.node = target; this.car.setPosition(x, y); this.moving = false; this.arrive()
    })
  }
  private arrive(): void {
    if (this.stage === 'pickup' && this.node === this.pickup) {
      this.stage = 'destination'; this.passenger.setVisible(true); this.refresh(); getSceneFx(this).burst(this.car.x, this.car.y, 0xffdda1)
    } else if (this.stage === 'destination' && this.node === this.destination) {
      const result = taxiTripPoints(this.mood, this.elapsed, this.mistakes)
      this.trips++; if (result.fiveStar) this.fiveStars++
      this.award(result.points, `+${result.points} ${result.fiveStar ? 'CHUYẾN 5 SAO!' : 'ĐẾN NƠI!'} `, true)
      this.countText.setText(`✓ ${this.trips}`); this.wait()
    }
  }
  private wait(): void { this.stage = 'waiting'; this.moving = false; this.time.delayedCall(C.nextMs, () => { if (!this.hasFinished) this.offer() }) }
  protected updatePlay(delta: number): void {
    const previousGreen = this.green(), previousMood = Math.ceil(this.mood)
    this.signalElapsed += delta; this.obstacleElapsed += delta
    if (this.obstacleElapsed >= C.obstacleMs && !this.moving) { this.obstacleElapsed = 0; this.refreshObstacle() }
    if (this.stage === 'pickup' || this.stage === 'destination') {
      this.elapsed += delta; this.remaining -= delta; this.mood = Math.max(0, this.mood - delta / 1000 * C.moodDrain)
      if (this.remaining <= 0 || this.mood === 0) { this.avatar.setState('fail'); this.hint.setText('KHÁCH ĐỢI LÂU · THỬ CUỐC MỚI'); this.wait() }
    }
    // Redraw signs only when their displayed values change, not every frame.
    if (this.stage !== 'waiting' && (previousGreen !== this.green() || previousMood !== Math.ceil(this.mood))) this.refresh()
  }
  protected metadata() { return { tripsCompleted: this.trips, fiveStarTrips: this.fiveStars } }
  protected cleanupInput(): void { this.stage = 'waiting'; this.moving = false }
}
