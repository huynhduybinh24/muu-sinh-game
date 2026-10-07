import Phaser from 'phaser'
import { playAudioCue } from '../services/audioFeedback'
import { getSceneFx } from './visual/feedbackFx'
import { panel } from './visual/environment'
import { reducedMotion } from './visual/sceneTheme'

export function showFloatingFeedback(
  scene: Phaser.Scene,
  text: Phaser.GameObjects.Text,
  message: string,
  color: string,
): void {
  const storedY = text.getData('feedbackBaseY') as number | undefined
  const baseY = storedY ?? text.y
  if (storedY === undefined) text.setData('feedbackBaseY', baseY)

  const formattedMessage = message.replace(/^([+-]\d+)\s+/, '$1\n')
  scene.tweens.killTweensOf(text)
  text.setText(formattedMessage).setColor(color).setAlpha(1).setScale(1).setY(baseY)
    .setStroke('#fffaf0', 3).setShadow(0, 2, '#29334640', 2, false, true)
  const success = message.startsWith('+') || color === '#3b8d4d'
  const fx = getSceneFx(scene)
  if (message.startsWith('+') || message.startsWith('-')) {
    fx.burst(180, Math.min(418, baseY + 18), success ? 0xf5c765 : 0xe68a7b, success ? 'spark' : 'dust')
    fx.flash(success)
  }
  scene.tweens.add({
    targets: text,
    y: reducedMotion() ? baseY : baseY - 18,
    alpha: 0,
    duration: 760,
    ease: 'Cubic.easeOut',
    onComplete: () => text.setText('').setAlpha(1).setY(baseY),
  })
}

export function showTimeUpOverlay(scene: Phaser.Scene, onComplete: () => void): void {
  playAudioCue('gameEnd')
  const veil = scene.add.rectangle(180, 325, 360, 650, 0x26354c, 0.84).setDepth(100)
  panel(scene, 180, 322, 286, 152, 0xfff7e4, 101, 26)
  const title = scene.add
    .text(180, 325, 'HẾT GIỜ!', {
      color: '#9c6341',
      fontFamily: 'Arial, sans-serif',
      fontSize: '38px',
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setDepth(102)
  scene.add.text(180, 368, 'Một ca làm, thêm một câu chuyện.', {
    color: '#746967', fontFamily: 'Arial, sans-serif', fontSize: '13px',
  }).setOrigin(0.5).setDepth(102)
  if (!reducedMotion()) {
    title.setScale(0.9)
    scene.tweens.add({ targets: title, scale: 1, duration: 200, ease: 'Back.easeOut' })
    veil.setAlpha(0)
    scene.tweens.add({ targets: veil, alpha: 0.84, duration: 150 })
    scene.time.delayedCall(700, () => scene.cameras.main.fadeOut(200, 38, 53, 76))
  }
  scene.time.delayedCall(900, onComplete)
}
