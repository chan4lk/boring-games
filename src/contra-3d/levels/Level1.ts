import type { LevelConfig } from './LevelData'

export const LEVEL_1: LevelConfig = {
  id: 'level1',
  name: 'Jungle Assault',
  totalDistance: 120,
  scrollSpeed: 4,
  background: {
    fogColor: '#0e1c1a',
    fogNear: 6,
    fogFar: 28,
    skyColor: '#0a0f0f',
    groundColor: '#1e2f27',
    parallaxLayers: [
      { color: '#112620', depth: 1, scrollFactor: 0.1 },
      { color: '#18332a', depth: 2, scrollFactor: 0.15 },
      { color: '#204036', depth: 3, scrollFactor: 0.2 },
    ],
  },
  terrain: [
    { x: 0, width: 30, height: 0.5, y: 0 },
    { x: 35, width: 10, height: 0.5, y: 0 },
    { x: 50, width: 8, height: 0.5, y: 0 },
    { x: 65, width: 20, height: 0.5, y: 0 },
    { x: 90, width: 30, height: 0.5, y: 0 },
  ],
  waves: [
    { atDistance: 10, enemies: [{ type: 'soldier', count: 3, interval: 1.5 }] },
    { atDistance: 25, enemies: [{ type: 'soldier', count: 2, interval: 1 }, { type: 'runner', count: 2, interval: 2 }] },
    { atDistance: 40, enemies: [{ type: 'turret', count: 1, interval: 0 }] },
    { atDistance: 55, enemies: [{ type: 'soldier', count: 3, interval: 1 }, { type: 'flying', count: 2, interval: 2 }] },
    { atDistance: 75, enemies: [{ type: 'soldier', count: 4, interval: 1 }, { type: 'runner', count: 3, interval: 1.5 }] },
    { atDistance: 95, enemies: [{ type: 'soldier', count: 2, interval: 1 }, { type: 'turret', count: 2, interval: 0 }] },
  ],
  powerUpDrops: [
    { atDistance: 15, weapon: 'spread', position: [10, 4] },
    { atDistance: 45, weapon: 'rapid', position: [10, 5] },
    { atDistance: 80, weapon: 'laser', position: [10, 4] },
  ],
  boss: {
    type: 'tank',
    health: 30,
    phases: [
      { healthThreshold: 1.0, attackPattern: 'slow_aim', speed: 2 },
      { healthThreshold: 0.5, attackPattern: 'fast_spread', speed: 3 },
    ],
    scoreValue: 500,
  },
  music: 'level1',
}
