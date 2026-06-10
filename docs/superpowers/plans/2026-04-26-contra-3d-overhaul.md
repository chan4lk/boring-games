# Contra 3D Professional Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite Contra 3D from a single-file prototype into a professional side-scrolling 3D run-and-gun with 5-8 levels, full weapon arsenal, bosses, audio, cheat codes, and polished UI.

**Architecture:** Keep Three.js as the renderer, add Howler.js for audio. React becomes a thin mount/unmount shell with DOM-based UI overlays. The game runs in its own loop with modular systems (Input, Entity, Level, Combat, Audio, Particles) coordinated by a central Game class. Data flows up to React via frame callbacks, actions flow down via method calls.

**Tech Stack:** React 19, Three.js, Howler.js, TypeScript, Vite

**Spec:** `docs/superpowers/specs/2026-04-26-contra-3d-professional-overhaul-design.md`

---

### Task 1: Scaffold — folder structure, dependencies, types, constants

**Files:**
- Modify: `package.json` (add howler dep)
- Create: `src/contra-3d/types.ts`
- Create: `src/contra-3d/constants.ts`

- [ ] **Step 1: Install Howler.js**

Run:
```bash
npm install howler
npm install -D @types/howler
```
Expected: howler added to package.json deps, @types/howler to devDeps.

- [ ] **Step 2: Create folder structure**

Create these directories (all under `src/contra-3d/`):
```
entities/ weapons/ levels/ systems/ rendering/ audio/ ui/
```

Run:
```bash
mkdir -p src/contra-3d/{entities,weapons,levels,systems,rendering,audio,ui}
```

- [ ] **Step 3: Write `types.ts`**

```typescript
import type * as THREE from 'three'

export type GameScreen = 'menu' | 'playing' | 'paused' | 'gameover' | 'levelComplete'

export type UIState = {
  screen: GameScreen
  score: number
  lives: number
  health: number
  maxHealth: number
  weapon: WeaponType
  spreadLevel: number
  fireRateLevel: number
  currentLevel: number
  totalLevels: number
  bossHealth: number
  bossMaxHealth: number
  cheatActive: string | null
}

export type WeaponType = 'machinegun' | 'spread' | 'laser' | 'fire' | 'rapid'

export type EnemyType = 'soldier' | 'runner' | 'turret' | 'flying'

export type PowerUpKind = 'spread' | 'rate' | 'weapon'

export type Direction = { x: number; y: number }

export type Entity = {
  id: number
  mesh: THREE.Object3D
  position: { x: number; y: number }
  velocity: { x: number; y: number }
  alive: boolean
  health: number
  maxHealth: number
  type: string
}

export type BulletEntity = Entity & {
  damage: number
  fromPlayer: boolean
}

export type EnemyEntity = Entity & {
  enemyType: EnemyType
  fireTimer: number
  fireInterval: number
  scoreValue: number
}

export type PowerUpEntity = Entity & {
  kind: PowerUpKind
  weaponType?: WeaponType
}

export type PlayerEntity = Entity & {
  weapon: WeaponType
  spreadLevel: number
  fireRateLevel: number
  fireCooldown: number
  lastFireTime: number
  invincibleUntil: number
}

export type TerrainSegment = {
  x: number
  width: number
  height: number
  y: number
}

export type WaveConfig = {
  atDistance: number
  enemies: { type: EnemyType; count: number; interval: number }[]
}

export type BossPhase = {
  healthThreshold: number
  attackPattern: string
  speed: number
}

export type BossConfig = {
  type: string
  health: number
  phases: BossPhase[]
  scoreValue: number
}

export type WeaponDef = {
  name: string
  damage: number
  fireRate: number
  bulletCount: number
  spreadAngle: number
  bulletSpeed: number
  color: number
}

export type LevelConfig = {
  id: string
  name: string
  totalDistance: number
  scrollSpeed: number
  background: {
    fogColor: string
    fogNear: number
    fogFar: number
    skyColor: string
    groundColor: string
    parallaxLayers: { color: string; depth: number; scrollFactor: number }[]
  }
  terrain: TerrainSegment[]
  waves: WaveConfig[]
  powerUpDrops: { atDistance: number; weapon: WeaponType; position: [number, number] }[]
  boss: BossConfig | null
  music: string
}

export type GameCallbacks = {
  onStateChange: (state: UIState) => void
}
```

- [ ] **Step 4: Write `constants.ts`**

```typescript
import type { WeaponDef, WeaponType } from './types'

export const WORLD_WIDTH = 24
export const WORLD_HEIGHT = 12
export const PLAYER_SPEED = 10
export const ENEMY_BASE_SPEED = 4
export const BULLET_SPEED = 22
export const BASE_FIRE_COOLDOWN = 0.12
export const PLAYER_MAX_HEALTH = 5
export const PLAYER_START_LIVES = 3
export const INVINCIBILITY_DURATION = 2.0
export const EXTRA_LIFE_SCORE = 50000
export const SCROLL_OFFSCREEN_MARGIN = 5

export const WEAPONS: Record<WeaponType, WeaponDef> = {
  machinegun: { name: 'Machine Gun', damage: 1, fireRate: 0.1, bulletCount: 1, spreadAngle: 0, bulletSpeed: 22, color: 0xfbbf24 },
  spread:     { name: 'Spread',     damage: 1, fireRate: 0.2, bulletCount: 5, spreadAngle: 30, bulletSpeed: 20, color: 0x818cf8 },
  laser:      { name: 'Laser',      damage: 3, fireRate: 0.3, bulletCount: 1, spreadAngle: 0, bulletSpeed: 30, color: 0xf472b6 },
  fire:       { name: 'Fire',       damage: 2, fireRate: 0.22, bulletCount: 1, spreadAngle: 8, bulletSpeed: 18, color: 0xfb923c },
  rapid:      { name: 'Rapid',      damage: 1, fireRate: 0.06, bulletCount: 1, spreadAngle: 0, bulletSpeed: 24, color: 0x34d399 },
}
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/contra-3d/ docs/superpowers/plans/
git commit -m "scaffold: add contra-3d folder structure, types, constants, howler dep"
```

---

### Task 2: Game engine — Game class, Engine (game loop), game state machine

**Files:**
- Create: `src/contra-3d/Engine.ts`
- Create: `src/contra-3d/Game.ts`

- [ ] **Step 1: Write `Engine.ts`**

```typescript
export class Engine {
  private animFrameId: number | null = null
  private lastTime = 0
  private running = false
  private updateFn: (delta: number, time: number) => void

  constructor(updateFn: (delta: number, time: number) => void) {
    this.updateFn = updateFn
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.tick(this.lastTime)
  }

  stop(): void {
    this.running = false
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }
  }

  private tick = (now: number): void => {
    if (!this.running) return
    const delta = Math.min(0.033, (now - this.lastTime) / 1000)
    this.lastTime = now
    this.updateFn(delta, now / 1000)
    this.animFrameId = requestAnimationFrame(this.tick)
  }

  isRunning(): boolean {
    return this.running
  }
}
```

- [ ] **Step 2: Write `Game.ts`**

```typescript
import { Engine } from './Engine'
import { SceneManager } from './SceneManager'
import { InputManager } from './InputManager'
import { AudioManager } from './AudioManager'
import { LevelManager } from './LevelManager'
import { EntityManager } from './EntityManager'
import { Physics } from './Physics'
import { PlayerSystem } from './systems/PlayerSystem'
import { EnemySystem } from './systems/EnemySystem'
import { CombatSystem } from './systems/CombatSystem'
import { PowerUpSystem } from './systems/PowerUpSystem'
import { ParticleSystem } from './systems/ParticleSystem'
import { CheatSystem } from './CheatSystem'
import type { GameCallbacks, GameScreen, UIState, PlayerEntity } from './types'
import { PLAYER_START_LIVES, PLAYER_MAX_HEALTH, EXTRA_LIFE_SCORE, SCROLL_OFFSCREEN_MARGIN } from './constants'

export class Game {
  readonly engine: Engine
  readonly scene: SceneManager
  readonly input: InputManager
  readonly audio: AudioManager
  readonly levels: LevelManager
  readonly entities: EntityManager
  readonly physics: Physics
  readonly playerSystem: PlayerSystem
  readonly enemySystem: EnemySystem
  readonly combatSystem: CombatSystem
  readonly powerUpSystem: PowerUpSystem
  readonly particles: ParticleSystem
  readonly cheats: CheatSystem
  private callbacks: GameCallbacks
  private player: PlayerEntity | null = null

  screen: GameScreen = 'menu'
  score = 0
  lives = PLAYER_START_LIVES
  currentLevel = 0

  constructor(container: HTMLDivElement, callbacks: GameCallbacks) {
    this.callbacks = callbacks
    this.scene = new SceneManager(container)
    this.input = new InputManager(this.scene.renderer.domElement)
    this.audio = new AudioManager()
    this.entities = new EntityManager(this.scene.scene)
    this.physics = new Physics()
    this.levels = new LevelManager(this)
    this.playerSystem = new PlayerSystem(this)
    this.enemySystem = new EnemySystem(this)
    this.combatSystem = new CombatSystem(this)
    this.powerUpSystem = new PowerUpSystem(this)
    this.particles = new ParticleSystem(this.scene.scene)
    this.cheats = new CheatSystem(this)

    this.engine = new Engine((delta, time) => this.update(delta, time))
  }

  start(): void {
    this.engine.start()
    this.emitState()
  }

  destroy(): void {
    this.engine.stop()
    this.input.destroy()
    this.scene.destroy()
    this.audio.destroy()
  }

  startLevel(levelIndex: number): void {
    this.currentLevel = levelIndex
    this.player = this.playerSystem.createPlayer()
    this.levels.load(levelIndex)
    this.screen = 'playing'
    this.emitState()
  }

  pause(): void {
    if (this.screen === 'playing') {
      this.screen = 'paused'
      this.emitState()
    }
  }

  resume(): void {
    if (this.screen === 'paused') {
      this.screen = 'playing'
      this.emitState()
    }
  }

  restart(): void {
    this.score = 0
    this.lives = PLAYER_START_LIVES
    this.entities.clear()
    this.particles.clear()
    this.scene.reset()
    this.startLevel(this.currentLevel)
  }

  quitToMenu(): void {
    this.screen = 'menu'
    this.entities.clear()
    this.particles.clear()
    this.scene.reset()
    this.emitState()
  }

  private update(delta: number, time: number): void {
    if (this.screen !== 'playing') return

    this.cheats.update(time)
    this.playerSystem.update(delta, time, this.player!)
    this.enemySystem.update(delta, time)
    this.combatSystem.update(delta, time)
    this.powerUpSystem.update(delta, time)
    this.particles.update(delta)
    this.levels.update(delta, time)
    this.scene.updateParallax(this.levels.scrollOffset)

    if (this.player && !this.player.alive) {
      this.lives -= 1
      if (this.lives <= 0) {
        this.screen = 'gameover'
      } else {
        this.player = this.playerSystem.respawnPlayer()
        this.levels.resetToCheckpoint()
      }
      this.emitState()
    }
  }

  getPlayer(): PlayerEntity | null {
    return this.player
  }

  addScore(points: number): void {
    const before = this.score
    this.score += points
    if (Math.floor(before / EXTRA_LIFE_SCORE) < Math.floor(this.score / EXTRA_LIFE_SCORE)) {
      this.lives += 1
    }
    this.emitState()
  }

  emitState(): void {
    this.callbacks.onStateChange(this.buildUIState())
  }

  private buildUIState(): UIState {
    return {
      screen: this.screen,
      score: this.score,
      lives: this.lives,
      health: this.player?.health ?? PLAYER_MAX_HEALTH,
      maxHealth: this.player?.maxHealth ?? PLAYER_MAX_HEALTH,
      weapon: this.player?.weapon ?? 'machinegun',
      spreadLevel: this.player?.spreadLevel ?? 1,
      fireRateLevel: this.player?.fireRateLevel ?? 1,
      currentLevel: this.currentLevel,
      totalLevels: this.levels.totalLevels(),
      bossHealth: 0,
      bossMaxHealth: 0,
      cheatActive: this.cheats.lastActivated,
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/contra-3d/Engine.ts src/contra-3d/Game.ts
git commit -m "feat: add Game engine with loop, state machine, system wiring"
```

