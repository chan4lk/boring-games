import type { Game } from '../Game'
import * as THREE from 'three'

const HIT_THRESHOLD = 0.9
const bodyCenter = new THREE.Vector3()

// Enemy mesh origins sit at their feet; measure hits from the torso so
// shots at the visible body register
function enemyHitDistance(point: THREE.Vector3, enemy: { mesh: THREE.Object3D; type: string }): number {
  bodyCenter.copy(enemy.mesh.position)
  bodyCenter.y += enemy.type === 'boss' ? 1.2 : 0.5
  return point.distanceTo(bodyCenter)
}

export class CombatSystem {
  private enemyFlashTimers: Map<number, number> = new Map()
  private game: Game

  constructor(game: Game) {
    this.game = game
  }

  update(delta: number, time: number): void {
    const player = this.game.getPlayer()
    if (!player) return

    this.handleBulletHits(player, time)
    this.handleEnemyCollisions(player, time)
    this.cleanupDead()
    this.updateFlashTimers(delta)
  }

  private updateFlashTimers(delta: number): void {
    for (const [id, timer] of this.enemyFlashTimers.entries()) {
      const newTimer = timer - delta
      if (newTimer <= 0) {
        this.enemyFlashTimers.delete(id)
        const enemy = this.game.entities.enemies.find(e => e.id === id)
        if (enemy) restoreColors(enemy.mesh)
      } else {
        this.enemyFlashTimers.set(id, newTimer)
      }
    }
  }

  private handleBulletHits(player: NonNullable<ReturnType<Game['getPlayer']>>, time: number): void {
    const bullets = this.game.entities.bullets
    const enemies = this.game.entities.enemies

    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const bullet = bullets[bi]
      if (!bullet.alive) continue

      if (bullet.fromPlayer) {
        for (let ei = enemies.length - 1; ei >= 0; ei--) {
          const enemy = enemies[ei]
          if (!enemy.alive) continue
          if (enemyHitDistance(bullet.mesh.position, enemy) < (enemy.hitRadius ?? HIT_THRESHOLD)) {
            enemy.health -= bullet.damage
            this.game.entities.remove(bullet)
            if (enemy.health <= 0) {
              this.enemyFlashTimers.delete(enemy.id)
              this.game.entities.remove(enemy)
              this.game.addScore(enemy.scoreValue)
              this.game.particles.explode(enemy.mesh.position)
              this.game.effects.shake(0.15, 0.3)
            } else {
              // Flash hit effect
              this.enemyFlashTimers.set(enemy.id, 0.15)
              flashWhite(enemy.mesh)
            }
            break
          }
        }
      } else if (player.alive && time > player.invincibleUntil) {
        if (bullet.mesh.position.distanceTo(player.mesh.position) < 0.7) {
          player.health -= bullet.damage
          player.invincibleUntil = time + 0.8
          this.game.entities.remove(bullet)
          this.game.particles.hitSpark(bullet.mesh.position)
          this.game.effects.shake(0.3, 0.5)
          if (player.health <= 0) {
            player.alive = false
            this.game.entities.remove(player)
            this.game.effects.shake(0.5, 0.8)
          }
        }
      }
    }
  }

  private handleEnemyCollisions(player: NonNullable<ReturnType<Game['getPlayer']>>, time: number): void {
    if (!player.alive || time < player.invincibleUntil) return
    for (const enemy of this.game.entities.enemies) {
      if (!enemy.alive) continue
      if (enemy.mesh.position.distanceTo(player.mesh.position) < (enemy.hitRadius ?? 0.8)) {
        player.health = 0
        player.alive = false
        this.game.entities.remove(player)
        this.game.particles.explode(player.mesh.position)
        this.game.effects.shake(0.5, 0.8)
        break
      }
    }
  }

  private cleanupDead(): void {
    const scroll = this.game.levels.scrollOffset
    for (let i = this.game.entities.all.length - 1; i >= 0; i--) {
      const e = this.game.entities.all[i]
      if (!e.alive) continue
      if (e.type === 'bullet' && (e.position.x > scroll + 40 || e.position.x < scroll - 5)) {
        this.game.entities.remove(e)
      }
    }
  }
}

function flashWhite(group: THREE.Object3D): void {
  group.traverse(child => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
      if (!child.userData._origColor) {
        child.userData._origColor = child.material.color.getHex()
      }
      child.material.color.setHex(0xffffff)
    }
  })
}

function restoreColors(group: THREE.Object3D): void {
  group.traverse(child => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
      const orig = child.userData._origColor as number | undefined
      if (orig !== undefined) {
        child.material.color.setHex(orig)
        delete child.userData._origColor
      }
    }
  })
}
