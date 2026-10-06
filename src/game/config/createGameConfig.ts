import Phaser from 'phaser'
import { ConstructionScene } from '../scenes/ConstructionScene'
import { ShipperScene } from '../scenes/ShipperScene'
import { SugarcaneScene } from '../scenes/SugarcaneScene'
import type { GameResult } from '../../types/game'
import type { Job } from '../../types/job'

export function createGameConfig(
  parent: HTMLElement,
  job: Job,
  onComplete: (result: GameResult) => void,
): Phaser.Types.Core.GameConfig {
  const scene =
    job.id === 'sugarcane'
      ? new SugarcaneScene(job, onComplete)
      : job.id === 'construction'
        ? new ConstructionScene(job, onComplete)
        : new ShipperScene(job, onComplete)

  return {
    type: Phaser.AUTO,
    parent,
    width: 360,
    height: 650,
    backgroundColor:
      job.id === 'construction' ? '#dff3f3' : job.id === 'sugarcane' ? '#fff7df' : '#f3e7c9',
    scene: [scene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: true,
      pixelArt: false,
    },
  }
}
