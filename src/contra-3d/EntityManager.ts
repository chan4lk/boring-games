import * as THREE from 'three'
import type { Entity, BulletEntity, EnemyEntity, PowerUpEntity } from './types'

export class EntityManager {
  private scene: THREE.Scene
  private idCounter = 1
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
    const splice = (arr: Entity[]) => {
      const i = arr.indexOf(entity)
      if (i !== -1) arr.splice(i, 1)
    }
    splice(this.all)
    splice(this.bullets)
    splice(this.enemies)
    splice(this.powerUps)
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
    return this.idCounter++
  }

  updatePositions(delta: number): void {
    for (const e of this.all) {
      if (!e.alive) continue
      if (e.type === 'powerup') continue // PowerUpSystem owns its mesh (bob/spin)
      e.position.x += e.velocity.x * delta
      e.position.y += e.velocity.y * delta
      // The +0.6 ground offset is for characters; bullet positions are
      // already true world coordinates — offsetting them shifts every shot
      // above where the cursor points
      const offsetY = e.type === 'bullet' ? 0 : 0.6
      e.mesh.position.set(e.position.x, e.position.y + offsetY, 0)
    }
  }

  removeOffscreen(margin: number, scrollOffset: number): void {
    const left = scrollOffset - margin
    const right = scrollOffset + 40 + margin
    for (let i = this.all.length - 1; i >= 0; i--) {
      const e = this.all[i]
      if (e.type === 'player') continue
      if (e.alive && (e.position.x < left || e.position.x > right)) {
        this.remove(e)
      }
    }
  }
}