---

### Task 3: Scene manager — Three.js scene, camera, lighting, cleanup

**Files:**
- Create: `src/contra-3d/SceneManager.ts`

- [ ] **Step 1: Write `SceneManager.ts`**

```typescript
import * as THREE from 'three'

export class SceneManager {
  readonly scene: THREE.Scene
  readonly camera: THREE.PerspectiveCamera
  readonly renderer: THREE.WebGLRenderer
  readonly container: HTMLDivElement
  private backgroundLayers: THREE.Mesh[] = []

  constructor(container: HTMLDivElement) {
    this.container = container
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.Fog(0x0e1c1a, 6, 28)

    this.camera = new THREE.PerspectiveCamera(
      50, container.clientWidth / container.clientHeight, 0.1, 100
    )
    this.camera.position.set(-6, 6, 12)
    this.camera.lookAt(6, 4, 0)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setClearColor(0x0a0f0f)
    container.appendChild(this.renderer.domElement)

    this.setupLights()

    const handleResize = () => {
      this.camera.aspect = container.clientWidth / container.clientHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', handleResize)
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0x88a399, 0.6)
    this.scene.add(ambient)

    const dirLight = new THREE.DirectionalLight(0xfff1d6, 0.9)
    dirLight.position.set(6, 10, 8)
    this.scene.add(dirLight)

    const fillLight = new THREE.DirectionalLight(0x4466aa, 0.3)
    fillLight.position.set(-4, 2, -6)
    this.scene.add(fillLight)
  }

  createBackgroundLayers(config: { color: number; depth: number; scrollFactor: number }[]): void {
    this.backgroundLayers.forEach(l => this.scene.remove(l))
    this.backgroundLayers = []

    for (const layer of config) {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(90, 26),
        new THREE.MeshStandardMaterial({
          color: layer.color,
          emissive: 0x0f1a16,
          emissiveIntensity: 0.4,
          side: THREE.DoubleSide,
        })
      )
      mesh.position.set(18, 8, -6 - layer.depth * 4)
      mesh.rotation.y = Math.PI
      this.scene.add(mesh)
      this.backgroundLayers.push(mesh)
    }
  }

  updateParallax(scrollOffset: number, factors: number[] = [0.1, 0.15, 0.2]): void {
    this.backgroundLayers.forEach((layer, i) => {
      const factor = factors[i] ?? 0.1
      layer.position.x = 18 - scrollOffset * factor
    })
  }

  reset(): void {
    while (this.scene.children.length > 0) {
      const child = this.scene.children[0]
      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose()
      }
      this.scene.remove(child)
    }
    this.setupLights()
  }

  render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  destroy(): void {
    this.renderer.dispose()
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/contra-3d/SceneManager.ts
git commit -m "feat: add SceneManager for Three.js scene, camera, lighting, parallax"
```

---

### Task 4: Input manager — keyboard + mouse, co-op abstraction

**Files:**
- Create: `src/contra-3d/InputManager.ts`
- Modify: `Game.ts` (import InputManager — already done in Task 2)

- [ ] **Step 1: Write `InputManager.ts`**

```typescript
import * as THREE from 'three'

export class InputManager {
  readonly keys = new Set<string>()
  readonly mouseDown = false
  aimTarget = new THREE.Vector3(10, 4, 0)
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
  private domElement: HTMLElement
  private handlers: (() => void)[] = []

  constructor(domElement: HTMLElement) {
    this.domElement = domElement
    this.registerHandlers()
  }

  private registerHandlers(): void {
    const onKeyDown = (e: KeyboardEvent) => {
      this.keys.add(e.key.toLowerCase())
      if (e.key === 'p' || e.key === 'r') return // handled by game
    }
    const onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase())
    const onMouseMove = (e: MouseEvent) => {
      const rect = this.domElement.getBoundingClientRect()
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      this.raycaster.setFromCamera(this.pointer, this.getCamera())
      const intersect = new THREE.Vector3()
      this.raycaster.ray.intersectPlane(this.groundPlane, intersect)
      if (Number.isFinite(intersect.x)) {
        this.aimTarget = intersect
      }
    }
    const onPointerDown = () => this.keys.add('shoot')
    const onPointerUp = () => this.keys.delete('shoot')

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    this.domElement.addEventListener('mousemove', onMouseMove)
    this.domElement.addEventListener('pointerdown', onPointerDown)
    this.domElement.addEventListener('pointerup', onPointerUp)
    this.domElement.addEventListener('pointerleave', onPointerUp)

    this.handlers = [
      () => { window.removeEventListener('keydown', onKeyDown) },
      () => { window.removeEventListener('keyup', onKeyUp) },
      () => { this.domElement.removeEventListener('mousemove', onMouseMove) },
      () => { this.domElement.removeEventListener('pointerdown', onPointerDown) },
      () => { this.domElement.removeEventListener('pointerup', onPointerUp) },
      () => { this.domElement.removeEventListener('pointerleave', onPointerUp) },
    ]
  }

  private getCamera(): THREE.Camera {
    return (this.domElement as any).__camera || new THREE.PerspectiveCamera()
  }

  /** Set by SceneManager so the raycaster works */
  setCamera(camera: THREE.Camera): void {
    ;(this.domElement as any).__camera = camera
  }

  isDown(key: string): boolean {
    return this.keys.has(key)
  }

  isShooting(): boolean {
    return this.keys.has('shoot')
  }

  getMovement(): { x: number; y: number } {
    const move = { x: 0, y: 0 }
    if (this.keys.has('w') || this.keys.has('arrowup')) move.y += 1
    if (this.keys.has('s') || this.keys.has('arrowdown')) move.y -= 1
    if (this.keys.has('a') || this.keys.has('arrowleft')) move.x -= 1
    if (this.keys.has('d') || this.keys.has('arrowright')) move.x += 1
    return move
  }

  destroy(): void {
    this.handlers.forEach(fn => fn())
  }
}
```

- [ ] **Step 2: Wire camera reference in SceneManager**

Add to the bottom of the `SceneManager` constructor:
```typescript
;(this.renderer.domElement as any).__camera = this.camera
```

- [ ] **Step 3: Commit**

```bash
git add src/contra-3d/InputManager.ts
git commit -m "feat: add InputManager with keyboard, mouse aiming, co-op ready abstraction"
```

---

### Task 5: Entity manager — create, update, destroy entities, object pooling

**Files:**
- Create: `src/contra-3d/EntityManager.ts`

- [ ] **Step 1: Write `EntityManager.ts`**

```typescript
import * as THREE from 'three'
import type { Entity, BulletEntity, EnemyEntity, PowerUpEntity, PlayerEntity } from './types'

export class EntityManager {
  private scene: THREE.Scene
  private nextId = 1
  readonly all: Entity[] = []
  readonly bullets: BulletEntity[] = []
  readonly enemies: EnemyEntity[] = []
  readonly powerUps: PowerUpEntity[] = []

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  add(entity: Entity): void {
    this.scene.add(entity.mesh)
    this.all.push(entity)
    if ((entity as BulletEntity).damage !== undefined) {
      this.bullets.push(entity as BulletEntity)
    } else if ((entity as EnemyEntity).enemyType !== undefined) {
      this.enemies.push(entity as EnemyEntity)
    } else if ((entity as PowerUpEntity).kind !== undefined) {
      this.powerUps.push(entity as PowerUpEntity)
    }
  }

  remove(entity: Entity): void {
    entity.alive = false
    this.scene.remove(entity.mesh)
  }

  clear(): void {
    for (const e of this.all) {
      this.scene.remove(e.mesh)
    }
    this.all.length = 0
    this.bullets.length = 0
    this.enemies.length = 0
    this.powerUps.length = 0
  }

  nextId(): number {
    return this.nextId++
  }

  updatePositions(delta: number): void {
    for (const e of this.all) {
      if (!e.alive) continue
      e.position.x += e.velocity.x * delta
      e.position.y += e.velocity.y * delta
      e.mesh.position.set(e.position.x, e.position.y + 0.6, 0)
    }
  }

  removeOffscreen(margin: number, scrollOffset: number): void {
    const left = scrollOffset - margin
    const right = scrollOffset + 40 + margin
    for (let i = this.all.length - 1; i >= 0; i--) {
      const e = this.all[i]
      if (e.alive && (e.position.x < left || e.position.x > right)) {
        this.remove(e)
      }
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/contra-3d/EntityManager.ts
git commit -m "feat: add EntityManager with typed collections and offscreen cleanup"
```

