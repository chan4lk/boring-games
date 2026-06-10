import * as THREE from 'three'
import type { Game } from '../Game'
import type { PlayerEntity } from '../types'
import { PLAYER_SPEED, WORLD_WIDTH, WORLD_HEIGHT, WEAPONS } from '../constants'
import { createPlayerEntity } from '../entities/Player'
import { BulletPatterns } from '../weapons/BulletPatterns'

export class PlayerSystem {
  private game: Game
  private patterns: BulletPatterns

  constructor(game: Game) {
    this.game = game
    this.patterns = new BulletPatterns(game.entities)
  }

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
    const moving = move.x !== 0 || move.y !== 0

    if (moving) {
      const len = Math.sqrt(move.x * move.x + move.y * move.y)
      move.x /= len
      move.y /= len
      player.position.x += move.x * PLAYER_SPEED * delta
      player.position.y += move.y * PLAYER_SPEED * delta
    }

    // Clamp relative to the scrolling camera; the left edge carries the player forward
    const scroll = this.game.levels.scrollOffset
    player.position.x = Math.max(scroll + 0.5, Math.min(player.position.x, scroll + WORLD_WIDTH - 2))
    player.position.y = Math.max(0, Math.min(player.position.y, WORLD_HEIGHT - 1.5))

    // Idle breathing bob
    const bob = Math.sin(time * 4) * 0.008
    player.mesh.position.set(player.position.x, player.position.y + 0.6 + bob, 0)

    const aimDir = new THREE.Vector3()
      .subVectors(input.aimTarget, player.mesh.position)
      .setZ(0).normalize()
    player.mesh.lookAt(player.mesh.position.clone().add(aimDir))

    // Leg swing animation
    const leftLeg = player.mesh.userData.leftLeg as THREE.Mesh | undefined
    const rightLeg = player.mesh.userData.rightLeg as THREE.Mesh | undefined
    if (leftLeg && rightLeg) {
      if (moving) {
        const swing = Math.sin(time * 10) * 0.5
        leftLeg.rotation.x = swing
        rightLeg.rotation.x = -swing
      } else {
        leftLeg.rotation.x *= 0.9
        rightLeg.rotation.x *= 0.9
      }
    }

    // Subtle arm sway when moving
    const leftArm = player.mesh.userData.leftArm as THREE.Mesh | undefined
    const rightArm = player.mesh.userData.rightArm as THREE.Mesh | undefined
    if (leftArm && rightArm) {
      if (moving) {
        const armSwing = Math.sin(time * 10) * 0.15
        leftArm.rotation.z = armSwing
        rightArm.rotation.z = -armSwing
      } else {
        // Idle arm rest
        leftArm.rotation.z *= 0.9
        rightArm.rotation.z *= 0.9
      }
    }

    if (input.isShooting()) {
      this.shoot(time, player)
    }
  }

  private shoot(time: number, player: PlayerEntity): void {
    const def = WEAPONS[player.weapon]
    const cooldown = def.fireRate / player.fireRateLevel
    if (time - player.lastFireTime < cooldown) return
    player.lastFireTime = time

    // Direction from the muzzle itself so bullets pass exactly through the
    // cursor point instead of converging on a line from the player's feet
    const muzzle = player.mesh.position.clone().add(new THREE.Vector3(0, 0.45, 0.1))
    const baseDir = new THREE.Vector3()
      .subVectors(this.game.input.aimTarget, muzzle)
      .setZ(0).normalize()
    const origin = muzzle.add(baseDir.clone().multiplyScalar(1.2))

    this.patterns.spawnBullets(player.weapon, origin, baseDir, true, player.spreadLevel)
  }
}
