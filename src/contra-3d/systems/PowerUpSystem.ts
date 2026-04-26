import * as THREE from 'three'
import type { Game } from '../Game'
import type { PowerUpEntity, WeaponType, PowerUpKind } from '../types'

const POWERUP_COLORS: Record<string, number> = {
  spread: 0x818cf8, rate: 0xe879f9,
  machinegun: 0xfbbf24, spread_w: 0x818cf8, laser: 0xf472b6,
  fire: 0xfb923c, rapid: 0x34d399,
}

const geo = new THREE.IcosahedronGeometry(0.25, 0)

export class PowerUpSystem {
  constructor(private game: Game) {}

  spawn(x: number, y: number, kind: PowerUpKind, weaponType?: WeaponType): void {
    const color = weaponType ? POWERUP_COLORS[weaponType] : POWERUP_COLORS[kind]
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 })
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

  update(delta: number, _time: number): void {
    const player = this.game.getPlayer()
    if (!player) return

    for (let i = this.game.entities.powerUps.length - 1; i >= 0; i--) {
      const p = this.game.entities.powerUps[i]
      if (!p.alive) continue

      p.mesh.rotation.y += delta * 2
      p.position.x -= 3 * delta
      p.mesh.position.set(p.position.x, p.position.y + 0.6, 0)

      if (this.game.getPlayer() && p.mesh.position.distanceTo(player.mesh.position) < 0.8) {
        this.applyPickup(p, player)
        this.game.entities.remove(p)
        this.game.addScore(5)
      }
    }
  }

  private applyPickup(p: PowerUpEntity, player: import('../types').PlayerEntity): void {
    if (p.kind === 'spread') {
      player.spreadLevel = Math.min(3, player.spreadLevel + 1)
    } else if (p.kind === 'rate') {
      player.fireRateLevel = Math.min(3, player.fireRateLevel + 1)
    } else if (p.kind === 'weapon' && p.weaponType) {
      player.weapon = p.weaponType
      player.spreadLevel = 1
    }
  }
}
