import Phaser from 'phaser'
import { TimedJobScene } from './TimedJobScene'
import { HARVEST_CONFIG as C, orchardItem, harvestPoints, harvestWaveMs, type OrchardItem } from '../config/harvestConfig'
import { getPhaserAvatarData } from '../avatar/avatarData'
import { orderPanel, fruitArt } from '../visual/expansionArt'
import { getSceneFx } from '../visual/feedbackFx'
import type { Job } from '../../types/job'
import type { GameResult } from '../../types/game'

export class HarvestScene extends TimedJobScene {
  private fruitKinds: OrchardItem[] = []
  private picked = 0
  private baskets = 0
  private combo = 0
  private remaining = 0
  private fruits: Phaser.GameObjects.Graphics[] = []
  private markers: Phaser.GameObjects.Text[] = []
  private active: boolean[] = []
  private hint!: Phaser.GameObjects.Text
  private basketFill!: Phaser.GameObjects.Graphics
  constructor(job: Job, complete: (result: GameResult) => void, avatar = getPhaserAvatarData()) { super(job, complete, avatar) }
  protected createPlayArea(): void {
    this.avatar.container.setPosition(46, 531)
    orderPanel(this, 'CHỌN QUẢ VÀNG ★ · TRÁNH QUẢ XANH & ONG')
    this.hint = this.text(180, 140, '', 21)
    const tree = this.add.graphics().setDepth(-1)
    tree.fillStyle(0xb19565).fillRoundedRect(162, 225, 35, 233, 8)
    tree.lineStyle(13, 0xb19565).lineBetween(176, 362, 63, 291).lineBetween(180, 313, 296, 235).lineBetween(180, 406, 293, 377)
    tree.fillStyle(0x93b784).fillEllipse(81, 243, 119, 106).fillEllipse(278, 247, 128, 111).fillEllipse(180, 254, 173, 111)
    tree.fillStyle(0xaccc92).fillEllipse(82, 379, 134, 119).fillEllipse(280, 378, 117, 120)
    for (let i = 0; i < 9; i++) {
      const x = 76 + i % 3 * 104, y = 240 + Math.floor(i / 3) * 88
      const g = this.add.graphics().setPosition(x, y).setDepth(4)
      this.fruits.push(g); this.markers.push(this.text(x, y + 27, '', 14).setDepth(5))
      // Generous hit area without decorative button art covering the fruit.
      this.add.rectangle(x, y, 78, 74, 0xffffff, 0).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => { if (!this.hasFinished) this.pick(i) })
    }
    const basket = this.add.graphics()
    basket.fillStyle(0xbf8e5f).fillRoundedRect(124, 539, 188, 63, 12)
    basket.lineStyle(2, 0xe8c08d)
    for (let x = 135; x < 302; x += 21) basket.lineBetween(x, 545, x - 5, 596)
    for (let y = 551; y < 597; y += 13) basket.lineBetween(132, y, 304, y)
    this.basketFill = this.add.graphics().setDepth(2)
    this.text(180, 628, '5 quả đầy giỏ +100 · Hái liên tục tạo combo', 12)
    this.newWave()
  }
  private newWave(): void {
    this.fruitKinds = Array.from({ length: 9 }, () => orchardItem(Phaser.Math.FloatBetween(0, 1)))
    if (this.fruitKinds.filter(kind => kind === 'ripe').length < 2) { this.fruitKinds[0] = 'ripe'; this.fruitKinds[4] = 'ripe' }
    this.active = this.fruitKinds.map(() => true); this.remaining = harvestWaveMs(this.picked)
    this.fruits.forEach((g, i) => { fruitArt(g, this.fruitKinds[i] === 'ripe' ? 0xf0c46c : 0x82ac73, this.fruitKinds[i] === 'hazard'); g.setVisible(true); this.markers[i].setText(this.fruitKinds[i] === 'ripe' ? '★' : this.fruitKinds[i] === 'unripe' ? '—' : '×').setVisible(true) })
    this.refresh()
  }
  private refresh(): void {
    this.hint.setText(`GIỎ ${this.picked % C.basketSize}/${C.basketSize} · x${this.combo}`)
    this.basketFill.clear()
    for (let i = 0; i < this.picked % C.basketSize; i++) this.basketFill.fillStyle(0xf0c46c).fillEllipse(147 + i * 33, 541, 32, 35)
  }
  private pick(index: number): void {
    if (!this.active[index]) return
    this.active[index] = false; this.fruits[index].setVisible(false); this.markers[index].setVisible(false)
    const correct = this.fruitKinds[index] === 'ripe'
    if (correct) { this.picked++; this.combo++ } else this.combo = 0
    let points = harvestPoints(correct, this.combo)
    const basket = correct && this.picked % C.basketSize === 0
    if (basket) { this.baskets++; points += C.basket }
    this.award(points, correct ? `+${points} ${basket ? 'ĐẦY GIỎ!' : 'CHÍN NGỌT!'} x${this.combo}` : '-20 QUẢ XANH / ONG!', correct)
    if (correct) getSceneFx(this).burst(this.fruits[index].x, this.fruits[index].y, 0xb7cf83, 'dust')
    this.countText.setText(`✓ ${this.picked}`); this.refresh()
    if (!this.fruitKinds.some((kind, i) => kind === 'ripe' && this.active[i])) this.remaining = Math.min(this.remaining, 400)
  }
  protected updatePlay(delta: number): void {
    this.remaining -= delta
    if (this.remaining <= 0) { if (this.fruitKinds.some((kind, i) => kind === 'ripe' && this.active[i])) this.combo = 0; this.newWave() }
  }
  protected metadata() { return { fruitsHarvested: this.picked, basketsCompleted: this.baskets } }
  protected cleanupInput(): void { this.active.fill(false) }
}

