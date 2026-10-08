import type Phaser from 'phaser'

/** Pause the engine, not individual job mechanics; clear interrupted native touch gestures. */
export function setGamePaused(game: Phaser.Game, paused: boolean): void {
  if (paused) {
    for (const scene of game.scene.getScenes(true)) {
      // A native interruption is not a scored pointer release or leaving the play area.
      scene.input.emit('nativepause')
      scene.input.resetPointers()
      scene.input.keyboard?.resetKeys()
    }
    game.pause()
    game.loop.sleep()
  } else {
    game.loop.wake() // Resets frame timing: background time is not charged to the job.
    game.resume()
  }
}
