import * as THREE from 'three'
import type { Game } from '../Game'
import type { PlayerEntity, BulletEntity } from '../types'
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
