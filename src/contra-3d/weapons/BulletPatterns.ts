import * as THREE from 'three'
import type { WeaponType, BulletEntity } from '../types'
import { WEAPONS, BULLET_SPEED } from '../constants'
import { EntityManager } from '../EntityManager'

const bulletGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 12)

export class BulletPatterns {
  constructor(private entities: EntityManager) {}

  spawnBullets(
    weapon: WeaponType,
    origin: THREE.Vector3,
    aimDir: THREE.Vector3,
    fromPlayer: boolean,
    spreadLevel: number
  ): void {
    const def = WEAPONS[weapon]
    const color = def.color
    const mat = new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 0.7,
    })

    const count = weapon === 'spread' ? (spreadLevel === 1 ? 3 : spreadLevel === 2 ? 4 : 5) : def.bulletCount
    const angleStep = def.spreadAngle * (Math.PI / 180) / Math.max(1, count - 1)
    const startAngle = -def.spreadAngle * (Math.PI / 180) / 2

    const baseAngle = Math.atan2(aimDir.y, aimDir.x)

    for (let i = 0; i < count; i++) {
      const angle = baseAngle + startAngle + angleStep * i
      const dir = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0)
      const speed = def.bulletSpeed * BULLET_SPEED / 22

      const mesh = new THREE.Mesh(bulletGeo, mat)
      mesh.rotation.z = Math.PI / 2
      mesh.position.copy(origin)

      const bullet: BulletEntity = {
        id: this.entities.nextId(),
        mesh,
        position: { x: mesh.position.x, y: mesh.position.y },
        velocity: { x: dir.x * speed, y: dir.y * speed },
        alive: true,
        health: weapon === 'laser' ? 3 : 1,
        maxHealth: weapon === 'laser' ? 3 : 1,
        type: 'bullet',
        damage: def.damage,
        fromPlayer,
      }
      this.entities.add(bullet)
    }
  }
}