---

### Task 6: Physics — AABB collision detection

**Files:**
- Create: `src/contra-3d/Physics.ts`

- [ ] **Step 1: Write `Physics.ts`**

```typescript
import * as THREE from 'three'

export type AABB = {
  minX: number
  maxX: number
  minY: number
  maxY: number
  minZ: number
  maxZ: number
}

export class Physics {
  /** Get world-space bounding box for a mesh at its current position */
  getAABB(mesh: THREE.Object3D): AABB {
    const box = new THREE.Box3().setFromObject(mesh)
    return {
      minX: box.min.x, maxX: box.max.x,
      minY: box.min.y, maxY: box.max.y,
      minZ: box.min.z, maxZ: box.max.z,
    }
  }

  /** Check if two AABBs overlap */
  aabbOverlap(a: AABB, b: AABB): boolean {
    return (
      a.minX <= b.maxX && a.maxX >= b.minX &&
      a.minY <= b.maxY && a.maxY >= b.minY &&
      a.minZ <= b.maxZ && a.maxZ >= b.minZ
    )
  }

  /** Quick sphere-based distance check (faster than AABB for scattered objects) */
  distanceCheck(a: THREE.Object3D, b: THREE.Object3D, threshold: number): boolean {
    return a.position.distanceTo(b.position) < threshold
  }

  /** Point-in-AABB */
  pointInAABB(px: number, py: number, aabb: AABB): boolean {
    return (
      px >= aabb.minX && px <= aabb.maxX &&
      py >= aabb.minY && py <= aabb.maxY
    )
  }

  /** Clamp position to world bounds */
  clampToWorld(pos: { x: number; y: number }, worldWidth: number, worldHeight: number): void {
    pos.x = Math.max(0, Math.min(pos.x, worldWidth - 2))
    pos.y = Math.max(0, Math.min(pos.y, worldHeight - 1.5))
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/contra-3d/Physics.ts
git commit -m "feat: add Physics with AABB collision and distance checks"
```

---

### Task 7: Player system — create player, movement, aiming, respawn

**Files:**
- Create: `src/contra-3d/entities/Player.ts`
- Create: `src/contra-3d/systems/PlayerSystem.ts`

- [ ] **Step 1: Write `entities/Player.ts`**

```typescript
import * as THREE from 'three'
import type { PlayerEntity } from '../types'
import { PLAYER_MAX_HEALTH, INVINCIBILITY_DURATION } from '../constants'

const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2dd4bf })
const armorMat = new THREE.MeshStandardMaterial({ color: 0x0f766e })
const gunMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
const visorMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x1e90ff, emissiveIntensity: 0.4 })

export function createPlayerMesh(): THREE.Group {
  const group = new THREE.Group()

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, 0.45), bodyMat)
  torso.position.set(0, 0.9, 0)
  group.add(torso)

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.5), armorMat)
  chest.position.set(0, 1.0, 0)
  group.add(chest)

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), bodyMat)
  head.position.set(0, 1.55, 0)
  group.add(head)

  const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.25, 0.55), armorMat)
  helmet.position.set(0, 1.7, 0)
  group.add(helmet)

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.05), visorMat)
  visor.position.set(0.2, 1.55, 0.25)
  group.add(visor)

  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.6, 0.25), armorMat)
  backpack.position.set(-0.3, 0.95, -0.28)
  group.add(backpack)

  const armGeo = new THREE.BoxGeometry(0.2, 0.55, 0.2)
  const legGeo = new THREE.BoxGeometry(0.25, 0.6, 0.25)
  ;[0.4, 0.4].forEach((x, i) => {
    const arm = new THREE.Mesh(armGeo, bodyMat)
    arm.position.set(x, i === 0 ? 1.0 : 0.75, 0)
    group.add(arm)
  })
  ;[-0.18, 0.18].forEach((x) => {
    const leg = new THREE.Mesh(legGeo, bodyMat)
    leg.position.set(x, 0.2, 0)
    group.add(leg)
  })

  const gun = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.2), gunMat)
  gun.position.set(1.0, 1.05, 0.1)
  group.add(gun)

  return group
}

export function createPlayerEntity(id: number, x: number, y: number): PlayerEntity {
  const mesh = createPlayerMesh()
  mesh.position.set(x, y + 0.6, 0)
  return {
    id,
    mesh,
    position: { x, y },
    velocity: { x: 0, y: 0 },
    alive: true,
    health: PLAYER_MAX_HEALTH,
    maxHealth: PLAYER_MAX_HEALTH,
    type: 'player',
    weapon: 'machinegun',
    spreadLevel: 1,
    fireRateLevel: 1,
    fireCooldown: 0,
    lastFireTime: 0,
    invincibleUntil: 0,
  }
}
```

- [ ] **Step 2: Write `systems/PlayerSystem.ts`**

```typescript
import * as THREE from 'three'
import type { Game } from '../Game'
import type { PlayerEntity } from '../types'
import { PLAYER_SPEED, WORLD_WIDTH, WORLD_HEIGHT, BASE_FIRE_COOLDOWN, BULLET_SPEED } from '../constants'
import { createPlayerEntity } from '../entities/Player'

const bulletGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 12)
const bulletMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 0.9 })

export class PlayerSystem {
  constructor(private game: Game) {}

  createPlayer(): PlayerEntity {
    const player = createPlayerEntity(this.game.entities.nextId(), 2, 3)
    this.game.entities.add(player)
    return player
  }

  respawnPlayer(): PlayerEntity {
    const player = createPlayerEntity(this.game.entities.nextId(), 2, 3)
    player.invincibleUntil = performance.now() / 1000 + 2
    this.game.entities.add(player)
    return player
  }

  update(delta: number, time: number, player: PlayerEntity): void {
    if (!player.alive) return

    const input = this.game.input
    const move = input.getMovement()
    if (move.x !== 0 || move.y !== 0) {
      const len = Math.sqrt(move.x * move.x + move.y * move.y)
      move.x /= len
      move.y /= len
      player.position.x += move.x * PLAYER_SPEED * delta
      player.position.y += move.y * PLAYER_SPEED * delta
    }

    player.position.x = Math.max(0, Math.min(player.position.x, WORLD_WIDTH - 2))
    player.position.y = Math.max(0, Math.min(player.position.y, WORLD_HEIGHT - 1.5))
    player.mesh.position.set(player.position.x, player.position.y + 0.6, 0)

    const aimDir = new THREE.Vector3()
      .subVectors(input.aimTarget, player.mesh.position)
      .setZ(0).normalize()
    player.mesh.lookAt(player.mesh.position.clone().add(aimDir))

    if (input.isShooting()) {
      this.shoot(time, player)
    }
  }

  private shoot(time: number, player: PlayerEntity): void {
    const cooldown = BASE_FIRE_COOLDOWN / player.fireRateLevel
    if (time - player.lastFireTime < cooldown) return
    player.lastFireTime = time

    const spread = player.spreadLevel
    const offsets = spread === 1 ? [0] : spread === 2 ? [-0.3, 0, 0.3] : [-0.6, -0.3, 0, 0.3, 0.6]
    const baseDir = new THREE.Vector3()
      .subVectors(this.game.input.aimTarget, player.mesh.position)
      .setZ(0).normalize()

    for (const off of offsets) {
      const mesh = new THREE.Mesh(bulletGeo, bulletMat)
      mesh.rotation.z = Math.PI / 2
      mesh.position.copy(player.mesh.position).add(new THREE.Vector3(1.4, off, 0.1))
      this.game.scene.scene.add(mesh)

      const vel = baseDir.clone().multiplyScalar(BULLET_SPEED)
      const bullet: BulletEntity = {
        id: this.game.entities.nextId(),
        mesh,
        position: { x: mesh.position.x, y: mesh.position.y },
        velocity: { x: vel.x, y: vel.y },
        alive: true,
        health: 1, maxHealth: 1,
        type: 'bullet',
        damage: 1,
        fromPlayer: true,
      }
      this.game.entities.add(bullet)
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/contra-3d/entities/Player.ts src/contra-3d/systems/PlayerSystem.ts
git commit -m "feat: add player entity, mesh, movement, and shooting system"
```

---

### Task 8: Environment — ground, floor, parallax backgrounds

**Files:**
- Create: `src/contra-3d/rendering/Environment.ts`
- Modify: `src/contra-3d/SceneManager.ts` (add ground creation)

- [ ] **Step 1: Write `rendering/Environment.ts`**

```typescript
import * as THREE from 'three'
import { SceneManager } from '../SceneManager'

export class Environment {
  private scene: THREE.Scene
  private floor: THREE.Mesh
  private terrainMeshes: THREE.Mesh[] = []

  constructor(sceneManager: SceneManager) {
    this.scene = sceneManager.scene
    this.floor = this.createFloor()
  }

  private createFloor(): THREE.Mesh {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 20),
      new THREE.MeshStandardMaterial({ color: 0x1e2f27 })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.set(10, 0, 0)
    this.scene.add(floor)
    return floor
  }

  setFloorColor(color: number): void {
    (this.floor.material as THREE.MeshStandardMaterial).color.setHex(color)
  }

  clearTerrain(): void {
    for (const m of this.terrainMeshes) {
      this.scene.remove(m)
      m.geometry.dispose()
    }
    this.terrainMeshes = []
  }

  /** Create background parallax layers using SceneManager */
  setupBackground(colors: { color: string; depth: number; scrollFactor: number }[]): void {
    // Background layers are handled by SceneManager.createBackgroundLayers
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/contra-3d/rendering/Environment.ts
git commit -m "feat: add Environment with floor and terrain management"
```

