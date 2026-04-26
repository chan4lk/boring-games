# Contra 3D — Professional Overhaul Design

**Date:** 2026-04-26
**Status:** Approved design — ready for implementation planning

## Overview

Rewrite the existing Contra3D game into a professional-level side-scrolling run-and-gun (classic Contra style) rendered in 3D with Three.js. The game features 5-8 levels, full weapon arsenal, boss fights, audio, cheat codes, and a clean modular architecture designed for future co-op support.

## Architecture

### Module Structure

```
src/contra-3d/
  Game.ts                    - Master coordinator (owns the loop, wires systems)
  Engine.ts                  - Game loop (rAF, delta time, fixed update)
  SceneManager.ts            - Three.js scene, camera, renderer, lighting
  InputManager.ts            - Keyboard + mouse, abstraction for future co-op
  AudioManager.ts            - Howler.js, SFX triggers + music
  LevelManager.ts            - Level loading, wave triggers, scrolling, progression
  EntityManager.ts           - Entity create/update/destroy, object pooling
  Physics.ts                 - Simple AABB collision detection

  entities/
    Player.ts                - Movement, aiming, health, weapon state
    Enemy.ts                 - Base enemy + variants (Soldier, Runner, Turret, Flying)
    Boss.ts                  - Boss with phase-based AI
    Bullet.ts                - Player & enemy bullets
    PowerUp.ts               - Weapon/item pickups

  weapons/
    WeaponRegistry.ts        - All weapon definitions
    BulletPatterns.ts        - Spawn patterns per weapon type

  levels/
    LevelData.ts             - Type definitions for level configs
    Level1.ts..Level6.ts     - Level definitions (waves, terrain, pickups, boss)

  systems/
    PlayerSystem.ts          - Apply input → player movement/shooting
    EnemySystem.ts           - Enemy AI behaviors
    CombatSystem.ts          - Collision detection
    PowerUpSystem.ts         - Power-up spawning and collection
    ParticleSystem.ts        - Explosions, muzzle flash, debris, hit sparks

  rendering/
    SoldierModel.ts          - Player character model
    EnemyModels.ts           - Enemy model builders per type
    BossModels.ts            - Unique boss models
    Environment.ts           - Terrain, backgrounds, parallax, scrolling world
    Effects.ts               - Screen shake, flash, impact effects

  audio/
    sfx.ts                   - Sound effect definitions
    music.ts                 - Level music track references

  ui/
    HUD.ts                   - DOM-based overlay (score, lives, health, weapon)
    MainMenu.ts              - Title screen
    PauseMenu.ts             - Pause overlay
    GameOver.ts              - Game over + score display
    LevelComplete.ts         - Between-level transition

  types.ts                   - Shared interfaces
  constants.ts               - Tuning values
```

### Data Flow

- React owns the UI layer (menus, HUD). The 3D game runs in its own loop outside React's render cycle.
- Game state (score, lives, health, weapon, screen) flows **up** to React via a frame callback.
- User actions (pause, restart, menu) flow **down** by calling methods on the Game instance.
- `Contra3DGame` component mounts the Game instance and cleans up on unmount.

## Level System

### Level Data Model

```typescript
interface LevelConfig {
  id: string
  name: string
  totalDistance: number
  scrollSpeed: number
  background: {
    fogColor: string
    fogNear: number
    fogFar: number
    skyColor: string
    groundColor: string
    parallaxLayers: { color: string; depth: number; scrollFactor: number }[]
  }
  terrain: TerrainSegment[]
  waves: WaveConfig[]
  powerUpDrops: { atDistance: number; weapon: WeaponType; position: [number, number] }[]
  boss: BossConfig | null
  music: string
}
```

Each level is a data-driven config. Levels are defined as TypeScript objects.

### Level Themes

1. **Jungle** — dense foliage, narrow paths, soldier enemies
2. **Military Base** — bunkers, turrets, open areas
3. **Waterfall** — vertical sections, platforms, flying enemies
4. **Alien Hive** — organic terrain, aggressive aliens, narrow corridors
5. **Final Fortress** — gauntlet of all enemy types, final boss

### Progression Rules

- Complete a level → score tally → transition screen → next level
- 3 lives (extra life at score thresholds)
- Death restarts the current level (lives permitting)
- Weapons reset on death (classic Contra style)

### Boss Fights

- Each level ends with a boss (2-3 phases with different attack patterns at health thresholds)
- Scroll pauses during boss fights (arena mode)
- Boss health bar appears on HUD

## Weapon System

| Weapon | Damage | Fire Rate | Bullets | Spread | Notes |
|--------|--------|-----------|---------|--------|-------|
| Machine Gun | 1 | Fast | 1 | None | Default, rapid straight fire |
| Spread | 1 | Medium | 3-5 | 30° cone | Wide coverage |
| Laser | 3 | Slow | 1 beam | None | Pierces enemies |
| Fire | 2 | Medium | 1 | Slight arc | Fireball with splash |
| Rapid | 1 | Very Fast | 1 | None | Higher DPS |

- Pickups dropped by certain enemies or placed in the level
- One weapon held at a time (pickup replaces current)
- Weapons reset to Machine Gun on death
- Floating 3D pickup models with colored glow

## Combat System

- AABB collision detection for bullets → enemies, enemies → player
- Player has a health bar (not one-hit-kill)
- Enemies have varying health (soldiers: 1, turrets: 3, bosses: phased)
- Screen shake on hits and explosions

## Enemy Types

| Type | Behavior | Health | Notes |
|------|----------|--------|-------|
| Soldier | Walks and shoots | 1 | Basic grunt |
| Runner | Fast, melee charge | 1 | Forces player movement |
| Turret | Stationary, aimed fire | 3 | Cover-based challenge |
| Flying | Pattern movement, drops bombs | 2 | Vertical threat |

## Cheat Codes

Detected via InputManager (tracks recent keypresses, matches sequences):

| Code | Sequence | Effect |
|------|----------|--------|
| Konami Code | ↑ ↑ ↓ ↓ ← → ← → B A | 30 lives |
| Level Select | Konami at menu, hold A+Start | Unlock level select |

Visual "CHEAT ACTIVATED" overlay (gold text, 2s, shimmer effect) + chime on activation.

## Audio System

Powered by Howler.js.

- **Music**: Looping track per level, separate boss music, menu track
- **SFX**: Per-weapon shoot sounds, explosion, pickup, death, jump, cheat activation, menu navigation
- API: `audio.play('sfx_shoot_spread')`, `audio.playMusic('level1')`

## UI System

DOM-based (React components), not rendered in Three.js:

- **MainMenu** — Title, "Press Enter to Start", controls reference, cheat entry
- **HUD** — Score (top-left), Lives (top-center), Health bar (top-right), Weapon icon (bottom-right)
- **PauseMenu** — Resume, Restart, Quit to Menu (blurs 3D view)
- **GameOver** — Final score, Press Enter to Restart / Q to Quit
- **LevelComplete** — Level name + score tally → auto-advance or Enter

## Implementation Constraints

- Keep Three.js as renderer (already a dependency)
- All game code outside React lifecycle (React is mount/unmount shell)
- Architecture must support future 2-player co-op addition
- Desktop-only initially
