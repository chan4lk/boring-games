import * as THREE from 'three'
import type { WeaponType, BulletEntity } from '../types'
import { WEAPONS, BULLET_SPEED } from '../constants'
import { EntityManager } from '../EntityManager'

const bulletGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 12)
const materialCache = new Map<WeaponType, THREE.MeshStandardMaterial>()

function getBulletMaterial(weapon: WeaponType): THREE.MeshStandardMaterial {
  let mat = materialCache.get(weapon)
  if (!mat) {
    const color = WEAPONS[weapon].color
    mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7 })
    materialCache.set(weapon, mat)
  }
  return mat
}

export class BulletPatterns {
  private entities: EntityManager

  constructor(entities: EntityManager) {
    this.entities = entities
  }

  spawnBullets(
    weapon: WeaponType,
    origin: THREE.Vector3,
    aimDir: THREE.Vector3,
    fromPlayer: boolean,
    spreadLevel: number
  ): void {
    const def = WEAPONS[weapon]
    const mat = getBulletMaterial(weapon)

    const count = weapon === 'spread' ? (spreadLevel === 1 ? 3 : spreadLevel === 2 ? 4 : 5) : def.bulletCount
    const angleStep = def.spreadAngle * (Math.PI / 180) / Math.max(1, count - 1)
    const startAngle = -def.spreadAngle * (Math.PI / 180) / 2

    const baseAngle = Math.atan2(aimDir.y, aimDir.x)

    for (let i = 0; i < count; i++) {
      const angle = baseAngle + startAngle + angleStep * i
      const dir = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0)
      const speed = def.bulletSpeed * BULLET_SPEED / 22

      const mesh = new THREE.Mesh(bulletGeo, mat)
      // Align the cylinder with its flight direction
      mesh.rotation.z = angle - Math.PI / 2
      // Distinct silhouette per weapon so upgrades are obvious in flight
      if (weapon === 'laser') mesh.scale.set(0.7, 3.5, 0.7)
      else if (weapon === 'fire') mesh.scale.set(2.4, 1.6, 2.4)
      else if (weapon === 'rapid') mesh.scale.set(0.7, 0.9, 0.7)
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
