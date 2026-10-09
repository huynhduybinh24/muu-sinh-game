// Browser-only scene harness, served by Vite during QA; never imported by the app.
import Phaser from 'phaser'
import { jobsById } from '../src/data/jobs'
import { createGameConfig } from '../src/game/config/createGameConfig'
import { sugarcaneOrders, PRESS_DURATION_MS } from '../src/game/config/sugarcaneOrders'
import { noodleRecipes } from '../src/game/config/noodleConfig'
import { haircutPatterns } from '../src/game/config/barberConfig'
import type { GameResult } from '../src/types/game'
import type { JobId } from '../src/types/job'
import type { PlayerProfile } from '../src/types/profile'
import { defaultAppearance } from '../src/data/avatar'
import { useProgressStore } from '../src/store/progressStore'
import { getLevelThreshold } from '../src/services/level'
import { getSceneFx } from '../src/game/visual/feedbackFx'
import { mechanicProblems } from '../src/game/config/mechanicConfig'
import { coffeeRecipes } from '../src/game/config/coffeeConfig'
import { tappingGuide } from '../src/game/config/rubberConfig'
import { setGamePaused } from '../src/game/lifecycle'

let game: Phaser.Game | null = null
let scene: Phaser.Scene | null = null
let parent: HTMLDivElement | null = null
let reactions: string[] = []
let completed: GameResult | null = null
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

function descendants(objects: Phaser.GameObjects.GameObject[]): Phaser.GameObjects.GameObject[] {
  return objects.flatMap((object) => object instanceof Phaser.GameObjects.Container
    ? [object, ...descendants(object.list)] : [object])
}

function getAvatar(): Phaser.GameObjects.Container {
  const avatar = scene && descendants(scene.children.list).find((object) => object.name === 'player-avatar')
  if (!(avatar instanceof Phaser.GameObjects.Container)) throw new Error('Avatar missing')
  return avatar
}

export async function dispose(): Promise<void> {
  game?.destroy(true)
  for (let index = 0; index < 3; index++) await frame()
  if (parent?.querySelector('canvas')) throw new Error('Canvas was not destroyed')
  parent?.remove()
  game = null
  scene = null
  parent = null
}

export async function start(jobId: JobId, profile?: PlayerProfile): Promise<void> {
  if (game) await dispose()
  reactions = []
  completed = null
  parent = document.createElement('div')
  parent.id = 'avatar-scene-qa'
  Object.assign(parent.style, { position: 'fixed', top: '0', left: '0', width: '360px', height: '650px', zIndex: '999' })
  document.body.append(parent)
  const job = jobsById[jobId]
  game = new Phaser.Game({
    ...createGameConfig(parent, job, (result) => { completed = result }, profile),
    type: Phaser.CANVAS, audio: { noAudio: true },
  })
  for (let index = 0; index < 120; index++) {
    await frame()
    const active = game.scene.getScenes(true)[0]
    if (active) {
      scene = active
      const avatar = getAvatar()
      avatar.on('changedata-avatarState', (_object: unknown, value: unknown) => {
        if (typeof value === 'string') reactions.push(value)
      })
      return
    }
  }
  throw new Error(`Scene ${jobId} did not start`)
}

