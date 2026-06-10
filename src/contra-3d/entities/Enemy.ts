import * as THREE from 'three'
import type { EnemyEntity, EnemyType } from '../types'

const primaryColors: Record<EnemyType, number> = {
  soldier: 0xf97316, runner: 0xef4444, turret: 0x78716c, flying: 0xa21caf,
}
const armorColors: Record<EnemyType, number> = {
  soldier: 0x7c2d12, runner: 0x7f1d1d, turret: 0x44403c, flying: 0x701a75,
}

export function createEnemyMesh(type: EnemyType): THREE.Group {
  const group = new THREE.Group()
  const primary = new THREE.MeshStandardMaterial({ color: primaryColors[type], roughness: 0.5, metalness: 0.2 })
  const armor = new THREE.MeshStandardMaterial({ color: armorColors[type], roughness: 0.7, metalness: 0.1 })

  if (type === 'turret') {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 0.4, 8), armor)
    base.position.set(0, 0.2, 0)
    group.add(base)
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.15), primary)
    gun.position.set(0.5, 0.5, 0)
    group.add(gun)
  } else if (type === 'flying') {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), primary)
    body.position.set(0, 0.4, 0)
    group.add(body)
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.3), armor)
    group.add(wing)
  } else {
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.4), primary)
    torso.position.set(0, 0.6, 0)
    group.add(torso)
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), primary)
    head.position.set(0, 1.1, 0)
    group.add(head)
    if (type === 'runner') {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, 0.15), armor)
      leg.position.set(0.1, 0.15, 0)
      group.add(leg)
    }
  }
  // Cast shadows
  group.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true
    }
  })

  return group
}

const healthMap: Record<EnemyType, number> = { soldier: 1, runner: 1, turret: 3, flying: 2 }
const scoreMap: Record<EnemyType, number> = { soldier: 15, runner: 10, turret: 30, flying: 25 }
const fireIntervalMap: Record<EnemyType, number> = { soldier: 2, runner: 0, turret: 1.5, flying: 3 }
const hitRadiusMap: Record<EnemyType, number> = { soldier: 1.1, runner: 1.1, turret: 1.0, flying: 0.9 }

export function createEnemyEntity(id: number, type: EnemyType, x: number, y: number): EnemyEntity {
  const mesh = createEnemyMesh(type)
  mesh.position.set(x, y + 0.6, 0)
  return {
    id,
    mesh,
    position: { x, y },
    velocity: { x: -4, y: 0 },
    alive: true,
    health: healthMap[type],
    maxHealth: healthMap[type],
    type: 'enemy',
    enemyType: type,
    fireTimer: Math.random() * fireIntervalMap[type],
    fireInterval: fireIntervalMap[type],
    scoreValue: scoreMap[type],
    hitRadius: hitRadiusMap[type],
  }
}
