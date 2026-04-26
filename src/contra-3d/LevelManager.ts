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
  private waveIndex = 0
  private spawnTimers: number[] = []
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
    this.game.audio.playMusic(config.music as MusicKey)
    // Update floor color to match level
    const bg = config.background
    const groundColor = parseInt(bg.groundColor.replace('#', ''), 16)
    this.game.environment.setFloorColor(groundColor)
  }

  update(delta: number, time: number): void {
    if (!this.currentConfig || this.completed) return

    this.scrollOffset += this.currentConfig.scrollSpeed * delta

    const wavesAtDistance = this.currentConfig.waves.filter(w => {
      const alreadySpawned = this.spawnTimers.includes(this.currentConfig!.waves.indexOf(w))
      return !alreadySpawned && this.scrollOffset >= w.atDistance
    })

    for (const wave of wavesAtDistance) {
      const idx = this.currentConfig.waves.indexOf(wave)
      this.spawnTimers.push(idx)
      this.spawnWave(wave, time)
    }

    if (!this.bossSpawned && this.currentConfig.boss && this.scrollOffset >= this.currentConfig.totalDistance - 10) {
      this.bossSpawned = true
      // Pause scrolling during boss fight
      const boss = createBossEntity(
        this.game.entities.nextId(),
        this.currentConfig.boss.type,
        this.currentConfig.boss.health,
        this.scrollOffset + 10,
        4
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

  private spawnWave(wave: LevelConfig['waves'][0], _time: number): void {
    const offset = 30
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

  getCurrentBossId(): number | null {
    return this.currentBossId
  }

  resetToCheckpoint(): void {
    this.scrollOffset = Math.max(0, this.scrollOffset - 15)
    this.completed = false
  }
}
