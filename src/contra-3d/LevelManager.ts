import type { Game } from './Game'
import type { LevelConfig, EnemyType } from './types'
import { LEVEL_1 } from './levels/Level1'
import { LEVEL_2 } from './levels/Level2'
import { LEVEL_3 } from './levels/Level3'
import { LEVEL_4 } from './levels/Level4'
import { LEVEL_5 } from './levels/Level5'
import { createBossEntity } from './entities/Boss'
import type { MusicKey } from './audio/music'

export class LevelManager {
  private game: Game
  private levels: LevelConfig[] = []
  private currentConfig: LevelConfig | null = null
  scrollOffset = 0
  private completed = false
  private spawnTimers: number[] = []
  private spawnedDrops: number[] = []
  private bossSpawned = false
  private currentBossId: number | null = null

  constructor(game: Game) {
    this.game = game
    this.levels = [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5]
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
    this.spawnTimers = []
    this.spawnedDrops = []
    this.bossSpawned = false

    const bg = config.background
    this.game.scene.setAtmosphere(bg.fogColor, bg.fogNear, bg.fogFar)
    this.game.scene.createBackgroundLayers(
      config.background.parallaxLayers.map(l => ({
        color: parseInt(l.color.replace('#', ''), 16),
        depth: l.depth,
        scrollFactor: l.scrollFactor,
      }))
    )
    this.game.audio.playMusic(config.music as MusicKey)
    // Update environment for level
    const groundColor = parseInt(bg.groundColor.replace('#', ''), 16)
    this.game.environment.ensureFloor()
    this.game.environment.setFloorColor(groundColor)
    this.game.environment.clearTerrain()
    this.game.environment.clearDecorations()
    this.game.environment.buildTerrain(config.terrain)
    this.game.environment.buildDecorations(config.decorations ?? [])
  }

  update(delta: number): void {
    if (!this.currentConfig || this.completed) return

    if (!this.bossSpawned) {
      this.scrollOffset += this.currentConfig.scrollSpeed * delta
    }

    const wavesAtDistance = this.currentConfig.waves.filter(w => {
      const alreadySpawned = this.spawnTimers.includes(this.currentConfig!.waves.indexOf(w))
      return !alreadySpawned && this.scrollOffset >= w.atDistance
    })

    for (const wave of wavesAtDistance) {
      const idx = this.currentConfig.waves.indexOf(wave)
      this.spawnTimers.push(idx)
      this.spawnWave(wave)
    }

    this.currentConfig.powerUpDrops.forEach((drop, i) => {
      if (!this.spawnedDrops.includes(i) && this.scrollOffset >= drop.atDistance) {
        this.spawnedDrops.push(i)
        this.game.powerUpSystem.spawn(this.scrollOffset + drop.position[0], drop.position[1], 'weapon', drop.weapon)
      }
    })

    if (!this.bossSpawned && this.currentConfig.boss && this.scrollOffset >= this.currentConfig.totalDistance - 10) {
      this.bossSpawned = true
      // Pause scrolling during boss fight
      const boss = createBossEntity(
        this.game.entities.nextId(),
        this.currentConfig.boss.type,
        this.currentConfig.boss.health,
        this.scrollOffset + 14,
        0,
        this.currentConfig.boss.scoreValue
      )
      this.currentBossId = boss.id
      this.game.entities.add(boss)
      // Emit state to show boss health bar
      this.game.emitState()
    }

    // Check if boss is still alive
    if (this.bossSpawned && this.currentBossId !== null) {
      const bossEntity = this.game.entities.all.find(e => e.id === this.currentBossId)
      if (!bossEntity || !bossEntity.alive) {
        // Boss defeated!
        this.currentBossId = null
        this.completed = true
        this.game.screen = 'levelComplete'
        this.game.emitState()
      }
    }

    // Update boss health in UI state
    const bossAlive = this.currentBossId !== null ? this.game.entities.all.find(e => e.id === this.currentBossId) : null
    if (bossAlive && bossAlive.alive && this.currentConfig?.boss) {
      this.game.emitState()
    }
  }

  private spawnWave(wave: LevelConfig['waves'][0]): void {
    for (const group of wave.enemies) {
      for (let i = 0; i < group.count; i++) {
        setTimeout(() => {
          if (this.game.screen !== 'playing') return
          // Spawn just past the right edge of the view, relative to current scroll
          const x = this.scrollOffset + 30
          const y = group.type === 'flying' ? 3 + Math.random() * 4 : 0
          this.game.enemySystem.spawn(group.type as EnemyType, x, y)
        }, i * group.interval * 1000)
      }
    }
  }

  getCurrentBossId(): number | null {
    return this.currentBossId
  }

  resetToCheckpoint(): void {
    // Don't rewind inside the boss arena — scrolling is already paused and
    // stacked rewinds would push the boss past the off-screen cull bound
    if (!this.bossSpawned) {
      this.scrollOffset = Math.max(0, this.scrollOffset - 15)
    }
    this.completed = false
  }
}
