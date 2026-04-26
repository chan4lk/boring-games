import type { LevelConfig } from './LevelData'

export const LEVEL_4: LevelConfig = {
  id: 'level4', name: 'Alien Hive', totalDistance: 160, scrollSpeed: 4.5,
  background: { fogColor: '#1a0a1a', fogNear: 4, fogFar: 22, skyColor: '#0f0510', groundColor: '#2a1a33', parallaxLayers: [
    { color: '#1a0d20', depth: 1, scrollFactor: 0.1 }, { color: '#24142e', depth: 2, scrollFactor: 0.15 }, { color: '#301a3a', depth: 3, scrollFactor: 0.2 },
  ]},
  terrain: [
    { x: 0, width: 35, height: 0.5, y: 0 }, { x: 40, width: 10, height: 0.5, y: 0 },
    { x: 55, width: 25, height: 0.5, y: 0 }, { x: 85, width: 15, height: 0.5, y: 0 },
    { x: 105, width: 30, height: 0.5, y: 0 }, { x: 140, width: 20, height: 0.5, y: 0 },
  ],
  waves: [
    { atDistance: 8, enemies: [{ type: 'flying', count: 3, interval: 1 }] },
    { atDistance: 22, enemies: [{ type: 'turret', count: 2, interval: 0 }, { type: 'runner', count: 2, interval: 1.5 }] },
    { atDistance: 38, enemies: [{ type: 'flying', count: 4, interval: 1 }, { type: 'soldier', count: 3, interval: 1.2 }] },
    { atDistance: 55, enemies: [{ type: 'turret', count: 3, interval: 0 }] },
    { atDistance: 72, enemies: [{ type: 'runner', count: 5, interval: 0.8 }, { type: 'flying', count: 3, interval: 1.5 }] },
    { atDistance: 90, enemies: [{ type: 'soldier', count: 5, interval: 0.8 }, { type: 'turret', count: 2, interval: 0 }] },
    { atDistance: 115, enemies: [{ type: 'flying', count: 5, interval: 0.8 }, { type: 'runner', count: 4, interval: 1 }] },
  ],
  powerUpDrops: [
    { atDistance: 12, weapon: 'spread', position: [10, 4] },
    { atDistance: 40, weapon: 'laser', position: [10, 4] },
    { atDistance: 70, weapon: 'rapid', position: [10, 5] },
    { atDistance: 100, weapon: 'fire', position: [10, 4] },
  ],
  boss: { type: 'tank', health: 50, phases: [{ healthThreshold: 1, attackPattern: 'aim', speed: 2.5 }, { healthThreshold: 0.5, attackPattern: 'fast_spread', speed: 3.5 }, { healthThreshold: 0.25, attackPattern: 'rapid_fire', speed: 4 }], scoreValue: 1200 },
  music: 'level4',
}
