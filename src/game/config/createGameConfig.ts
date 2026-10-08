import Phaser from 'phaser'
import { ConstructionScene } from '../scenes/ConstructionScene'
import { ShipperScene } from '../scenes/ShipperScene'
import { SugarcaneScene } from '../scenes/SugarcaneScene'
import { NoodleScene } from '../scenes/NoodleScene'
import { BarberScene } from '../scenes/BarberScene'
import { CarwashScene } from '../scenes/CarwashScene'
import { RubberScene } from '../scenes/RubberScene'
import { MechanicScene } from '../scenes/MechanicScene'
import { CoffeeScene } from '../scenes/CoffeeScene'
import { FishingScene } from '../scenes/FishingScene'
import type { GameResult } from '../../types/game'
import type { Job, JobId } from '../../types/job'
import type { PlayerProfile } from '../../types/profile'
import { getPhaserAvatarData } from '../avatar/avatarData'

export function createGameConfig(
  parent: HTMLElement,
  job: Job,
  onComplete: (result: GameResult) => void,
  profile?: PlayerProfile,
): Phaser.Types.Core.GameConfig {
  const avatarData = getPhaserAvatarData(profile)
  const sceneTypes: Record<JobId, typeof SugarcaneScene | typeof ConstructionScene | typeof ShipperScene
    | typeof NoodleScene | typeof BarberScene | typeof CarwashScene | typeof RubberScene | typeof MechanicScene | typeof CoffeeScene | typeof FishingScene> = {
    sugarcane: SugarcaneScene, construction: ConstructionScene, shipper: ShipperScene,
    noodle: NoodleScene, barber: BarberScene, carwash: CarwashScene,
    rubber: RubberScene, mechanic: MechanicScene, coffee: CoffeeScene, fishing: FishingScene,
  }
  const scene = new sceneTypes[job.id](job, onComplete, avatarData)

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
