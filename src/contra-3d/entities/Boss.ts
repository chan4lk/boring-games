import * as THREE from 'three'
import type { EnemyEntity } from '../types'
import { createBossMesh } from '../rendering/BossModels'

export function createBossEntity(id: number, bossType: string, health: number, x: number, y: number): EnemyEntity {
  const mesh = createBossMesh(bossType)
  mesh.position.set(x, y + 0.8, 0)
  return {
    id,
    mesh,
    position: { x, y },
    velocity: { x: 0, y: 0 },
    alive: true,
    health,
    maxHealth: health,
    type: 'boss',
    enemyType: 'turret',
    fireTimer: 0,
    fireInterval: 1,
    scoreValue: 500,
  }
}
