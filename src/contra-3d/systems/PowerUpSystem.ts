import * as THREE from 'three'
import type { Game } from '../Game'
import type { PowerUpEntity, WeaponType, PowerUpKind } from '../types'
import { WEAPONS } from '../constants'

const POWERUP_COLORS: Record<string, number> = {
  spread: 0x818cf8, rate: 0xe879f9,
  machinegun: 0xfbbf24, spread_w: 0x818cf8, laser: 0xf472b6,
  fire: 0xfb923c, rapid: 0x34d399,
}

const geo = new THREE.IcosahedronGeometry(0.4, 0)

export class PowerUpSystem {
  private game: Game
  private t = 0

  constructor(game: Game) {
    this.game = game
  }

  spawn(x: number, y: number, kind: PowerUpKind, weaponType?: WeaponType): void {
    const color = weaponType ? POWERUP_COLORS[weaponType] : POWERUP_COLORS[kind]
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.1 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(x, y + 0.6, 0)
    this.game.scene.scene.add(mesh)

    const power: PowerUpEntity = {
      id: this.game.entities.nextId(),
      mesh,
      position: { x, y },
      velocity: { x: 0, y: 0 },
      alive: true,
      health: 1, maxHealth: 1,
      type: 'powerup',
      kind,
      weaponType,
    }
    this.game.entities.add(power)
  }

  update(delta: number): void {
    const player = this.game.getPlayer()
    if (!player) return

    this.t += delta
    for (let i = this.game.entities.powerUps.length - 1; i >= 0; i--) {
      const p = this.game.entities.powerUps[i]
      if (!p.alive) continue

      // Drift forward slower than the scroll so pickups linger on screen,
      // bobbing and spinning to draw the eye
      p.position.x += 2 * delta
      p.mesh.rotation.y += delta * 2.5
      p.mesh.position.set(p.position.x, p.position.y + 0.6 + Math.sin(this.t * 3 + p.id) * 0.15, 0)

      if (p.mesh.position.distanceTo(player.mesh.position) < 1.0) {
        this.applyPickup(p, player)
        this.game.entities.remove(p)
        this.game.addScore(5)
      }
    }
  }

  private applyPickup(p: PowerUpEntity, player: import('../types').PlayerEntity): void {
    if (p.kind === 'spread') {
      player.spreadLevel = Math.min(3, player.spreadLevel + 1)
      this.game.showPickup(`SPREAD +${player.spreadLevel}`)
    } else if (p.kind === 'rate') {
      player.fireRateLevel = Math.min(3, player.fireRateLevel + 1)
      this.game.showPickup(`FIRE RATE +${player.fireRateLevel}`)
    } else if (p.kind === 'weapon' && p.weaponType) {
      player.weapon = p.weaponType
      player.spreadLevel = 1
      this.game.showPickup(`${WEAPONS[p.weaponType].name.toUpperCase()}!`)
    }
  }
}
