# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Vite dev server with hot reload
npm run build    # Type-check (tsc -b) then build production bundle
npm run lint     # Run ESLint over the repo
npm run preview  # Serve the production build locally
```

There is no test runner configured. `npm run build` is the main correctness check — it runs the TypeScript compiler across all tsconfig project references before bundling.

## What this is

A React 19 + TypeScript + Vite mini-arcade hosting four self-contained games. `src/App.tsx` is a tab switcher that conditionally renders one game component; the games share no state:

- **SnakeGame.tsx**, **RocketGame.tsx** — small standalone canvas games
- **ContraGame.tsx** — 2D Contra clone, tick logic in `contraLogic.ts`
- **Contra3DGame.tsx** — re-export of `src/contra-3d/index.tsx`, the Three.js 3D shooter that makes up most of the codebase

## Contra 3D architecture (`src/contra-3d/`)

### React ↔ imperative boundary

`index.tsx` is the only React entry point into the game. It instantiates the imperative `Game` class into a ref, and the game pushes UI state (screen, score, lives, boss health…) back via `callbacks.onStateChange(uiState)` → `setUI`. React renders only DOM overlays (`ui/` — HUD, MainMenu, PauseMenu, GameOver, LevelComplete) conditioned on `ui.screen`; all Three.js objects are owned by the game classes, never by React.

### Frame loop and ownership

`Engine.ts` runs a requestAnimationFrame loop (delta capped at 33ms) and calls `Game.update()`. `Game.ts` is the central orchestrator — it constructs and owns every manager/system and only updates when `screen === 'playing'`. Per-frame order matters:

cheats → PlayerSystem → EnemySystem → CombatSystem → PowerUpSystem → particles → LevelManager → EntityManager position sync → off-screen cleanup → parallax → render.

- **SceneManager.ts** — Three.js scene/camera/renderer, fog/atmosphere, parallax background layers, delegates final render to `rendering/PostProcessingManager.ts` (UnrealBloom).
- **EntityManager.ts** — flat entity pool (`all`, `bullets`, `enemies`, `powerUps`). Classifies entities by property presence: `.damage` → bullet, `.enemyType` → enemy, `.kind` → power-up. Syncs `entity.position` → `mesh.position` each frame.
- **LevelManager.ts** — advances `scrollOffset`, spawns enemy waves and power-up drops when `scrollOffset >= atDistance`, spawns the boss near `totalDistance` (which **pauses scrolling** — arena mode), and flips the screen to `levelComplete` when the boss dies.
- **systems/** — procedural per-frame systems, not ECS: PlayerSystem (input, movement, shooting, animation), EnemySystem (per-type AI: soldier/runner/turret/flying), CombatSystem (distance-based hit detection, i-frames, death effects), ParticleSystem (TTL sprite particles), PowerUpSystem (pickups, weapon/stat upgrades).

### Entity model

Entities are plain objects (factories in `entities/Player.ts`, `Enemy.ts`, `Boss.ts`), typed as a base `Entity` plus subtypes in `types.ts` (`BulletEntity`, `EnemyEntity`, `PowerUpEntity`, `PlayerEntity`). `entity.position` (x, y) is the source of truth; the mesh is positioned at `(x, y + 0.6, 0)` — the +0.6 ground offset is intentional.

### Coordinate conventions (2.5D)

All gameplay happens on the Z=0 plane: X is horizontal scroll direction, Y is vertical/jump. The camera sits off-axis for a 2.5D perspective look. World bounds and all gameplay tuning (speeds, fire cooldowns, weapon definitions, invincibility duration, extra-life score) live in `constants.ts` — change tuning there, not inline.

### Levels

`levels/Level1.ts`–`Level5.ts` export declarative `LevelConfig` objects (shape defined in `types.ts`): scroll speed, total distance, background/fog/parallax colors, terrain segments, decorations, timed enemy `waves`, `powerUpDrops`, an optional `boss`, and a music key. Adding or tuning a level usually means editing only its config file.

### Supporting pieces

- **InputManager.ts** — keyboard key set + mouse raycast against a ground plane to get the 3D aim point.
- **AudioManager.ts** — Howler.js wrapper; music starts on level load.
- **CheatSystem.ts** — Konami code listener (grants lives, shows a UI toast).
- **rendering/** — procedural canvas-generated textures (`ProceduralTextures.ts`, `ParticleTextures.ts`), mesh factories for terrain/decorations (`Environment.ts`, `EnvironmentDecorations.ts`) and bosses (`BossModels.ts`).
- **Physics.ts** — AABB/distance helpers; most combat collision is simple distance checks in CombatSystem.
