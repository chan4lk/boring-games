import type { LevelConfig } from './LevelData'

export const LEVEL_4: LevelConfig = {
  id: 'level4', name: 'Alien Hive', totalDistance: 160, scrollSpeed: 4.5,
  background: { fogColor: '#b4a0c4', fogNear: 12, fogFar: 42, skyColor: '#c5b4d2', groundColor: '#4d3f63', parallaxLayers: [
    { color: '#6d5a88', depth: 1, scrollFactor: 0.1 }, { color: '#7e6c98', depth: 2, scrollFactor: 0.15 }, { color: '#9080a8', depth: 3, scrollFactor: 0.2 },
  ]},
  terrain: [
    { x: 0, width: 35, height: 0.5, y: 0 }, { x: 40, width: 10, height: 0.5, y: 0 },
    { x: 55, width: 25, height: 0.5, y: 0 }, { x: 85, width: 15, height: 0.5, y: 0 },
    { x: 105, width: 30, height: 0.5, y: 0 }, { x: 140, width: 20, height: 0.5, y: 0 },
  ],
  decorations: [
    { type: 'rock', x: 5, y: 0.5, scale: 1.2 }, { type: 'rock', x: 10, y: 0.5 },
    { type: 'rock', x: 15, y: 0.5, scale: 0.8 }, { type: 'rock', x: 20, y: 0.5, scale: 1.1 },
    { type: 'rock', x: 28, y: 0.5 }, { type: 'rock', x: 38, y: 0.5, scale: 1.3 },
    { type: 'rock', x: 42, y: 0.5 }, { type: 'rock', x: 48, y: 0.5, scale: 0.9 },
    { type: 'rock', x: 58, y: 0.5, scale: 1.2 }, { type: 'rock', x: 65, y: 0.5 },
    { type: 'rock', x: 72, y: 0.5 }, { type: 'rock', x: 78, y: 0.5, scale: 1.1 },
    { type: 'rock', x: 88, y: 0.5 }, { type: 'rock', x: 95, y: 0.5 },
    { type: 'rock', x: 108, y: 0.5, scale: 1.2 }, { type: 'rock', x: 118, y: 0.5 },
    { type: 'rock', x: 130, y: 0.5 }, { type: 'rock', x: 145, y: 0.5, scale: 0.8 },
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
