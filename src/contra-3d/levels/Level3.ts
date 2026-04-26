import type { LevelConfig } from './LevelData'

export const LEVEL_3: LevelConfig = {
  id: 'level3', name: 'Waterfall', totalDistance: 150, scrollSpeed: 4,
  background: { fogColor: '#0a1f1a', fogNear: 5, fogFar: 26, skyColor: '#0a1510', groundColor: '#1a332a', parallaxLayers: [
    { color: '#0d241a', depth: 1, scrollFactor: 0.1 }, { color: '#143320', depth: 2, scrollFactor: 0.15 }, { color: '#1a4028', depth: 3, scrollFactor: 0.2 },
  ]},
  terrain: [
    { x: 0, width: 25, height: 0.5, y: 0 }, { x: 30, width: 8, height: 0.5, y: 0 },
    { x: 42, width: 20, height: 0.5, y: 0 }, { x: 68, width: 12, height: 0.5, y: 0 },
    { x: 85, width: 30, height: 0.5, y: 0 }, { x: 120, width: 30, height: 0.5, y: 0 },
  ],
  waves: [
    { atDistance: 10, enemies: [{ type: 'flying', count: 3, interval: 1.5 }] },
    { atDistance: 25, enemies: [{ type: 'soldier', count: 3, interval: 1.2 }, { type: 'flying', count: 2, interval: 2 }] },
    { atDistance: 45, enemies: [{ type: 'runner', count: 4, interval: 1 }] },
    { atDistance: 60, enemies: [{ type: 'flying', count: 4, interval: 1 }, { type: 'soldier', count: 2, interval: 1.5 }] },
    { atDistance: 80, enemies: [{ type: 'turret', count: 2, interval: 0 }, { type: 'runner', count: 3, interval: 1.2 }] },
    { atDistance: 100, enemies: [{ type: 'soldier', count: 5, interval: 0.8 }, { type: 'flying', count: 3, interval: 1.5 }] },
  ],
  powerUpDrops: [
    { atDistance: 15, weapon: 'spread', position: [10, 4] },
    { atDistance: 55, weapon: 'rapid', position: [10, 5] },
    { atDistance: 90, weapon: 'laser', position: [10, 4] },
  ],
  boss: { type: 'tank', health: 45, phases: [{ healthThreshold: 1, attackPattern: 'aim', speed: 2 }, { healthThreshold: 0.5, attackPattern: 'fast_spread', speed: 3 }], scoreValue: 1000 },
  music: 'level3',
}
