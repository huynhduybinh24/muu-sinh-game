import Phaser from 'phaser'
import { TimedJobScene } from './TimedJobScene'
import { PHOTO_CONFIG as C, evaluatePhoto, advancePhotoPhase } from '../config/photographerConfig'
import { getPhaserAvatarData } from '../avatar/avatarData'
import { orderPanel } from '../visual/expansionArt'
import { panel } from '../visual/environment'
import { getSceneFx } from '../visual/feedbackFx'
import { reducedMotion } from '../visual/sceneTheme'
import type { Job } from '../../types/job'
import type { GameResult } from '../../types/game'

export class PhotographerScene extends TimedJobScene {
  private elapsed = 0
  private phase = 0
  private movedAt = -1000
  private shotAt = -1000
  private pointerId: number | null = null
  private taken = 0
  private perfect = 0
  private pose = 0
  private subject!: Phaser.GameObjects.Container
  private frame!: Phaser.GameObjects.Container
  private status!: Phaser.GameObjects.Text
  private preview!: Phaser.GameObjects.Graphics
  constructor(job: Job, complete: (result: GameResult) => void, avatar = getPhaserAvatarData()) { super(job, complete, avatar) }
  protected createPlayArea(): void {
    this.avatar.container.setPosition(46, 482)
    orderPanel(this, 'CHỤP CHÚ CHIM · KHUNG CHUẨN + ĐÚNG NHỊP')
    this.status = this.text(180, 138, 'Kéo khung ngắm · Giữ yên · Chụp', 17)
    panel(this, 188, 329, 298, 249, 0xd8e8c6)
    const park = this.add.graphics()
    park.fillStyle(0x8fae83).fillEllipse(105, 260, 83, 65).fillEllipse(294, 248, 91, 72)
    park.fillStyle(0xbac9a0).fillRoundedRect(43, 398, 290, 44, 14)
    park.lineStyle(5, 0xc3a174).lineBetween(59, 363, 116, 363).lineBetween(276, 354, 325, 354)
    const bird = this.add.graphics()
    bird.fillStyle(0xc3a376).fillEllipse(0, 6, 37, 45).fillStyle(0xf5deb0).fillEllipse(4, 13, 23, 30)
    bird.fillStyle(0x977d5e).fillEllipse(-10, 5, 16, 31).fillStyle(0xf3c06e).fillTriangle(14, -9, 27, -3, 14, 2)
    bird.fillStyle(0x4b5c58).fillCircle(8, -11, 3)
    const halo = this.add.circle(0, 0, 29, 0xf5d37c, 0.25).setName('pose-halo')
    this.subject = this.add.container(180, 313, [halo, bird]).setDepth(3).setName('photo-subject')
    const sight = this.add.graphics()
    sight.lineStyle(3, 0xfffaf0).strokeRoundedRect(-45, -51, 90, 102, 9)
    sight.lineStyle(2, 0x557f7c).lineBetween(-8, 0, 8, 0).lineBetween(0, -8, 0, 8)
    this.frame = this.add.container(180, 313, [sight]).setDepth(7).setName('viewfinder')
    panel(this, 267, 514, 111, 67, 0xfff7e0)
    this.preview = this.add.graphics().setPosition(267, 514).setDepth(2)
    this.text(112, 517, 'GIỮ YÊN KHUNG', 13)
    this.button('CHỤP', 180, 579, 326, () => this.shutter())
    this.text(180, 626, 'Chim sáng vàng: đúng nhịp · Giữ khung 0,24s', 11)
    this.input.on('pointerdown', this.beginAim, this); this.input.on('pointermove', this.aim, this)
    this.input.on('pointerup', this.interrupt, this); this.input.on('pointerupoutside', this.interrupt, this)
    this.input.on('nativepause', this.interrupt, this); this.input.on('gameout', this.interrupt, this)
  }
  private beginAim(pointer: Phaser.Input.Pointer): void {
    if (this.pointerId !== null || pointer.worldY < 216 || pointer.worldY > 440 || this.hasFinished) return
    this.pointerId = pointer.id; this.avatar.setState('work'); this.aim(pointer)
  }
  private aim(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.pointerId || !pointer.isDown) return
    const x = Phaser.Math.Clamp(pointer.worldX, 73, 305), y = Phaser.Math.Clamp(pointer.worldY, 248, 404)
    if (Math.hypot(x - this.frame.x, y - this.frame.y) > 1) this.movedAt = this.elapsed
    this.frame.setPosition(x,y)
  }
  private interrupt(): void { this.pointerId = null; if (!this.hasFinished) this.avatar.setState('idle') }
  protected updatePlay(delta: number): void {
    this.elapsed += delta
    this.phase = advancePhotoPhase(this.phase, delta, this.taken)
    const phase = this.phase
    this.subject.setPosition(188 + Math.sin(phase) * 79, 316 + Math.cos(phase * 1.3) * 28)
    this.pose = Math.sin(phase * 2.2)
    const halo = this.subject.list[0]
    if (halo instanceof Phaser.GameObjects.Arc) halo.setAlpha(this.pose >= C.perfectPose ? 0.8 : 0.13)
    this.status.setText(this.pose >= C.perfectPose ? 'CHIM TẠO DÁNG! CHỤP ĐI!' : 'Kéo khung · Chờ chim sáng vàng')
  }
  private shutter(): void {
    if (this.elapsed - this.shotAt < C.cooldownMs) return
    this.shotAt = this.elapsed; this.taken++
    const result = evaluatePhoto(Math.hypot(this.frame.x - this.subject.x, this.frame.y - this.subject.y), this.pose, this.elapsed - this.movedAt)
    if (result.grade === 'perfect') this.perfect++
    this.award(result.points, `+${result.points} ${{ perfect: 'ẢNH ĐẸP!', good: 'ẢNH TỐT!', acceptable: 'TẠM ỔN!', miss: 'LỆCH KHUNG!'}[result.grade]}`, result.points > 0)
    this.countText.setText(`✓ ${this.taken}`)
    this.preview.clear().fillStyle(result.points > 0 ? 0xbad1ad : 0xc6b9a9).fillRoundedRect(-45, -23, 90, 46, 5)
    this.preview.fillStyle(0xd6b575).fillEllipse(0, 3, 21, 26).fillStyle(0x7c9675).fillEllipse(27, 11, 27, 18)
    if (!reducedMotion()) getSceneFx(this).flash(true)
  }
  protected metadata() { return { photosTaken: this.taken, perfectPhotos: this.perfect } }
  protected cleanupInput(): void {
    this.pointerId = null
    this.input.off('pointerdown', this.beginAim, this); this.input.off('pointermove', this.aim, this)
    this.input.off('pointerup', this.interrupt, this); this.input.off('pointerupoutside', this.interrupt, this)
    this.input.off('nativepause', this.interrupt, this); this.input.off('gameout', this.interrupt, this)
  }
}

