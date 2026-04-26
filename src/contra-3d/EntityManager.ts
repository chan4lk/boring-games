import * as THREE from 'three'
import type { Entity, BulletEntity, EnemyEntity, PowerUpEntity } from './types'

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
