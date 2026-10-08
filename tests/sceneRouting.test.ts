import { describe, expect, it, vi } from 'vitest'
import { jobs } from '../src/data/jobs'
import { defaultAppearance } from '../src/data/avatar'

const { SceneStub } = vi.hoisted(() => ({ SceneStub: class {
  constructor(...args: unknown[]) { this.args = args }
  args: unknown[]
} }))
vi.mock('phaser', () => ({ default: { AUTO: 0, Scale: { FIT: 1, CENTER_BOTH: 2 } } }))
vi.mock('../src/game/scenes/SugarcaneScene', () => ({ SugarcaneScene: class SugarcaneScene extends SceneStub {} }))
vi.mock('../src/game/scenes/ConstructionScene', () => ({ ConstructionScene: class ConstructionScene extends SceneStub {} }))
vi.mock('../src/game/scenes/ShipperScene', () => ({ ShipperScene: class ShipperScene extends SceneStub {} }))
vi.mock('../src/game/scenes/NoodleScene', () => ({ NoodleScene: class NoodleScene extends SceneStub {} }))
vi.mock('../src/game/scenes/BarberScene', () => ({ BarberScene: class BarberScene extends SceneStub {} }))
vi.mock('../src/game/scenes/CarwashScene', () => ({ CarwashScene: class CarwashScene extends SceneStub {} }))
vi.mock('../src/game/scenes/RubberScene', () => ({ RubberScene: class RubberScene extends SceneStub {} }))
vi.mock('../src/game/scenes/MechanicScene', () => ({ MechanicScene: class MechanicScene extends SceneStub {} }))
vi.mock('../src/game/scenes/CoffeeScene', () => ({ CoffeeScene: class CoffeeScene extends SceneStub {} }))
vi.mock('../src/game/scenes/FishingScene', () => ({ FishingScene: class FishingScene extends SceneStub {} }))
import { createGameConfig } from '../src/game/config/createGameConfig'

describe('React → Phaser scene routing', () => {
  it.each(jobs)('$id creates its own scene with the unchanged callback and fresh profile', (job) => {
    const callback = vi.fn()
    const profile = { playerName: 'Minh', createdAt: '2026-10-07', appearance: { ...defaultAppearance, shirtId: 'mint' as const } }
    const parent = {} as HTMLElement
    const config = createGameConfig(parent, job, callback, profile)
    const scenes = config.scene as unknown as InstanceType<typeof SceneStub>[]
    expect(scenes).toHaveLength(1)
    expect(scenes[0].constructor.name).toBe(job.sceneKey)
    expect(scenes[0].args[0]).toBe(job)
    expect(scenes[0].args[1]).toBe(callback)
    expect(scenes[0].args[2]).toMatchObject({ playerName: 'Minh', appearance: profile.appearance })
    expect(config.parent).toBe(parent)
  })
})
