import type { LevelConfig } from './LevelData'

export const LEVEL_5: LevelConfig = {
  id: 'level5', name: 'Final Fortress', totalDistance: 180, scrollSpeed: 5,
  background: { fogColor: '#c49684', fogNear: 12, fogFar: 40, skyColor: '#d2a896', groundColor: '#5c3e32', parallaxLayers: [
    { color: '#7e564a', depth: 1, scrollFactor: 0.1 }, { color: '#8f675a', depth: 2, scrollFactor: 0.15 }, { color: '#a1796b', depth: 3, scrollFactor: 0.2 },
  ]},
  terrain: [
    { x: 0, width: 30, height: 0.5, y: 0 }, { x: 35, width: 15, height: 0.5, y: 0 },
    { x: 55, width: 20, height: 0.5, y: 0 }, { x: 80, width: 10, height: 0.5, y: 0 },
    { x: 95, width: 25, height: 0.5, y: 0 }, { x: 125, width: 20, height: 0.5, y: 0 },
    { x: 150, width: 30, height: 0.5, y: 0 },
  ],
  decorations: [
    { type: 'crate', x: 4, y: 0.5 }, { type: 'rock', x: 8, y: 0.5 },
    { type: 'crate', x: 14, y: 0.5 }, { type: 'crate', x: 20, y: 0.5 },
    { type: 'rock', x: 26, y: 0.5 }, { type: 'crate', x: 38, y: 0.5 },
    { type: 'crate', x: 42, y: 0.5 }, { type: 'rock', x: 48, y: 0.5 },
    { type: 'crate', x: 58, y: 0.5 }, { type: 'crate', x: 65, y: 0.5 },
    { type: 'rock', x: 72, y: 0.5 }, { type: 'crate', x: 85, y: 0.5 },
    { type: 'crate', x: 90, y: 0.5 }, { type: 'rock', x: 100, y: 0.5 },
    { type: 'crate', x: 110, y: 0.5 }, { type: 'crate', x: 130, y: 0.5 },
    { type: 'rock', x: 140, y: 0.5 }, { type: 'crate', x: 155, y: 0.5 },
  ],
  waves: [
    { atDistance: 5, enemies: [{ type: 'soldier', count: 4, interval: 0.8 }] },
    { atDistance: 18, enemies: [{ type: 'turret', count: 3, interval: 0 }, { type: 'flying', count: 2, interval: 1 }] },
    { atDistance: 35, enemies: [{ type: 'runner', count: 5, interval: 0.7 }, { type: 'soldier', count: 3, interval: 1 }] },
    { atDistance: 50, enemies: [{ type: 'turret', count: 3, interval: 0 }, { type: 'flying', count: 3, interval: 1 }] },
    { atDistance: 68, enemies: [{ type: 'soldier', count: 6, interval: 0.6 }, { type: 'runner', count: 4, interval: 0.8 }] },
    { atDistance: 85, enemies: [{ type: 'flying', count: 5, interval: 0.8 }, { type: 'turret', count: 2, interval: 0 }] },
    { atDistance: 105, enemies: [{ type: 'soldier', count: 5, interval: 0.7 }, { type: 'flying', count: 4, interval: 0.8 }, { type: 'runner', count: 3, interval: 1 }] },
    { atDistance: 130, enemies: [{ type: 'turret', count: 4, interval: 0 }, { type: 'flying', count: 4, interval: 0.8 }] },
  ],
  powerUpDrops: [
    { atDistance: 10, weapon: 'spread', position: [10, 4] },
    { atDistance: 40, weapon: 'rapid', position: [10, 5] },
    { atDistance: 75, weapon: 'laser', position: [10, 4] },
    { atDistance: 100, weapon: 'fire', position: [10, 4] },
    { atDistance: 125, weapon: 'spread', position: [10, 4] },
  ],
  boss: { type: 'tank', health: 80, phases: [{ healthThreshold: 1, attackPattern: 'aim', speed: 2 }, { healthThreshold: 0.6, attackPattern: 'fast_spread', speed: 3 }, { healthThreshold: 0.3, attackPattern: 'rapid_fire', speed: 4.5 }], scoreValue: 2000 },
  music: 'level5',
}
