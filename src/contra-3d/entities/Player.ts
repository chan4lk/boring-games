import * as THREE from 'three'
import type { PlayerEntity } from '../types'
import { PLAYER_MAX_HEALTH } from '../constants'

const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2dd4bf, roughness: 0.6 })
const armorMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.4, metalness: 0.3 })
const gunMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.7 })
const visorMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x1e90ff, emissiveIntensity: 0.4 })
const bootMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.8 })
const barrelMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.2, metalness: 0.8 })
const glowStripMat = new THREE.MeshStandardMaterial({
  color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.6,
})

export function createPlayerMesh(): THREE.Group {
  const group = new THREE.Group()

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, 0.45), bodyMat)
  torso.position.set(0, 0.9, 0)
  group.add(torso)

  // Chest armor
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.5), armorMat)
  chest.position.set(0, 1.0, 0)
  group.add(chest)

  // Shoulder pads
  const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), armorMat)
  shoulderL.position.set(-0.45, 1.15, 0)
  group.add(shoulderL)
  const shoulderR = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), armorMat)
  shoulderR.position.set(0.45, 1.15, 0)
  group.add(shoulderR)

  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), bodyMat)
  head.position.set(0, 1.55, 0)
  group.add(head)

  // Helmet
  const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.25, 0.55), armorMat)
  helmet.position.set(0, 1.7, 0)
  group.add(helmet)

  // Visor
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.05), visorMat)
  visor.position.set(0.2, 1.55, 0.25)
  group.add(visor)

  // Backpack
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.6, 0.25), armorMat)
  backpack.position.set(-0.3, 0.95, -0.28)
  group.add(backpack)

  // Cylinder arms
  const armGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.5, 6)
  const leftArm = new THREE.Mesh(armGeo, bodyMat)
  leftArm.position.set(-0.4, 0.95, 0)
  leftArm.rotation.x = 0.2
  group.add(leftArm)

  const rightArm = new THREE.Mesh(armGeo, bodyMat)
  rightArm.position.set(0.4, 0.75, 0)
  rightArm.rotation.x = -0.3
  group.add(rightArm)

  // Cylinder legs
  const legGeo = new THREE.CylinderGeometry(0.15, 0.18, 0.55, 6)
  const leftLeg = new THREE.Mesh(legGeo, bodyMat)
  leftLeg.position.set(-0.18, 0.25, 0)
  group.add(leftLeg)

  const rightLeg = new THREE.Mesh(legGeo, bodyMat)
  rightLeg.position.set(0.18, 0.25, 0)
  group.add(rightLeg)

  // Boots
  const bootGeo = new THREE.BoxGeometry(0.2, 0.1, 0.25)
  const leftBoot = new THREE.Mesh(bootGeo, bootMat)
  leftBoot.position.set(-0.18, 0.05, 0.05)
  group.add(leftBoot)
  const rightBoot = new THREE.Mesh(bootGeo, bootMat)
  rightBoot.position.set(0.18, 0.05, 0.05)
  group.add(rightBoot)

  // Gun body
  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, 0.18), gunMat)
  gun.position.set(1.0, 1.05, 0.1)
  group.add(gun)

  // Gun barrel
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.4, 6), barrelMat)
  barrel.rotation.z = Math.PI / 2
  barrel.position.set(1.5, 1.05, 0.1)
  group.add(barrel)

  // Gun glow strip
  const glowStrip = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.04, 0.05), glowStripMat)
  glowStrip.position.set(1.3, 1.07, 0.15)
  group.add(glowStrip)

  // Cast shadows on all meshes
  group.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true
    }
  })

  // Store limb refs for animation
  group.userData.leftLeg = leftLeg
  group.userData.rightLeg = rightLeg
  group.userData.leftArm = leftArm
  group.userData.rightArm = rightArm

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
