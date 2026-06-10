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
import { Effects } from './rendering/Effects'
import { Environment } from './rendering/Environment'
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
  readonly effects: Effects
  readonly environment: Environment
  readonly cheats: CheatSystem
  private callbacks: GameCallbacks
  private player: PlayerEntity | null = null

  screen: GameScreen = 'menu'
  score = 0
  lives = PLAYER_START_LIVES
  currentLevel = 0
  pickupMessage: string | null = null
  private pickupTime = 0

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
    this.effects = new Effects()
    this.particles.setEffects(this.effects)
    this.environment = new Environment(this.scene)
    this.cheats = new CheatSystem(this)

    this.engine = new Engine((delta, time) => this.update(delta, time))

    this.onKeyDown = this.onKeyDown.bind(this)
    window.addEventListener('keydown', this.onKeyDown)
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.cheats.recordKey(e.key)
    const key = e.key.toLowerCase()
    if (key === 'p') {
      if (this.screen === 'playing') this.pause()
      else if (this.screen === 'paused') this.resume()
    } else if (key === 'r') {
      if (this.screen === 'playing' || this.screen === 'paused' || this.screen === 'gameover') {
        this.restart()
      }
    }
  }

  start(): void {
    this.engine.start()
    this.emitState()
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown)
    this.engine.stop()
    this.input.destroy()
    this.scene.destroy()
    this.audio.destroy()
  }

  startLevel(levelIndex: number): void {
    this.entities.clear()
    this.particles.clear()
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
    this.environment.clearTerrain()
    this.environment.clearDecorations()
    this.scene.reset()
    this.startLevel(this.currentLevel)
  }

  quitToMenu(): void {
    this.screen = 'menu'
    this.entities.clear()
    this.particles.clear()
    this.environment.clearTerrain()
    this.environment.clearDecorations()
    this.scene.reset()
    this.emitState()
  }

  private update(delta: number, time: number): void {
    if (this.screen !== 'playing') return

    this.cheats.update(time)
    if (this.pickupMessage && time - this.pickupTime > 2) {
      this.pickupMessage = null
      this.emitState()
    }
    this.playerSystem.update(delta, time, this.player!)
    this.enemySystem.update(delta, time)
    this.combatSystem.update(delta, time)
    this.powerUpSystem.update(delta)
    this.particles.update(delta)
    this.levels.update(delta)
    this.entities.updatePositions(delta)
    this.entities.removeOffscreen(SCROLL_OFFSCREEN_MARGIN, this.levels.scrollOffset)
    this.scene.updateParallax(this.levels.scrollOffset)
    this.scene.updateLighting(this.levels.scrollOffset)
    this.environment.updateScroll(this.levels.scrollOffset)

    const scroll = this.levels.scrollOffset
    const shakeOffset = this.effects.update(delta)
    this.scene.camera.position.set(-6 + scroll + shakeOffset.offsetX, 6 + shakeOffset.offsetY, 12)
    this.scene.camera.lookAt(6 + scroll, 4, 0)
    // Without a pointer, shoot straight ahead at the player's height
    this.input.updateAim(scroll + 18, (this.player?.position.y ?? 3) + 1.0)
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

  getPlayer(): PlayerEntity | null {
    return this.player
  }

  showPickup(message: string): void {
    this.pickupMessage = message
    this.pickupTime = performance.now() / 1000
    this.emitState()
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
      bossHealth: (() => {
        const bossId = this.levels.getCurrentBossId()
        const bossEnemy = bossId !== null ? this.entities.all.find(e => e.id === bossId) : undefined
        return bossEnemy?.health ?? 0
      })(),
      bossMaxHealth: (() => {
        const bossId = this.levels.getCurrentBossId()
        const bossEnemy = bossId !== null ? this.entities.all.find(e => e.id === bossId) : undefined
        return bossEnemy?.maxHealth ?? 0
      })(),
      cheatActive: this.cheats.lastActivated,
      pickupMessage: this.pickupMessage,
    }
  }
}
