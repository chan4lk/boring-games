import type { EnemyEntity } from '../types'
import { createBossMesh } from '../rendering/BossModels'

export function createBossEntity(id: number, bossType: string, health: number, x: number, y: number, scoreValue = 500): EnemyEntity {
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
    scoreValue,
    // The tank hull is ~2 units wide and its visual center sits well above
    // the mesh origin — without a generous radius most visible hits miss
    hitRadius: 2.0,
  }
}
