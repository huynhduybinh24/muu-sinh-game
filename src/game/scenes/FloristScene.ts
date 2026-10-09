import Phaser from 'phaser'
import { TimedJobScene } from './TimedJobScene'
import { FLORIST_CONFIG as C, flowerIds, flowerColors, flowerNames, bouquetOrders, bouquetSlots, evaluateBouquet, type FlowerId, type Ribbon } from '../config/floristConfig'
import { getPhaserAvatarData } from '../avatar/avatarData'
import { orderPanel, counter, flowerArt } from '../visual/expansionArt'
import { getSceneFx } from '../visual/feedbackFx'
import type { Job } from '../../types/job'
import type { GameResult } from '../../types/game'

export class FloristScene extends TimedJobScene {
  private order = bouquetOrders[0]
  private flowers: (FlowerId | null)[] = [null, null, null]
  private ribbon: Ribbon = 'pink'
  private dragging: FlowerId | null = null
  private pointerId: number | null = null
  private made = 0
  private perfect = 0
  private active = true
  private remaining = 0
  private orderText!: Phaser.GameObjects.Text
  private decoration!: Phaser.GameObjects.Text
  private slots: Phaser.GameObjects.Graphics[] = []
  private ghost!: Phaser.GameObjects.Graphics
  private wrap!: Phaser.GameObjects.Graphics
  constructor(job: Job, complete: (result: GameResult) => void, avatar = getPhaserAvatarData()) { super(job, complete, avatar) }
  protected createPlayArea(): void {
    this.avatar.container.setPosition(46, 430)
    orderPanel(this, 'XẾP HOA TỪ TRÁI SANG PHẢI')
    this.orderText = this.text(180, 127, '', 19); this.decoration = this.text(180, 164, '', 13)
    counter(this, 'HOA TƯƠI · GÓI CẢ NIỀM VUI', 0xb5819f)
    this.wrap = this.add.graphics().setDepth(1)
    this.wrap.fillStyle(0xf3dfb5).fillTriangle(94, 273, 316, 273, 211, 436)
    this.wrap.lineStyle(3, 0xfff6dc).lineBetween(105, 282, 211, 425).lineBetween(305, 282, 211, 425)
    this.slots = bouquetSlots.map(({x,y}, i) => {
      this.add.circle(x, y, 30, 0xffffff, 0.45).setStrokeStyle(2, 0xcebb9d)
      this.text(x, y + 37, String(i + 1), 12)
      return this.add.graphics().setPosition(x,y).setDepth(4)
    })
    flowerIds.forEach((id, i) => {
      const x = 75 + i * 105
      const g = this.add.graphics().setPosition(x, 523)
      flowerArt(g, flowerColors[id])
      this.text(x, 564, flowerNames[id], 13)
    })
    this.button('NƠ HỒNG', 92, 465, 154, () => this.chooseRibbon('pink'))
    this.button('NƠ VÀNG', 268, 465, 154, () => this.chooseRibbon('gold'))
    this.button('LÀM LẠI', 92, 614, 154, () => this.resetBouquet())
    this.button('BUỘC HOA', 268, 614, 154, () => this.serve())
    this.ghost = this.add.graphics().setDepth(8).setVisible(false)
    this.input.on('pointerdown', this.beginDrag, this); this.input.on('pointermove', this.drag, this)
    this.input.on('pointerup', this.drop, this); this.input.on('pointerupoutside', this.drop, this)
    this.input.on('nativepause', this.interrupt, this); this.input.on('gameout', this.interrupt, this)
    this.startBouquet()
  }
  private chooseRibbon(ribbon: Ribbon): void {
    if (!this.active) return
    this.ribbon = ribbon
    this.wrap.clear().fillStyle(0xf1deb9).fillTriangle(94, 273, 316, 273, 211, 436)
    this.wrap.fillStyle(ribbon === 'pink' ? 0xd78eab : 0xe3bd64).fillEllipse(194, 390, 40, 18).fillEllipse(226, 390, 40, 18).fillRect(205, 391, 12, 26)
  }
  private resetBouquet(): void { if (!this.active) return; this.flowers = [null, null, null]; this.slots.forEach(g => g.clear()); this.interrupt(); this.chooseRibbon('pink') }
  private startBouquet(): void {
    this.active = true; this.order = bouquetOrders[Phaser.Math.Between(0, bouquetOrders.length - 1)]
    this.remaining = Math.max(C.minimumPatience, C.patience - this.made * 0.4) * 1000
    this.orderText.setText(this.order.flowers.map(id => flowerNames[id]).join(' → '))
    this.decoration.setText(`Khách muốn: NƠ ${this.order.ribbon === 'pink' ? 'HỒNG' : 'VÀNG'}`); this.resetBouquet()
  }
  private beginDrag(pointer: Phaser.Input.Pointer): void {
    if (!this.active || this.pointerId !== null || pointer.worldY < 490 || pointer.worldY > 559) return
    const i = [75, 180, 285].findIndex(x => Math.abs(x - pointer.worldX) <= 38)
    if (i < 0) return
    this.dragging = flowerIds[i]; this.pointerId = pointer.id; this.avatar.setState('work')
    flowerArt(this.ghost, flowerColors[this.dragging]); this.ghost.setPosition(pointer.worldX, pointer.worldY).setVisible(true)
  }
  private drag(pointer: Phaser.Input.Pointer): void { if (pointer.id === this.pointerId && pointer.isDown) this.ghost.setPosition(pointer.worldX, pointer.worldY) }
  private drop(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.pointerId || this.dragging === null) return
    const i = bouquetSlots.findIndex(({x,y}) => Math.hypot(x - pointer.worldX, y - pointer.worldY) <= C.slotRadius)
    if (i >= 0) { this.flowers[i] = this.dragging; flowerArt(this.slots[i], flowerColors[this.dragging]); getSceneFx(this).burst(bouquetSlots[i].x, bouquetSlots[i].y, flowerColors[this.dragging]) }
    this.interrupt()
  }
  private interrupt(): void { this.pointerId = null; this.dragging = null; this.ghost.setVisible(false); if (!this.hasFinished) this.avatar.setState('idle') }
  private serve(): void {
    if (!this.active) return
    const result = evaluateBouquet(this.flowers, this.ribbon, this.order), success = result.grade !== 'wrong'
    if (success) this.made++; if (result.grade === 'perfect') this.perfect++
    this.award(result.points, `${result.points > 0 ? '+' : ''}${result.points} ${success ? 'BÓ HOA XINH!' : 'LỆCH MẪU!'}`, success); this.countText.setText(`✓ ${this.made}`); this.nextBouquet()
  }
  private nextBouquet(): void { this.active = false; this.interrupt(); this.time.delayedCall(C.nextMs, () => { if (!this.hasFinished) this.startBouquet() }) }
  protected updatePlay(delta: number): void { if (this.active) { this.remaining -= delta; if (this.remaining <= 0) { this.award(C.wrong, '-30 HOA CHƯA XONG!', false); this.nextBouquet() } } }
  protected metadata() { return { bouquetsMade: this.made, perfectBouquets: this.perfect } }
  protected cleanupInput(): void {
    this.pointerId = null; this.dragging = null
    this.input.off('pointerdown', this.beginDrag, this); this.input.off('pointermove', this.drag, this)
    this.input.off('pointerup', this.drop, this); this.input.off('pointerupoutside', this.drop, this)
    this.input.off('nativepause', this.interrupt, this); this.input.off('gameout', this.interrupt, this)
  }
}

