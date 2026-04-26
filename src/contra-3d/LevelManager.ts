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
      this.completed = true
      this.game.screen = 'levelComplete'
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

  resetToCheckpoint(): void {
    this.scrollOffset = Math.max(0, this.scrollOffset - 15)
    this.completed = false
  }
}
