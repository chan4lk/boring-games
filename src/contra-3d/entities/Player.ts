import * as THREE from 'three'
import type { PlayerEntity } from '../types'
import { PLAYER_MAX_HEALTH, INVINCIBILITY_DURATION } from '../constants'

const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2dd4bf })
const armorMat = new THREE.MeshStandardMaterial({ color: 0x0f766e })
const gunMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
const visorMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x1e90ff, emissiveIntensity: 0.4 })

export function createPlayerMesh(): THREE.Group {
  const group = new THREE.Group()

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, 0.45), bodyMat)
  torso.position.set(0, 0.9, 0)
  group.add(torso)

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.5), armorMat)
  chest.position.set(0, 1.0, 0)
  group.add(chest)

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), bodyMat)
  head.position.set(0, 1.55, 0)
  group.add(head)

  const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.25, 0.55), armorMat)
  helmet.position.set(0, 1.7, 0)
  group.add(helmet)

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.05), visorMat)
  visor.position.set(0.2, 1.55, 0.25)
  group.add(visor)

  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.6, 0.25), armorMat)
  backpack.position.set(-0.3, 0.95, -0.28)
  group.add(backpack)

  const armGeo = new THREE.BoxGeometry(0.2, 0.55, 0.2)
  const legGeo = new THREE.BoxGeometry(0.25, 0.6, 0.25)

  const leftArm = new THREE.Mesh(armGeo, bodyMat)
  leftArm.position.set(0.4, 1.0, 0)
  group.add(leftArm)

  const rightArm = new THREE.Mesh(armGeo, bodyMat)
  rightArm.position.set(0.4, 0.75, 0)
  group.add(rightArm)

  const leftLeg = new THREE.Mesh(legGeo, bodyMat)
  leftLeg.position.set(-0.18, 0.2, 0)
  group.add(leftLeg)

  const rightLeg = new THREE.Mesh(legGeo, bodyMat)
  rightLeg.position.set(0.18, 0.2, 0)
  group.add(rightLeg)

  const gun = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.2), gunMat)
  gun.position.set(1.0, 1.05, 0.1)
  group.add(gun)

  return group
}

export function createPlayerEntity(id: number, x: number, y: number): PlayerEntity {
  const mesh = createPlayerMesh()
  mesh.position.set(x, y + 0.6, 0)
  return {
    id,
    mesh,
    position: { x, y },
    velocity: { x: 0, y: 0 },
    alive: true,
    health: PLAYER_MAX_HEALTH,
    maxHealth: PLAYER_MAX_HEALTH,
    type: 'player',
    weapon: 'machinegun',
    spreadLevel: 1,
    fireRateLevel: 1,
    fireCooldown: 0,
    lastFireTime: 0,
    invincibleUntil: 0,
  }
}
