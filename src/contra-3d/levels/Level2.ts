import type { LevelConfig } from './LevelData'

export const LEVEL_2: LevelConfig = {
  id: 'level2', name: 'Military Base', totalDistance: 140, scrollSpeed: 4.5,
  background: { fogColor: '#1a1a1a', fogNear: 4, fogFar: 24, skyColor: '#111111', groundColor: '#333333', parallaxLayers: [
    { color: '#222222', depth: 1, scrollFactor: 0.1 }, { color: '#2a2a2a', depth: 2, scrollFactor: 0.15 }, { color: '#333333', depth: 3, scrollFactor: 0.2 },
  ]},
  terrain: [
    { x: 0, width: 40, height: 0.5, y: 0 }, { x: 45, width: 15, height: 0.5, y: 0 },
    { x: 65, width: 10, height: 0.5, y: 0 }, { x: 80, width: 25, height: 0.5, y: 0 },
    { x: 110, width: 30, height: 0.5, y: 0 },
  ],
  waves: [
    { atDistance: 8, enemies: [{ type: 'soldier', count: 3, interval: 1.2 }] },
    { atDistance: 20, enemies: [{ type: 'turret', count: 2, interval: 0 }] },
    { atDistance: 35, enemies: [{ type: 'soldier', count: 4, interval: 1 }, { type: 'runner', count: 2, interval: 1.5 }] },
    { atDistance: 50, enemies: [{ type: 'turret', count: 2, interval: 0 }, { type: 'flying', count: 2, interval: 1.8 }] },
    { atDistance: 70, enemies: [{ type: 'soldier', count: 5, interval: 0.8 }] },
    { atDistance: 90, enemies: [{ type: 'turret', count: 3, interval: 0 }, { type: 'runner', count: 3, interval: 1 }] },
    { atDistance: 110, enemies: [{ type: 'soldier', count: 4, interval: 1 }, { type: 'flying', count: 3, interval: 1.5 }] },
  ],
  powerUpDrops: [
    { atDistance: 12, weapon: 'spread', position: [10, 4] },
    { atDistance: 40, weapon: 'laser', position: [10, 4] },
    { atDistance: 75, weapon: 'rapid', position: [10, 5] },
    { atDistance: 100, weapon: 'fire', position: [10, 4] },
  ],
  boss: { type: 'tank', health: 40, phases: [{ healthThreshold: 1, attackPattern: 'aim', speed: 2 }, { healthThreshold: 0.5, attackPattern: 'fast_spread', speed: 3.5 }], scoreValue: 800 },
  music: 'level2',
}