export function snapshot() {
  if (!scene) throw new Error('Scene not ready')
  const avatar = getAvatar()
  const anchor = avatar.parentContainer ?? avatar
  const text = scene.children.list.filter((object): object is Phaser.GameObjects.Text => object instanceof Phaser.GameObjects.Text)
  const bricks = scene.children.list.filter((object): object is Phaser.GameObjects.Rectangle => object instanceof Phaser.GameObjects.Rectangle && object.depth === 5)
  const movingBrick = bricks.find((brick) => Math.abs(brick.y - 148) < 1)
  const order = sugarcaneOrders.find((item) => text.some((object) => object.text === item.name))
  const motion = avatar.list.find((object) => object.name === 'avatar-motion')
  return {
    sceneKey: scene.sys.settings.key,
    avatarCount: descendants(scene.children.list).filter((object) => object.name === 'player-avatar').length,
    appearance: avatar.getData('appearance') as unknown,
    lifestyle: avatar.getData('lifestyle') as unknown,
    state: avatar.getData('avatarState') as unknown,
    reactions: [...reactions],
    anchor: { x: anchor.x, y: anchor.y, angle: anchor.angle, scaleX: anchor.scaleX, scaleY: anchor.scaleY },
    motionTweens: motion ? scene.tweens.getTweensOf(motion).length : 0,
    score: text.find((object) => object.text.startsWith('⭐'))?.text,
    deliveries: text.find((object) => object.text.startsWith('📦'))?.text,
    objective: text.find((object) => object.text === 'GIAO ĐẾN KHÁCH HÀNG')?.text,
    brickX: movingBrick?.x ?? null,
    order: order?.requiredDrink ?? null,
    pressDuration: PRESS_DURATION_MS,
    completed,
    noodleRecipe: noodleRecipes.find((recipe) => text.some((object) => object.text === recipe.name)) ?? null,
    barberTarget: haircutPatterns.find((pattern) => text.some((object) => object.text === `MẪU: ${pattern.name}`)) ?? null,
    mechanicProblem: mechanicProblems.find((problem) => text.some((object) => object.text === problem.name)) ?? null,
    coffeeRecipe: coffeeRecipes.find((recipe) => text.some((object) => object.text === recipe.name)) ?? null,
    rubberGuide: tappingGuide(),
    fishingStatus: text.find((object) => object.text.startsWith('CÁ CẮN') || object.text.startsWith('CANH NHỊP'))?.text ?? null,
    cleanliness: text.find((object) => object.text.startsWith('ĐỘ SẠCH:'))?.text,
    served: text.find((object) => object.text.startsWith('✓'))?.text,
    timer: text.find((object) => object.text.startsWith('⏱'))?.text,
    visualParticles: scene.children.list.filter((object) => object.name === 'visual-particle').length,
    activeParticles: scene.children.list.filter((object) => object.name === 'visual-particle' && object instanceof Phaser.GameObjects.Arc && object.visible).length,
  }
}

export function pressButton(label: string): void {
  if (!scene) throw new Error('Scene not ready')
  const labels = scene.children.list.filter((object): object is Phaser.GameObjects.Text =>
    object instanceof Phaser.GameObjects.Text && object.text.includes(label))
  const button = scene.children.list.find((object) => object instanceof Phaser.GameObjects.Rectangle
    && object.input && labels.some((text) => object.x === text.x && object.y === text.y))
  if (!button) throw new Error(`Interactive ${label} missing`)
  button.emit('pointerdown')
}

