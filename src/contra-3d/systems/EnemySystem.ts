import * as THREE from 'three'
import type { Game } from '../Game'
import type { EnemyEntity, BulletEntity, EnemyType } from '../types'
import { ENEMY_BASE_SPEED } from '../constants'
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