---

### Task 9: Weapon registry & bullet patterns

**Files:**
- Create: `src/contra-3d/weapons/WeaponRegistry.ts`
- Create: `src/contra-3d/weapons/BulletPatterns.ts`

- [ ] **Step 1: Write `WeaponRegistry.ts`**

```typescript
import type { WeaponDef, WeaponType } from '../types'
import { WEAPONS } from '../constants'

export class WeaponRegistry {
  private weapons: Map<WeaponType, WeaponDef> = new Map()

  constructor() {
    for (const [key, def] of Object.entries(WEAPONS)) {
      this.weapons.set(key as WeaponType, def)
    }
  }

  get(type: WeaponType): WeaponDef {
    return this.weapons.get(type)!
  }

  getAll(): [WeaponType, WeaponDef][] {
    return Array.from(this.weapons.entries())
  }

  /** Get weapon color as hex number for pickup glow */
  getColor(type: WeaponType): number {
    return this.weapons.get(type)!.color
  }
}
```

- [ ] **Step 2: Write `BulletPatterns.ts`**

```typescript
import * as THREE from 'three'
import type { WeaponType, BulletEntity } from '../types'
import { WEAPONS, BULLET_SPEED } from '../constants'
import { EntityManager } from '../EntityManager'

const bulletGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 12)

export class BulletPatterns {
  constructor(private entities: EntityManager) {}

  spawnBullets(
    weapon: WeaponType,
    origin: THREE.Vector3,
    aimDir: THREE.Vector3,
    fromPlayer: boolean,
    spreadLevel: number
  ): void {
    const def = WEAPONS[weapon]
    const color = def.color
    const mat = new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 0.7,
    })

    const count = weapon === 'spread' ? (spreadLevel === 1 ? 3 : spreadLevel === 2 ? 4 : 5) : def.bulletCount
    const angleStep = def.spreadAngle * (Math.PI / 180) / Math.max(1, count - 1)
    const startAngle = -def.spreadAngle * (Math.PI / 180) / 2

    const baseAngle = Math.atan2(aimDir.y, aimDir.x)

    for (let i = 0; i < count; i++) {
      const angle = baseAngle + startAngle + angleStep * i
      const dir = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0)
      const speed = def.bulletSpeed * BULLET_SPEED / 22

      const mesh = new THREE.Mesh(bulletGeo, mat)
      mesh.rotation.z = Math.PI / 2
      mesh.position.copy(origin)

      const bullet: BulletEntity = {
        id: this.entities.nextId(),
        mesh,
        position: { x: mesh.position.x, y: mesh.position.y },
        velocity: { x: dir.x * speed, y: dir.y * speed },
        alive: true,
        health: weapon === 'laser' ? 3 : 1,
        maxHealth: weapon === 'laser' ? 3 : 1,
        type: 'bullet',
        damage: def.damage,
        fromPlayer,
      }
      this.entities.add(bullet)
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/contra-3d/weapons/WeaponRegistry.ts src/contra-3d/weapons/BulletPatterns.ts
git commit -m "feat: add weapon registry and bullet pattern system"
```

---

### Task 10: Enemy system — enemy types, AI, spawning

**Files:**
- Create: `src/contra-3d/entities/Enemy.ts`
- Create: `src/contra-3d/systems/EnemySystem.ts`

- [ ] **Step 1: Write `entities/Enemy.ts`**

```typescript
import * as THREE from 'three'
import type { EnemyEntity, EnemyType } from '../types'

const primaryColors: Record<EnemyType, number> = {
  soldier: 0xf97316, runner: 0xef4444, turret: 0x78716c, flying: 0xa21caf,
}
const armorColors: Record<EnemyType, number> = {
  soldier: 0x7c2d12, runner: 0x7f1d1d, turret: 0x44403c, flying: 0x701a75,
}

export function createEnemyMesh(type: EnemyType): THREE.Group {
  const group = new THREE.Group()
  const primary = new THREE.MeshStandardMaterial({ color: primaryColors[type] })
  const armor = new THREE.MeshStandardMaterial({ color: armorColors[type] })

  if (type === 'turret') {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 0.4, 8), armor)
    base.position.set(0, 0.2, 0)
    group.add(base)
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.15), primary)
    gun.position.set(0.5, 0.5, 0)
    group.add(gun)
  } else if (type === 'flying') {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), primary)
    body.position.set(0, 0.4, 0)
    group.add(body)
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.3), armor)
    group.add(wing)
  } else {
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.4), primary)
    torso.position.set(0, 0.6, 0)
    group.add(torso)
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), primary)
    head.position.set(0, 1.1, 0)
    group.add(head)
    if (type === 'runner') {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, 0.15), armor)
      leg.position.set(0.1, 0.15, 0)
      group.add(leg)
    }
  }
  return group
}

const healthMap: Record<EnemyType, number> = { soldier: 1, runner: 1, turret: 3, flying: 2 }
const scoreMap: Record<EnemyType, number> = { soldier: 15, runner: 10, turret: 30, flying: 25 }
const fireIntervalMap: Record<EnemyType, number> = { soldier: 2, runner: 0, turret: 1.5, flying: 3 }

export function createEnemyEntity(id: number, type: EnemyType, x: number, y: number): EnemyEntity {
  const mesh = createEnemyMesh(type)
  mesh.position.set(x, y + 0.6, 0)
  return {
    id,
    mesh,
    position: { x, y },
    velocity: { x: -4, y: 0 },
    alive: true,
    health: healthMap[type],
    maxHealth: healthMap[type],
    type: 'enemy',
    enemyType: type,
    fireTimer: Math.random() * fireIntervalMap[type],
    fireInterval: fireIntervalMap[type],
    scoreValue: scoreMap[type],
  }
}
```

- [ ] **Step 2: Write `systems/EnemySystem.ts`**

```typescript
import * as THREE from 'three'
import type { Game } from '../Game'
import type { EnemyEntity, BulletEntity, EnemyType } from '../types'
import { ENEMY_BASE_SPEED, WORLD_WIDTH, WORLD_HEIGHT } from '../constants'
import { createEnemyEntity } from '../entities/Enemy'

const enemyBulletGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.25, 8)
const enemyBulletMat = new THREE.MeshStandardMaterial({ color: 0xfca5a5, emissive: 0xef4444, emissiveIntensity: 0.5 })

export class EnemySystem {
  constructor(private game: Game) {}

  spawn(type: EnemyType, x: number, y: number): void {
    const enemy = createEnemyEntity(this.game.entities.nextId(), type, x, y)
    this.game.entities.add(enemy)
  }

  update(delta: number, time: number): void {
    const player = this.game.getPlayer()
    if (!player) return

    for (const enemy of this.game.entities.enemies) {
      if (!enemy.alive) continue

      switch (enemy.enemyType) {
        case 'runner':
          enemy.velocity.x = -ENEMY_BASE_SPEED * 2
          break
        case 'flying':
          enemy.position.y += Math.sin(time * 3 + enemy.id) * delta * 2
          break
        case 'turret':
          enemy.velocity.x = 0
          break
        default:
          enemy.velocity.x = -ENEMY_BASE_SPEED
      }

      enemy.position.x += enemy.velocity.x * delta
      enemy.position.y += enemy.velocity.y * delta
      enemy.mesh.position.set(enemy.position.x, enemy.position.y + 0.6, 0)

      enemy.fireTimer -= delta
      if (enemy.fireTimer <= 0 && enemy.enemyType !== 'runner') {
        enemy.fireTimer = enemy.fireInterval
        this.enemyShoot(enemy, player.mesh.position)
      }
    }
  }

  private enemyShoot(enemy: EnemyEntity, targetPos: THREE.Vector3): void {
    const dir = new THREE.Vector3()
      .subVectors(targetPos, enemy.mesh.position)
      .setZ(0).normalize()

    const mesh = new THREE.Mesh(enemyBulletGeo, enemyBulletMat)
    mesh.rotation.z = Math.PI / 2
    mesh.position.copy(enemy.mesh.position)
    this.game.scene.scene.add(mesh)

    const bullet: BulletEntity = {
      id: this.game.entities.nextId(),
      mesh,
      position: { x: mesh.position.x, y: mesh.position.y },
      velocity: { x: dir.x * 8, y: dir.y * 8 },
      alive: true,
      health: 1, maxHealth: 1,
      type: 'bullet',
      damage: 1,
      fromPlayer: false,
    }
    this.game.entities.add(bullet)
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/contra-3d/entities/Enemy.ts src/contra-3d/systems/EnemySystem.ts
git commit -m "feat: add enemy entities and AI system with shooting"
```

---

### Task 11: Combat & power-up systems

**Files:**
- Create: `src/contra-3d/systems/CombatSystem.ts`
- Create: `src/contra-3d/systems/PowerUpSystem.ts`

- [ ] **Step 1: Write `systems/CombatSystem.ts`**

