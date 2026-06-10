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
  pickupMessage: string | null
}

export type WeaponType = 'machinegun' | 'spread' | 'laser' | 'fire' | 'rapid'

export type EnemyType = 'soldier' | 'runner' | 'turret' | 'flying'

export type PowerUpKind = 'spread' | 'rate' | 'weapon'

export type Entity = {
  id: number
  mesh: THREE.Object3D
  position: { x: number; y: number }
  velocity: { x: number; y: number }
  alive: boolean
  health: number
  maxHealth: number
  type: string
  /** Collision radius around the mesh origin; defaults apply when omitted */
  hitRadius?: number
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
  decorations?: { type: 'tree' | 'rock' | 'crate'; x: number; y: number; scale?: number }[]
  waves: WaveConfig[]
  powerUpDrops: { atDistance: number; weapon: WeaponType; position: [number, number] }[]
  boss: BossConfig | null
  music: string
}

export type GameCallbacks = {
  onStateChange: (state: UIState) => void
}
