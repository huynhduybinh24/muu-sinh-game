import Phaser from 'phaser'
import { playAudioCue } from '../services/audioFeedback'

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
  scene.tweens.add({
    targets: text,
    y: baseY - 18,
    alpha: 0,
    duration: 760,
    ease: 'Cubic.easeOut',
    onComplete: () => text.setText('').setAlpha(1).setY(baseY),
  })
}

export function showTimeUpOverlay(scene: Phaser.Scene, onComplete: () => void): void {
  playAudioCue('gameEnd')
  scene.add.rectangle(180, 325, 360, 650, 0x20211d, 0.78).setDepth(100)
  scene.add
    .text(180, 325, 'HẾT GIỜ!', {
      color: '#f6c945',
      fontFamily: 'Arial, sans-serif',
      fontSize: '38px',
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setDepth(101)
  scene.time.delayedCall(900, onComplete)
}