```typescript
import type { Game } from '../Game'
import { Physics } from '../Physics'

const phys = new Physics()
const HIT_THRESHOLD = 0.6

export class CombatSystem {
  constructor(private game: Game) {}

  update(_delta: number, time: number): void {
    const player = this.game.getPlayer()
    if (!player) return

    this.handleBulletHits(player, time)
    this.handleEnemyCollisions(player, time)
    this.cleanupDead()
  }

  private handleBulletHits(player: ReturnType<Game['getPlayer']>, time: number): void {
    const bullets = this.game.entities.bullets
    const enemies = this.game.entities.enemies

    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const bullet = bullets[bi]
      if (!bullet.alive) continue

      if (bullet.fromPlayer) {
        // Bullet hits enemy
        for (let ei = enemies.length - 1; ei >= 0; ei--) {
          const enemy = enemies[ei]
          if (!enemy.alive) continue
          if (bullet.mesh.position.distanceTo(enemy.mesh.position) < HIT_THRESHOLD) {
            enemy.health -= bullet.damage
            this.game.entities.remove(bullet)
            if (enemy.health <= 0) {
              this.game.entities.remove(enemy)
              this.game.addScore(enemy.scoreValue)
              this.game.particles.explode(enemy.mesh.position)
            }
            break
          }
        }
      } else if (player.alive && time > player.invincibleUntil) {
        // Enemy bullet hits player
        if (bullet.mesh.position.distanceTo(player.mesh.position) < 0.7) {
          player.health -= bullet.damage
          this.game.entities.remove(bullet)
          this.game.particles.hitSpark(bullet.mesh.position)
          if (player.health <= 0) {
            player.alive = false
            this.game.entities.remove(player)
          }
        }
      }
    }
  }

  private handleEnemyCollisions(player: ReturnType<Game['getPlayer']>, time: number): void {
    if (!player.alive || time < player.invincibleUntil) return
    for (const enemy of this.game.entities.enemies) {
      if (!enemy.alive) continue
      if (enemy.mesh.position.distanceTo(player.mesh.position) < 0.8) {
        player.health = 0
        player.alive = false
        this.game.entities.remove(player)
        this.game.particles.explode(player.mesh.position)
        break
      }
    }
  }

  private cleanupDead(): void {
    for (let i = this.game.entities.all.length - 1; i >= 0; i--) {
      const e = this.game.entities.all[i]
      if (!e.alive) continue
      if (e.type === 'bullet' && (e.position.x > 40 || e.position.x < -5)) {
        this.game.entities.remove(e)
      }
    }
  }
}
```

- [ ] **Step 2: Write `systems/PowerUpSystem.ts`**

```typescript
import * as THREE from 'three'
import type { Game } from '../Game'
import type { PowerUpEntity, WeaponType, PowerUpKind } from '../types'

export const POWERUP_COLORS: Record<string, number> = {
  spread: 0x818cf8, rate: 0xe879f9,
  machinegun: 0xfbbf24, spread_w: 0x818cf8, laser: 0xf472b6,
  fire: 0xfb923c, rapid: 0x34d399,
}

const geo = new THREE.IcosahedronGeometry(0.25, 0)

export class PowerUpSystem {
  constructor(private game: Game) {}

  spawn(x: number, y: number, kind: PowerUpKind, weaponType?: WeaponType): void {
    const color = weaponType ? POWERUP_COLORS[weaponType] : POWERUP_COLORS[kind]
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(x, y + 0.6, 0)
    this.game.scene.scene.add(mesh)

    const power: PowerUpEntity = {
      id: this.game.entities.nextId(),
      mesh,
      position: { x, y },
      velocity: { x: 0, y: 0 },
      alive: true,
      health: 1, maxHealth: 1,
      type: 'powerup',
      kind,
      weaponType,
    }
    this.game.entities.add(power)
  }

  update(delta: number, _time: number): void {
    const player = this.game.getPlayer()
    if (!player) return

    for (let i = this.game.entities.powerUps.length - 1; i >= 0; i--) {
      const p = this.game.entities.powerUps[i]
      if (!p.alive) continue

      p.mesh.rotation.y += delta * 2
      p.position.x -= 3 * delta
      p.mesh.position.set(p.position.x, p.position.y + 0.6, 0)

      if (p.mesh.position.distanceTo(player.mesh.position) < 0.8) {
        this.applyPickup(p, player)
        this.game.entities.remove(p)
        this.game.addScore(5)
      }
    }
  }

  private applyPickup(p: PowerUpEntity, player: any): void {
    if (p.kind === 'spread') {
      player.spreadLevel = Math.min(3, player.spreadLevel + 1)
    } else if (p.kind === 'rate') {
      player.fireRateLevel = Math.min(3, player.fireRateLevel + 1)
    } else if (p.kind === 'weapon' && p.weaponType) {
      player.weapon = p.weaponType
      player.spreadLevel = 1
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/contra-3d/systems/CombatSystem.ts src/contra-3d/systems/PowerUpSystem.ts
git commit -m "feat: add combat and power-up systems"
```

---

### Task 12: Particle system — explosions, muzzle flash, hit sparks

**Files:**
- Create: `src/contra-3d/systems/ParticleSystem.ts`

- [ ] **Step 1: Write `systems/ParticleSystem.ts`**

```typescript
import * as THREE from 'three'

type Particle = {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  ttl: number
  maxTtl: number
}

export class ParticleSystem {
  private particles: Particle[] = []
  private scene: THREE.Scene

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  explode(position: THREE.Vector3, count = 8): void {
    for (let i = 0; i < count; i++) {
      const size = 0.04 + Math.random() * 0.08
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        new THREE.MeshStandardMaterial({
          color: 0xf97316,
          emissive: 0xea580c,
          emissiveIntensity: 0.6,
        })
      )
      mesh.position.copy(position)
      this.scene.add(mesh)

      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
      const speed = 2 + Math.random() * 4
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed, 0),
        ttl: 0.5 + Math.random() * 0.3,
        maxTtl: 0.8,
      })
    }
  }

  hitSpark(position: THREE.Vector3): void {
    for (let i = 0; i < 4; i++) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.03, 0.03),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1 })
      )
      mesh.position.copy(position)
      this.scene.add(mesh)
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, 0),
        ttl: 0.2,
        maxTtl: 0.2,
      })
    }
  }

  update(delta: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.ttl -= delta
      if (p.ttl <= 0) {
        this.scene.remove(p.mesh)
        this.particles.splice(i, 1)
        continue
      }
      p.mesh.position.addScaledVector(p.velocity, delta)
      const scale = p.ttl / p.maxTtl
      p.mesh.scale.setScalar(scale)
    }
  }

  clear(): void {
    for (const p of this.particles) {
      this.scene.remove(p.mesh)
    }
    this.particles = []
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/contra-3d/systems/ParticleSystem.ts
git commit -m "feat: add particle system for explosions and hit sparks"
```

---

### Task 13: Cheat system — Konami code and level select

**Files:**
- Create: `src/contra-3d/CheatSystem.ts`

- [ ] **Step 1: Write `CheatSystem.ts`**

```typescript
import type { Game } from './Game'

type CheatSequence = { keys: string[]; name: string; action: (game: Game) => void }

export class CheatSystem {
  private buffer: string[] = []
  private bufferMax = 20
  lastActivated: string | null = null
  private activatedTime = 0

  private sequences: CheatSequence[] = [
    {
      keys: ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'],
      name: 'Konami Code',
      action: (game) => { game.lives = 30 },
    },
  ]

  constructor(private game: Game) {}

  update(time: number): void {
    // Clear cheat notification after 3 seconds
    if (this.lastActivated && time - this.activatedTime > 3) {
      this.lastActivated = null
      this.game.emitState()
    }
  }

  /** Called by InputManager when a key is pressed */
  recordKey(key: string): void {
    this.buffer.push(key.toLowerCase())
    if (this.buffer.length > this.bufferMax) {
      this.buffer.shift()
    }
    this.checkSequences()
  }

  private checkSequences(): void {
    for (const seq of this.sequences) {
      if (this.buffer.length < seq.keys.length) continue
      const start = this.buffer.length - seq.keys.length
      let match = true
      for (let i = 0; i < seq.keys.length; i++) {
        if (this.buffer[start + i] !== seq.keys[i]) {
          match = false
          break
        }
      }
      if (match) {
        seq.action(this.game)
        this.lastActivated = seq.name
        this.activatedTime = performance.now() / 1000
        this.game.emitState()
        this.buffer = []
        break
      }
    }
  }
}
```

- [ ] **Step 2: Wire cheat keys into InputManager**

Add after `this.keys.add(e.key.toLowerCase())` in InputManager's `onKeyDown`:
```typescript
if (this.game) this.game.cheats.recordKey(e.key)
```

This requires adding `game` reference to InputManager. Update constructor to accept it:
```typescript
// In InputManager constructor, add parameter: private game: Game
// This is a minor wiring step during Game construction
```

- [ ] **Step 3: Commit**

```bash
git add src/contra-3d/CheatSystem.ts
git commit -m "feat: add cheat system with Konami code"
```

---

### Task 14: Audio manager — Howler.js integration, SFX stubs, music stubs

**Files:**
- Create: `src/contra-3d/AudioManager.ts`
- Create: `src/contra-3d/audio/sfx.ts`
- Create: `src/contra-3d/audio/music.ts`

- [ ] **Step 1: Write `audio/sfx.ts`**

```typescript
export type SfxKey = 'shoot_machinegun' | 'shoot_spread' | 'shoot_laser' | 'shoot_fire'
  | 'shoot_rapid' | 'explosion' | 'pickup' | 'death' | 'hit' | 'cheat' | 'jump'
  | 'boss_alert' | 'level_complete'

export const SFX_FILES: Record<SfxKey, string> = {
  shoot_machinegun: '/audio/sfx/shoot_machinegun.mp3',
  shoot_spread: '/audio/sfx/shoot_spread.mp3',
  shoot_laser: '/audio/sfx/shoot_laser.mp3',
  shoot_fire: '/audio/sfx/shoot_fire.mp3',
  shoot_rapid: '/audio/sfx/shoot_rapid.mp3',
  explosion: '/audio/sfx/explosion.mp3',
  pickup: '/audio/sfx/pickup.mp3',
  death: '/audio/sfx/death.mp3',
  hit: '/audio/sfx/hit.mp3',
  cheat: '/audio/sfx/cheat.mp3',
  jump: '/audio/sfx/jump.mp3',
  boss_alert: '/audio/sfx/boss_alert.mp3',
  level_complete: '/audio/sfx/level_complete.mp3',
}
```

- [ ] **Step 2: Write `audio/music.ts`**

```typescript
export type MusicKey = 'menu' | 'level1' | 'level2' | 'level3' | 'level4' | 'level5' | 'boss'

export const MUSIC_FILES: Record<MusicKey, string> = {
  menu: '/audio/music/menu.mp3',
  level1: '/audio/music/level1.mp3',
  level2: '/audio/music/level2.mp3',
  level3: '/audio/music/level3.mp3',
  level4: '/audio/music/level4.mp3',
  level5: '/audio/music/level5.mp3',
  boss: '/audio/music/boss.mp3',
}
```

- [ ] **Step 3: Write `AudioManager.ts`**