export function releaseControls(): void { scene?.input.emit('pointerup') }
export function dropBrick(): void { scene?.input.emit('pointerdown') }
export function getCompletion(): GameResult | null { return completed }
export function nativePause(paused: boolean): void {
  if (!game) throw new Error('Game not ready')
  setGamePaused(game, paused)
}
export function exerciseVisualFx(): void {
  if (!scene) throw new Error('Scene not ready')
  const fx = getSceneFx(scene)
  for (let i = 0; i < 30; i++) fx.burst(180, 300, 0xffeeaa)
  fx.shake()
}
export async function startEquipped(jobId: JobId): Promise<void> {
  useProgressStore.getState().resetProgress()
  useProgressStore.getState().createProfile('Thợ sành điệu', { ...defaultAppearance, gender: 'female', skinToneId: 'deep' })
  useProgressStore.setState({ money: 2_000_000, xp: getLevelThreshold(5) })
  for (const id of ['hair-long', 'shirt-rose', 'pants-plum']) {
    const outcome = useProgressStore.getState().purchaseItem(id)
    if (outcome.status !== 'purchased' || !useProgressStore.getState().equipItem(id)) throw new Error(`Could not equip ${id}`)
  }
  await start(jobId, useProgressStore.getState().profile)
}
export async function startLifestyle(jobId: JobId, variants: readonly string[] = []): Promise<PlayerProfile> {
  useProgressStore.getState().resetProgress()
  useProgressStore.getState().createProfile('Thợ phố nhỏ', { ...defaultAppearance, gender: 'female', skinToneId: 'deep' })
  useProgressStore.setState({ money: 100_000_000, xp: getLevelThreshold(5) })
  const vehicle = jobId === 'taxi' ? 'life-vehicle-compact' : 'life-vehicle-scooter'
  for (const id of ['hair-braid','shirt-hoodie','pants-shorts','life-shoes-sneakers','life-accessory-bucket','life-accessory-round','life-accessory-daypack','life-tools-thermos','life-electronics-laptop',vehicle,...variants]) {
    if (useProgressStore.getState().purchaseItem(id).status !== 'purchased' || !useProgressStore.getState().equipItem(id)) throw new Error(`Could not equip lifestyle ${id}`)
  }
  const profile = useProgressStore.getState().profile
  await start(jobId, profile)
  return profile
}
export function lifestyleVisualSnapshot() {
  if (!scene) throw new Error('Scene not ready')
  const avatar = getAvatar()
  const commands = descendants(avatar.list).filter((object): object is Phaser.GameObjects.Graphics => object instanceof Phaser.GameObjects.Graphics).flatMap(object => object.commandBuffer)
  const car = scene.children.list.find((object): object is Phaser.GameObjects.Graphics => object.name === 'taxi-car' && object instanceof Phaser.GameObjects.Graphics)
  const computer: unknown = Reflect.get(scene, 'computer')
  return { ...snapshot(), avatarCommands: commands, carCommands: car?.commandBuffer ?? [], computer }
}
export function cutHair(index: number): void {
  const section = scene?.children.list.find((object) => object.getData('hairSection') === index)
  if (!section) throw new Error('Hair section missing')
  section.emit('pointerdown')
}

export function checkShutdown(): void {
  if (!scene || !game) throw new Error('Scene not ready')
  const avatar = getAvatar()
  game.scene.stop(scene.sys.settings.key)
  if (avatar.scene || descendants(scene.children.list).some((object) => object.name === 'player-avatar')) {
    throw new Error('Avatar survived scene shutdown')
  }
  if (scene.children.list.some((object) => object.name === 'visual-particle')) throw new Error('Particles survived scene shutdown')
}

/** Read-only diagnostics in the QA module; never included in production builds. */
export function expansionSnapshot() {
  if (!scene) throw new Error('Scene not ready')
  const field = (name: string): unknown => Reflect.get(scene!, name)
  const point = (name: string) => {
    const object = field(name)
    return object instanceof Phaser.GameObjects.Container ? { x: object.x, y: object.y } : null
  }
  return {
    ...snapshot(), order: field('order'), requested: field('requested'), target: field('target'), amount: field('amount'),
    ticket: field('ticket'), invoice: field('invoice'), stage: field('stage'), step: field('step'), options: field('options'),
    request: field('request'), requests: field('requests'), chosen: field('chosen'), question: field('question'), student: field('student'),
    node: field('node'), pickup: field('pickup'), obstacle: field('obstacle'), moving: field('moving'), mood: field('mood'),
    green: typeof field('green') === 'function' ? (field('green') as () => boolean).call(scene) : field('green'),
    destination: field('destination'), box: point('box'), right: field('right'), flowers: field('flowers'),
    incident: field('incident'), remaining: field('remaining'), elapsed: field('elapsed'), phase: field('phase'), subject: point('subject'),
    products: field('products'), choices: field('choices'), total: field('total'), payment: field('payment'),
    fruitKinds: field('fruitKinds'), active: field('active'), pointerId: field('pointerId'), filling: field('filling'),
    metadata: Reflect.get(scene, 'metadata') instanceof Function ? Reflect.get(scene, 'metadata').call(scene) as unknown
      : Reflect.get(scene, 'resultMetadata').call(scene) as unknown,
    texts: scene.children.list.filter((object): object is Phaser.GameObjects.Text => object instanceof Phaser.GameObjects.Text)
      .map(({ text, x, y, visible }) => ({ text, x, y, visible })),
  }
}
