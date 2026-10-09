import Phaser from 'phaser'
import { ItScene } from '../scenes/ItScene'
import { AccountantScene } from '../scenes/AccountantScene'
import { PoliceScene } from '../scenes/PoliceScene'
import { DoctorScene } from '../scenes/DoctorScene'
import { TeacherScene } from '../scenes/TeacherScene'
import { TaxiScene } from '../scenes/TaxiScene'
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
import { BanhmiScene } from '../scenes/BanhmiScene'
import { GasScene } from '../scenes/GasScene'
import { CargoScene } from '../scenes/CargoScene'
import { CleaningScene } from '../scenes/CleaningScene'
import { ElectricianScene } from '../scenes/ElectricianScene'
import { FloristScene } from '../scenes/FloristScene'
import { SecurityScene } from '../scenes/SecurityScene'
import { PhotographerScene } from '../scenes/PhotographerScene'
import { CashierScene } from '../scenes/CashierScene'
import { HarvestScene } from '../scenes/HarvestScene'
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
  const sceneTypes: Record<JobId, new (job: Job, complete: (result: GameResult) => void, avatar: ReturnType<typeof getPhaserAvatarData>) => Phaser.Scene> = {
    it: ItScene,
    accountant: AccountantScene,
    police: PoliceScene,
    doctor: DoctorScene,
    teacher: TeacherScene,
    taxi: TaxiScene,
    sugarcane: SugarcaneScene, construction: ConstructionScene, shipper: ShipperScene,
    noodle: NoodleScene, barber: BarberScene, carwash: CarwashScene,
    rubber: RubberScene, mechanic: MechanicScene, coffee: CoffeeScene, fishing: FishingScene,
    banhmi: BanhmiScene,
    gas: GasScene,
    cargo: CargoScene,
    cleaning: CleaningScene,
    electrician: ElectricianScene,
    florist: FloristScene,
    security: SecurityScene,
    photographer: PhotographerScene,
    cashier: CashierScene,
    harvest: HarvestScene,
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