```typescript
import { Howl } from 'howler'
import type { SfxKey } from './audio/sfx'
import { SFX_FILES } from './audio/sfx'
import type { MusicKey } from './audio/music'
import { MUSIC_FILES } from './audio/music'

export class AudioManager {
  private sfx: Map<SfxKey, Howl> = new Map()
  private music: Map<MusicKey, Howl> = new Map()
  private currentMusic: Howl | null = null
  private initialized = false

  init(): void {
    if (this.initialized) return

    for (const [key, src] of Object.entries(SFX_FILES)) {
      this.sfx.set(key as SfxKey, new Howl({ src: [src], volume: 0.5 }))
    }
    for (const [key, src] of Object.entries(MUSIC_FILES)) {
      this.music.set(key as MusicKey, new Howl({ src: [src], volume: 0.3, loop: true }))
    }
    this.initialized = true
  }

  play(key: SfxKey): void {
    const sound = this.sfx.get(key)
    if (sound) sound.play()
  }

  playMusic(key: MusicKey): void {
    if (this.currentMusic) this.currentMusic.stop()
    const track = this.music.get(key)
    if (track) {
      this.currentMusic = track
      track.play()
    }
  }

  stopMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.stop()
      this.currentMusic = null
    }
  }

  setMusicVolume(vol: number): void {
    this.music.forEach(h => h.volume(vol))
  }

  setSfxVolume(vol: number): void {
    this.sfx.forEach(h => h.volume(vol))
  }

  destroy(): void {
    this.stopMusic()
    this.sfx.forEach(h => h.unload())
    this.music.forEach(h => h.unload())
    this.sfx.clear()
    this.music.clear()
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/contra-3d/AudioManager.ts src/contra-3d/audio/
git commit -m "feat: add AudioManager with Howler.js, SFX and music stubs"
```

---

### Task 15: Level data types + LevelManager + first level definition

**Files:**
- Create: `src/contra-3d/levels/LevelData.ts`
- Create: `src/contra-3d/levels/Level1.ts`
- Create: `src/contra-3d/LevelManager.ts`

- [ ] **Step 1: Write `levels/LevelData.ts`** (re-exports from types — this is a barrel file for level configs)

```typescript
export type { LevelConfig, TerrainSegment, WaveConfig, BossConfig, BossPhase } from '../types'
```

- [ ] **Step 2: Write first level definition `levels/Level1.ts`**

```typescript
import type { LevelConfig } from './LevelData'

export const LEVEL_1: LevelConfig = {
  id: 'level1',
  name: 'Jungle Assault',
  totalDistance: 120,
  scrollSpeed: 4,
  background: {
    fogColor: '#0e1c1a',
    fogNear: 6,
    fogFar: 28,
    skyColor: '#0a0f0f',
    groundColor: '#1e2f27',
    parallaxLayers: [
      { color: '#112620', depth: 1, scrollFactor: 0.1 },
      { color: '#18332a', depth: 2, scrollFactor: 0.15 },
      { color: '#204036', depth: 3, scrollFactor: 0.2 },
    ],
  },
  terrain: [
    { x: 0, width: 30, height: 0.5, y: 0 },
    { x: 35, width: 10, height: 0.5, y: 0 },
    { x: 50, width: 8, height: 0.5, y: 0 },
    { x: 65, width: 20, height: 0.5, y: 0 },
    { x: 90, width: 30, height: 0.5, y: 0 },
  ],
  waves: [
    { atDistance: 10, enemies: [{ type: 'soldier', count: 3, interval: 1.5 }] },
    { atDistance: 25, enemies: [{ type: 'soldier', count: 2, interval: 1 }, { type: 'runner', count: 2, interval: 2 }] },
    { atDistance: 40, enemies: [{ type: 'turret', count: 1, interval: 0 }] },
    { atDistance: 55, enemies: [{ type: 'soldier', count: 3, interval: 1 }, { type: 'flying', count: 2, interval: 2 }] },
    { atDistance: 75, enemies: [{ type: 'soldier', count: 4, interval: 1 }, { type: 'runner', count: 3, interval: 1.5 }] },
    { atDistance: 95, enemies: [{ type: 'soldier', count: 2, interval: 1 }, { type: 'turret', count: 2, interval: 0 }] },
  ],
  powerUpDrops: [
    { atDistance: 15, weapon: 'spread', position: [10, 4] },
    { atDistance: 45, weapon: 'rapid', position: [10, 5] },
    { atDistance: 80, weapon: 'laser', position: [10, 4] },
  ],
  boss: {
    type: 'tank',
    health: 30,
    phases: [
      { healthThreshold: 1.0, attackPattern: 'slow_aim', speed: 2 },
      { healthThreshold: 0.5, attackPattern: 'fast_spread', speed: 3 },
    ],
    scoreValue: 500,
  },
  music: 'level1',
}
```

- [ ] **Step 3: Write `LevelManager.ts`**

```typescript
import type { Game } from './Game'
import type { LevelConfig, EnemyType } from './types'
import { LEVEL_1 } from './levels/Level1'

export class LevelManager {
  private game: Game
  private levels: LevelConfig[] = []
  private currentConfig: LevelConfig | null = null
  scrollOffset = 0
  private completed = false
  private waveIndex = 0
  private spawnTimers: number[] = []
  private bossSpawned = false

  constructor(game: Game) {
    this.game = game
    this.levels = [LEVEL_1]
  }

  totalLevels(): number {
    return this.levels.length
  }

  load(index: number): void {
    const config = this.levels[index - 1]
    if (!config) return
    this.currentConfig = config
    this.scrollOffset = 0
    this.completed = false
    this.waveIndex = 0
    this.spawnTimers = []
    this.bossSpawned = false

    this.game.scene.createBackgroundLayers(
      config.background.parallaxLayers.map(l => ({
        color: parseInt(l.color.replace('#', ''), 16),
        depth: l.depth,
        scrollFactor: l.scrollFactor,
      }))
    )
    this.game.audio.playMusic(config.music as any)
  }

  update(delta: number, time: number): void {
    if (!this.currentConfig || this.completed) return

    this.scrollOffset += this.currentConfig.scrollSpeed * delta

    // Spawn waves
    const wavesAtDistance = this.currentConfig.waves.filter(w => {
      const alreadySpawned = this.spawnTimers.includes(this.currentConfig!.waves.indexOf(w))
      return !alreadySpawned && this.scrollOffset >= w.atDistance
    })

    for (const wave of wavesAtDistance) {
      const idx = this.currentConfig.waves.indexOf(wave)
      this.spawnTimers.push(idx)
      this.spawnWave(wave, time)
    }

    // Spawn boss at end
    if (!this.bossSpawned && this.currentConfig.boss && this.scrollOffset >= this.currentConfig.totalDistance - 10) {
      this.bossSpawned = true
      this.completed = true
      this.game.screen = 'levelComplete'
      this.game.emitState()
    }
  }

  private spawnWave(wave: typeof this.currentConfig extends null ? never : this['currentConfig']['waves'][0], time: number): void {
    const offset = 30 // spawn offscreen right
    const yBase = 3 + Math.random() * 5
    for (const group of wave.enemies) {
      for (let i = 0; i < group.count; i++) {
        setTimeout(() => {
          const y = yBase + (Math.random() - 0.5) * 4
          this.game.enemySystem.spawn(group.type as EnemyType, offset, y)
        }, i * group.interval * 1000)
      }
    }
  }

  resetToCheckpoint(): void {
    this.scrollOffset = Math.max(0, this.scrollOffset - 15)
    this.completed = false
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/contra-3d/levels/LevelData.ts src/contra-3d/levels/Level1.ts src/contra-3d/LevelManager.ts
git commit -m "feat: add level system with data-driven LevelManager and first level"
```

---

### Task 16: Boss system — boss entity, multi-phase AI

**Files:**
- Create: `src/contra-3d/entities/Boss.ts`
- Create: `src/contra-3d/rendering/BossModels.ts`

- [ ] **Step 1: Write `rendering/BossModels.ts`**

```typescript
import * as THREE from 'three'

export function createBossMesh(bossType: string): THREE.Group {
  const group = new THREE.Group()

  if (bossType === 'tank') {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.4, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x4a4a4a })
    )
    body.position.set(0, 0.8, 0)
    group.add(body)

    const turret = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.8, 0.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x6b6b6b })
    )
    turret.position.set(0, 1.5, 0)
    group.add(turret)

    const cannon = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.2, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    )
    cannon.position.set(1.0, 1.7, 0)
    group.add(cannon)
  }

  return group
}
```

- [ ] **Step 2: Write `entities/Boss.ts`**

```typescript
import * as THREE from 'three'
import type { EnemyEntity } from '../types'
import { createBossMesh } from '../rendering/BossModels'

export function createBossEntity(id: number, bossType: string, health: number, x: number, y: number): EnemyEntity {
  const mesh = createBossMesh(bossType)
  mesh.position.set(x, y + 0.8, 0)
  return {
    id,
    mesh,
    position: { x, y },
    velocity: { x: 0, y: 0 },
    alive: true,
    health,
    maxHealth: health,
    type: 'boss',
    enemyType: 'turret',
    fireTimer: 0,
    fireInterval: 1,
    scoreValue: 500,
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/contra-3d/entities/Boss.ts src/contra-3d/rendering/BossModels.ts
git commit -m "feat: add boss entity and tank boss model with phase support"
```

---

### Task 17: UI screens — HUD, menus (React components)

**Files:**
- Create: `src/contra-3d/ui/HUD.tsx`
- Create: `src/contra-3d/ui/MainMenu.tsx`
- Create: `src/contra-3d/ui/PauseMenu.tsx`
- Create: `src/contra-3d/ui/GameOver.tsx`
- Create: `src/contra-3d/ui/LevelComplete.tsx`

- [ ] **Step 1: Write `ui/HUD.tsx`**

