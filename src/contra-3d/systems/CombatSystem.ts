import type { Game } from '../Game'
import { Physics } from '../Physics'

const phys = new Physics()
const HIT_THRESHOLD = 0.6

export class CombatSystem {
  constructor(private game: Game) {}

  update(_delta: number, time: number): void {
    const player = this.game.getPlayer()
    if (!player) return

    this.handleBulletHits(player, time)
    this.handleEnemyCollisions(player, time)
    this.cleanupDead()
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
          if (bullet.mesh.position.distanceTo(enemy.mesh.position) < HIT_THRESHOLD) {
            enemy.health -= bullet.damage
            this.game.entities.remove(bullet)
            if (enemy.health <= 0) {
              this.game.entities.remove(enemy)
              this.game.addScore(enemy.scoreValue)
              this.game.particles.explode(enemy.mesh.position)
            }
            break
          }
        }
      } else if (player.alive && time > player.invincibleUntil) {
        if (bullet.mesh.position.distanceTo(player.mesh.position) < 0.7) {
          player.health -= bullet.damage
          this.game.entities.remove(bullet)
          this.game.particles.hitSpark(bullet.mesh.position)
          if (player.health <= 0) {
            player.alive = false
            this.game.entities.remove(player)
          }
        }
      }
    }
  }

  private handleEnemyCollisions(player: NonNullable<ReturnType<Game['getPlayer']>>, time: number): void {
    if (!player.alive || time < player.invincibleUntil) return
    for (const enemy of this.game.entities.enemies) {
      if (!enemy.alive) continue
      if (enemy.mesh.position.distanceTo(player.mesh.position) < 0.8) {
        player.health = 0
        player.alive = false
        this.game.entities.remove(player)
        this.game.particles.explode(player.mesh.position)
        break
      }
    }
  }

  private cleanupDead(): void {
    for (let i = this.game.entities.all.length - 1; i >= 0; i--) {
      const e = this.game.entities.all[i]
      if (!e.alive) continue
      if (e.type === 'bullet' && (e.position.x > 40 || e.position.x < -5)) {
        this.game.entities.remove(e)
      }
    }
  }
}
