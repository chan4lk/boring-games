import type { LevelConfig } from './LevelData'

export const LEVEL_3: LevelConfig = {
  id: 'level3', name: 'Waterfall', totalDistance: 150, scrollSpeed: 4,
  background: { fogColor: '#9dc2ad', fogNear: 13, fogFar: 46, skyColor: '#b3d4c2', groundColor: '#356144', parallaxLayers: [
    { color: '#4a7a5e', depth: 1, scrollFactor: 0.1 }, { color: '#5f8e71', depth: 2, scrollFactor: 0.15 }, { color: '#74a286', depth: 3, scrollFactor: 0.2 },
  ]},
  terrain: [
    { x: 0, width: 25, height: 0.5, y: 0 }, { x: 30, width: 8, height: 0.5, y: 0 },
    { x: 42, width: 20, height: 0.5, y: 0 }, { x: 68, width: 12, height: 0.5, y: 0 },
    { x: 85, width: 30, height: 0.5, y: 0 }, { x: 120, width: 30, height: 0.5, y: 0 },
  ],
  decorations: [
    { type: 'tree', x: 4, y: 0.5, scale: 0.9 }, { type: 'rock', x: 8, y: 0.5 },
    { type: 'tree', x: 14, y: 0.5, scale: 1.1 }, { type: 'rock', x: 18, y: 0.5 },
    { type: 'tree', x: 22, y: 0.5 }, { type: 'rock', x: 32, y: 0.5 },
    { type: 'tree', x: 34, y: 0.5, scale: 0.8 }, { type: 'tree', x: 45, y: 0.5, scale: 1.2 },
    { type: 'rock', x: 50, y: 0.5 }, { type: 'tree', x: 55, y: 0.5 },
    { type: 'rock', x: 60, y: 0.5 }, { type: 'tree', x: 70, y: 0.5 },
    { type: 'tree', x: 75, y: 0.5, scale: 0.9 }, { type: 'rock', x: 78, y: 0.5 },
    { type: 'tree', x: 90, y: 0.5 }, { type: 'rock', x: 95, y: 0.5 },
    { type: 'tree', x: 100, y: 0.5, scale: 1.1 }, { type: 'rock', x: 108, y: 0.5 },
    { type: 'tree', x: 125, y: 0.5 }, { type: 'rock', x: 132, y: 0.5 },
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