```tsx
import type { UIState } from '../types'

type HUDProps = UIState & { cheatActive: string | null }

export function HUD({ score, lives, health, maxHealth, weapon, spreadLevel, fireRateLevel, currentLevel, totalLevels, bossHealth, bossMaxHealth, cheatActive }: HUDProps) {
  const weaponName = weapon.charAt(0).toUpperCase() + weapon.slice(1)
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '12px 20px', pointerEvents: 'none', fontFamily: 'monospace', color: '#fff',
    }}>
      <div>
        <div style={{ fontSize: 14, opacity: 0.6 }}>SCORE</div>
        <div style={{ fontSize: 24, fontWeight: 'bold' }}>{score.toLocaleString()}</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, opacity: 0.6 }}>LIVES</div>
        <div style={{ fontSize: 24, fontWeight: 'bold' }}>{'♥'.repeat(lives)}</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, opacity: 0.6 }}>LEVEL</div>
        <div style={{ fontSize: 24, fontWeight: 'bold' }}>{currentLevel}/{totalLevels}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 14, opacity: 0.6 }}>HEALTH</div>
        <div style={{
          width: 120, height: 12, background: '#333', borderRadius: 6, overflow: 'hidden', marginTop: 4,
        }}>
          <div style={{
            width: `${(health / maxHealth) * 100}%`, height: '100%',
            background: health > 2 ? '#2dd4bf' : health > 1 ? '#fbbf24' : '#ef4444',
            borderRadius: 6, transition: 'width 0.2s',
          }} />
        </div>
        <div style={{ fontSize: 14, marginTop: 4, opacity: 0.8 }}>{weaponName} S{spreadLevel} R{fireRateLevel}</div>
      </div>
      {bossHealth > 0 && (
        <div style={{ position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)', width: 300 }}>
          <div style={{ fontSize: 14, opacity: 0.6, textAlign: 'center' }}>BOSS</div>
          <div style={{ width: '100%', height: 8, background: '#333', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${(bossHealth / bossMaxHealth) * 100}%`, height: '100%', background: '#ef4444', borderRadius: 4 }} />
          </div>
        </div>
      )}
      {cheatActive && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 32, fontWeight: 'bold', color: '#fbbf24', textShadow: '0 0 20px rgba(251,191,36,0.5)', animation: 'pulse 1s infinite' }}>
          CHEAT ACTIVATED
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write `ui/MainMenu.tsx`**

```tsx
type MainMenuProps = {
  onStart: () => void
}

export function MainMenu({ onStart }: MainMenuProps) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      background: 'rgba(0,0,0,0.85)', fontFamily: 'monospace', color: '#fff',
      zIndex: 10,
    }}>
      <h1 style={{ fontSize: 48, margin: 0, color: '#2dd4bf', textShadow: '0 0 30px rgba(45,212,191,0.3)' }}>
        CONTRA 3D
      </h1>
      <p style={{ fontSize: 16, opacity: 0.6, marginTop: 8 }}>Big guns. Jungle heat. Hold the line.</p>
      <button onClick={onStart} style={{
        marginTop: 40, padding: '12px 40px', fontSize: 18,
        background: '#2dd4bf', color: '#000', border: 'none', borderRadius: 8,
        cursor: 'pointer', fontWeight: 'bold',
      }}>
        START GAME
      </button>
      <div style={{ marginTop: 32, fontSize: 13, opacity: 0.5, textAlign: 'center', lineHeight: 1.8 }}>
        <p>WASD — Move &nbsp;|&nbsp; Mouse — Aim &nbsp;|&nbsp; Click — Shoot</p>
        <p>P — Pause &nbsp;|&nbsp; R — Restart</p>
        <p style={{ marginTop: 8, color: '#fbbf24' }}>↑ ↑ ↓ ↓ ← → ← → B A — ?</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write `ui/PauseMenu.tsx`**

```tsx
type PauseMenuProps = {
  onResume: () => void
  onRestart: () => void
  onQuit: () => void
}

export function PauseMenu({ onResume, onRestart, onQuit }: PauseMenuProps) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      background: 'rgba(0,0,0,0.6)', fontFamily: 'monospace', color: '#fff',
      zIndex: 10,
    }}>
      <h2 style={{ fontSize: 32, marginBottom: 24 }}>PAUSED</h2>
      <button onClick={onResume} style={btnStyle}>Resume</button>
      <button onClick={onRestart} style={btnStyle}>Restart</button>
      <button onClick={onQuit} style={btnStyle}>Quit to Menu</button>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  margin: 6, padding: '10px 32px', fontSize: 16,
  background: '#2dd4bf', color: '#000', border: 'none', borderRadius: 6,
  cursor: 'pointer', fontWeight: 'bold', width: 200,
}
```

- [ ] **Step 4: Write `ui/GameOver.tsx`**

```tsx
type GameOverProps = {
  score: number
  currentLevel: number
  onRestart: () => void
  onQuit: () => void
}

export function GameOver({ score, currentLevel, onRestart, onQuit }: GameOverProps) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      background: 'rgba(0,0,0,0.8)', fontFamily: 'monospace', color: '#fff',
      zIndex: 10,
    }}>
      <h2 style={{ fontSize: 36, color: '#ef4444', margin: 0 }}>GAME OVER</h2>
      <p style={{ fontSize: 20, marginTop: 16 }}>Score: {score.toLocaleString()}</p>
      <p style={{ fontSize: 14, opacity: 0.5 }}>Reached Level {currentLevel}</p>
      <button onClick={onRestart} style={btnOverlay}>Try Again</button>
      <button onClick={onQuit} style={btnOverlay}>Main Menu</button>
    </div>
  )
}

const btnOverlay: React.CSSProperties = {
  margin: 6, padding: '10px 32px', fontSize: 16,
  background: '#2dd4bf', color: '#000', border: 'none', borderRadius: 6,
  cursor: 'pointer', fontWeight: 'bold', width: 200,
}
```

- [ ] **Step 5: Write `ui/LevelComplete.tsx`**

```tsx
type LevelCompleteProps = {
  score: number
  currentLevel: number
  totalLevels: number
  onNext: () => void
}

export function LevelComplete({ score, currentLevel, totalLevels, onNext }: LevelCompleteProps) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      background: 'rgba(0,0,0,0.7)', fontFamily: 'monospace', color: '#fff',
      zIndex: 10,
    }}>
      <h2 style={{ fontSize: 32, color: '#2dd4bf', margin: 0 }}>LEVEL COMPLETE</h2>
      <p style={{ fontSize: 18, marginTop: 12 }}>Score: {score.toLocaleString()}</p>
      <p style={{ fontSize: 14, opacity: 0.5 }}>Level {currentLevel} of {totalLevels}</p>
      {currentLevel < totalLevels ? (
        <button onClick={onNext} style={btnComplete}>Next Level</button>
      ) : (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 20, color: '#fbbf24' }}>You Win!</p>
        </div>
      )}
    </div>
  )
}

const btnComplete: React.CSSProperties = {
  marginTop: 16, padding: '10px 32px', fontSize: 16,
  background: '#2dd4bf', color: '#000', border: 'none', borderRadius: 6,
  cursor: 'pointer', fontWeight: 'bold',
}
```

- [ ] **Step 6: Commit**

```bash
git add src/contra-3d/ui/
git commit -m "feat: add all UI screens (HUD, menu, pause, game over, level complete)"
```

---

### Task 18: React integration — mount/unmount shell, screen routing, level transitions

**Files:**
- Create: `src/contra-3d/index.tsx`
- Modify: `src/Contra3DGame.tsx` (simplify to mount/unmount shell)
- Modify: `src/App.tsx` (ensure routing still works)

- [ ] **Step 1: Write `src/contra-3d/index.tsx`** — the main integration component

```tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { Game } from './Game'
import { HUD } from './ui/HUD'
import { MainMenu } from './ui/MainMenu'
import { PauseMenu } from './ui/PauseMenu'
import { GameOver } from './ui/GameOver'
import { LevelComplete } from './ui/LevelComplete'
import type { UIState } from './types'

const initialUIState: UIState = {
  screen: 'menu', score: 0, lives: 3,
  health: 5, maxHealth: 5, weapon: 'machinegun',
  spreadLevel: 1, fireRateLevel: 1,
  currentLevel: 1, totalLevels: 0,
  bossHealth: 0, bossMaxHealth: 0,
  cheatActive: null,
}

export default function Contra3DGame() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Game | null>(null)
  const [ui, setUI] = useState<UIState>(initialUIState)
  const [gameReady, setGameReady] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const game = new Game(container, { onStateChange: setUI })
    gameRef.current = game
    game.start()
    setGameReady(true)

    return () => {
      game.destroy()
      gameRef.current = null
    }
  }, [])

  const handleStart = useCallback(() => {
    gameRef.current?.startLevel(1)
  }, [])

  const handleResume = useCallback(() => {
    gameRef.current?.resume()
  }, [])

  const handleRestart = useCallback(() => {
    gameRef.current?.restart()
  }, [])

  const handleQuit = useCallback(() => {
    gameRef.current?.quitToMenu()
  }, [])

  const handleNextLevel = useCallback(() => {
    const nextLevel = (gameRef.current?.currentLevel ?? 0) + 1
    gameRef.current?.startLevel(nextLevel)
  }, [])

  const handleTogglePause = useCallback(() => {
    const game = gameRef.current
    if (!game) return
    if (game.screen === 'playing') game.pause()
    else if (game.screen === 'paused') game.resume()
  }, [])

  return (
    <main className="snake">
      <div className="contra-3d" ref={containerRef} style={{ width: '100%', height: 500, position: 'relative' }}>
        {ui.screen === 'playing' && <HUD {...ui} />}
        {ui.screen === 'menu' && <MainMenu onStart={handleStart} />}
        {ui.screen === 'gameover' && <GameOver score={ui.score} currentLevel={ui.currentLevel} onRestart={handleRestart} onQuit={handleQuit} />}
        {ui.screen === 'levelComplete' && (
          <LevelComplete score={ui.score} currentLevel={ui.currentLevel} totalLevels={ui.totalLevels} onNext={handleNextLevel} />
        )}
      </div>

      <section className="snake__controls">
        <div className="controls">
          {ui.screen === 'playing' && <button onClick={handleTogglePause}>Pause</button>}
          {ui.screen === 'paused' && <button onClick={handleResume}>Resume</button>}
          <button onClick={handleRestart}>Restart</button>
        </div>
        <p className="snake__hint">
          Controls: WASD to move, mouse to aim, click/hold to fire. Press <code>P</code> to pause, <code>R</code> to restart.
        </p>
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Simplify original `Contra3DGame.tsx`**

Replace its entire content with:
```tsx
export { default } from './contra-3d/index'
```

- [ ] **Step 3: Verify `App.tsx` routing**

The existing `App.tsx` already does:
```tsx
{activeGame === 'contra3d' && <Contra3DGame />}
```
This still works — `Contra3DGame` now re-exports from `./contra-3d/index`.

- [ ] **Step 4: Commit**

```bash
git add src/contra-3d/index.tsx src/Contra3DGame.tsx
git commit -m "feat: integrate game engine with React UI shell and screen routing"
```

---

### Task 19: Game loop rendering call (wire update into render)

**Files:**
- Modify: `src/contra-3d/Game.ts` (add render call to update loop)

- [ ] **Step 1: Add render call to Game.update**

In the `update` method, after all system updates and before parallax update, add:
```typescript
// Inside the 'if (this.screen !== 'playing') return' block — at the end:
this.scene.render()
```

Add after the `this.levels.update(delta, time)` line:
```typescript
this.entities.updatePositions(delta)
this.entities.removeOffscreen(SCROLL_OFFSCREEN_MARGIN, this.levels.scrollOffset)
```

The full update method body should be:
```typescript
private update(delta: number, time: number): void {
  if (this.screen !== 'playing') return

  this.cheats.update(time)
  this.playerSystem.update(delta, time, this.player!)
  this.enemySystem.update(delta, time)
  this.combatSystem.update(delta, time)
  this.powerUpSystem.update(delta, time)
  this.particles.update(delta)
  this.levels.update(delta, time)
  this.entities.updatePositions(delta)
  this.entities.removeOffscreen(SCROLL_OFFSCREEN_MARGIN, this.levels.scrollOffset)
  this.scene.updateParallax(this.levels.scrollOffset)
  this.scene.render()

  if (this.player && !this.player.alive) {
    this.lives -= 1
    if (this.lives <= 0) {
      this.screen = 'gameover'
    } else {
      this.player = this.playerSystem.respawnPlayer()
      this.levels.resetToCheckpoint()
    }
    this.emitState()
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/contra-3d/Game.ts
git commit -m "fix: wire entity position updates and render call into game loop"
```

---

### Task 20: Remaining levels (Level 2-5)

**Files:**
- Create: `src/contra-3d/levels/Level2.ts`
- Create: `src/contra-3d/levels/Level3.ts`
- Create: `src/contra-3d/levels/Level4.ts`
- Create: `src/contra-3d/levels/Level5.ts`
- Modify: `src/contra-3d/LevelManager.ts` (register new levels)

- [ ] **Step 1: Create `Level2.ts` (Military Base)**

```typescript
import type { LevelConfig } from './LevelData'

export const LEVEL_2: LevelConfig = {
  id: 'level2', name: 'Military Base', totalDistance: 140, scrollSpeed: 4.5,
  background: { fogColor: '#1a1a1a', fogNear: 4, fogFar: 24, skyColor: '#111111', groundColor: '#333333', parallaxLayers: [
    { color: '#222222', depth: 1, scrollFactor: 0.1 }, { color: '#2a2a2a', depth: 2, scrollFactor: 0.15 }, { color: '#333333', depth: 3, scrollFactor: 0.2 },
  ]},
  terrain: [
    { x: 0, width: 40, height: 0.5, y: 0 }, { x: 45, width: 15, height: 0.5, y: 0 },
    { x: 65, width: 10, height: 0.5, y: 0 }, { x: 80, width: 25, height: 0.5, y: 0 },
    { x: 110, width: 30, height: 0.5, y: 0 },
  ],
  waves: [
    { atDistance: 8, enemies: [{ type: 'soldier', count: 3, interval: 1.2 }] },
    { atDistance: 20, enemies: [{ type: 'turret', count: 2, interval: 0 }] },
    { atDistance: 35, enemies: [{ type: 'soldier', count: 4, interval: 1 }, { type: 'runner', count: 2, interval: 1.5 }] },
    { atDistance: 50, enemies: [{ type: 'turret', count: 2, interval: 0 }, { type: 'flying', count: 2, interval: 1.8 }] },
    { atDistance: 70, enemies: [{ type: 'soldier', count: 5, interval: 0.8 }] },
    { atDistance: 90, enemies: [{ type: 'turret', count: 3, interval: 0 }, { type: 'runner', count: 3, interval: 1 }] },
    { atDistance: 110, enemies: [{ type: 'soldier', count: 4, interval: 1 }, { type: 'flying', count: 3, interval: 1.5 }] },
  ],
  powerUpDrops: [
    { atDistance: 12, weapon: 'machinegun', position: [10, 4] },
    { atDistance: 40, weapon: 'spread', position: [10, 4] },
    { atDistance: 75, weapon: 'laser', position: [10, 5] },
    { atDistance: 100, weapon: 'rapid', position: [10, 4] },
  ],
  boss: { type: 'tank', health: 40, phases: [{ healthThreshold: 1, attackPattern: 'aim', speed: 2 }, { healthThreshold: 0.5, attackPattern: 'fast_spread', speed: 3.5 }], scoreValue: 800 },
  music: 'level2',
}
```

- [ ] **Step 2: Create `Level3.ts` (Waterfall), `Level4.ts` (Alien Hive), `Level5.ts` (Final Fortress)**

Each level follows the same `LevelConfig` type structure. Key differences per level:

**Level 3 — Waterfall:** `totalDistance: 150`, `scrollSpeed: 4`. Palette: fog `#0a1f1a`, ground `#1a332a`. Waves: soldiers at distance 10, flying+runners at 30, soldiers+turrets at 50, heavy flying at 70, mixed swarm at 90. 3 powerUpDrops (spread at 15, laser at 60, rapid at 100). Boss: `health: 45`, 2 phases.

**Level 4 — Alien Hive:** `totalDistance: 160`, `scrollSpeed: 4.5`. Palette: fog `#1a0a1a`, ground `#2a1a33`. Waves: turrets early (distance 8), flying+runners at 25, soldier+aliens at 40, turret+runner combo at 60, all-types swarm at 80, 100. 4 powerUpDrops. Boss: `health: 50`, 3 phases (attackPattern: 'aim' → 'fast_spread' → 'rapid_fire').

**Level 5 — Final Fortress:** `totalDistance: 180`, `scrollSpeed: 5`. Palette: fog `#1a0a0a`, ground `#331a1a`. Heavy enemy density across all types. Waves every 15 distance units starting at 5. 5 powerUpDrops including rare laser at 90 and fire at 130. Boss: `health: 80`, 3 phases with increasing speed and spread.

- [ ] **Step 3: Register levels in `LevelManager.ts`**

```typescript
// In constructor, replace this.levels = [LEVEL_1] with:
import { LEVEL_1 } from './levels/Level1'
import { LEVEL_2 } from './levels/Level2'
import { LEVEL_3 } from './levels/Level3'
import { LEVEL_4 } from './levels/Level4'
import { LEVEL_5 } from './levels/Level5'

// In constructor:
this.levels = [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5]
```

- [ ] **Step 4: Commit**

```bash
git add src/contra-3d/levels/
git commit -m "feat: add levels 2-5 with distinct themes and increasing difficulty"
```

---

### Task 21: Audio asset placeholders + integration

**Files:**
- The audio manager and asset keys are defined in Task 14.
- This task creates placeholder directories and notes for audio asset sourcing.

- [ ] **Step 1: Create audio directory structure**

```bash
mkdir -p public/audio/sfx public/audio/music
```

Add a `.gitkeep` or README placeholder noting that real audio files need to be sourced from freesound.org or similar.

- [ ] **Step 2: Add graceful handling for missing audio**

In `AudioManager.init()`, wrap Howl instantiation in try-catch or add `onloaderror` handler:
```typescript
const howl = new Howl({
  src: [src],
  volume: 0.5,
  onloaderror: () => console.warn(`Audio failed to load: ${src}`),
})
```

- [ ] **Step 3: Commit**

```bash
git add public/audio/ src/contra-3d/AudioManager.ts
git commit -m "chore: add audio directories and graceful load handling"
```

---

### Task 22: Visual polish — soldier model detail, effects, screen shake

**Files:**
- Create: `src/contra-3d/rendering/Effects.ts`
- Modify: `src/contra-3d/rendering/SoldierModel.ts` (already created in Task 7 as Player.ts)

- [ ] **Step 1: Write `rendering/Effects.ts`**

```typescript
export class Effects {
  private shakeDuration = 0
  private shakeIntensity = 0

  shake(intensity: number, duration: number): void {
    this.shakeDuration = duration
    this.shakeIntensity = intensity
  }

  update(delta: number): { offsetX: number; offsetY: number } {
    if (this.shakeDuration <= 0) return { offsetX: 0, offsetY: 0 }
    this.shakeDuration -= delta
    const intensity = this.shakeIntensity * (this.shakeDuration / (this.shakeDuration + delta))
    return {
      offsetX: (Math.random() - 0.5) * intensity,
      offsetY: (Math.random() - 0.5) * intensity,
    }
  }
}
```

- [ ] **Step 2: Wire effects into camera**

Add `effects` field to Game class:
```typescript
// In Game.ts, add to class fields:
readonly effects = new Effects()
```

In `CombatSystem.ts`, trigger shake on hits:
```typescript
// In handleBulletHits, after removing enemy:
this.game.effects.shake(0.3, 0.15)
```

In `Game.update()`, apply shake offset to camera:
```typescript
// After this.scene.updateParallax(this.levels.scrollOffset):
const shakeOffset = this.effects.update(delta)
this.scene.camera.position.x += shakeOffset.offsetX
this.scene.camera.position.y += shakeOffset.offsetY
this.scene.camera.lookAt(6 + this.levels.scrollOffset, 4, 0)
```

- [ ] **Step 3: Commit**

```bash
git add src/contra-3d/rendering/Effects.ts
git commit -m "feat: add screen shake effect system"
```
