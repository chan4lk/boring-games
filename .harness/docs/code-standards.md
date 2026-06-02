# Codex App — Engineering Notes

Conventions, gotchas, and stack facts that every rein in this project should know. Read this before changing anything non-trivial.

## Stack

- **Framework**: React 19.2 (hooks only — no class components anywhere in the repo).
- **Language**: TypeScript ~5.9, `tsc -b` is part of the build gate.
- **Bundler / dev server**: Vite 8.
- **3D**: Three.js 0.183 (only used in `src/contra-3d/`).
- **Audio**: Howler.js 2.2 (only used in `src/contra-3d/audio/`).
- **Linter**: ESLint 9 (flat config) with `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`.

## Build / verify

- `npm run dev` — Vite dev server with HMR.
- `npm run build` — `tsc -b && vite build`. **This is the production gate**; type errors fail it.
- `npm run lint` — `eslint .`.
- `npm run preview` — serve the production build locally.

CI runs `npm ci` → `npm run build` on every push to `main` (see `.github/workflows/deploy.yml`).

## Deployment

- **Target**: GitHub Pages.
- **Repo**: `chan4lk/boring-games` (note: the Vite `base` is `/boring-games/`, **not** the local directory name `codex-app`).
- **Workflow**: `.github/workflows/deploy.yml` — single `build` job + `deploy` job, both `ubuntu-latest`, Node 20.
- **Artifact path**: `./dist` (Vite default).
- ⚠️ **Do not change `base` in `vite.config.ts` without confirming with the user** — the live URL is `https://chan4lk.github.io/boring-games/`.

## Repo layout (high-level)

```
src/
├── App.tsx               # Tab switcher; picks which game is active
├── App.css, index.css    # Cross-game styles
├── main.tsx              # React entry
├── SnakeGame.tsx         # 2D Snake
├── RocketGame.tsx        # 2D Blasting Rockets
├── ContraGame.tsx        # 2D Contra-style
├── Contra3DGame.tsx      # Thin wrapper that imports contra-3d/index.tsx
├── game.ts               # Shared game utilities
├── contraLogic.ts        # 2D Contra helpers
├── rocketLogic.ts        # Rocket game helpers
└── contra-3d/            # Three.js + Howler.js game (see below)
```

## Contra 3D architecture (`src/contra-3d/`)

This is the largest module. Read `Game.ts` first — every subsystem is composed there via constructor injection.

```
contra-3d/
├── Game.ts            # Central orchestrator class; wires all subsystems
├── Engine.ts          # Three.js renderer/camera
├── SceneManager.ts    # Three.js scene lifecycle
├── InputManager.ts    # Keyboard + mouse + pointer → `keys` Set + `aimTarget` Vector3
├── EntityManager.ts   # Owns the entity collection
├── Physics.ts         # Collision detection
├── AudioManager.ts    # Single entry point for Howler.js
├── CheatSystem.ts     # Cheat code handling
├── LevelManager.ts    # Level progression
├── constants.ts       # Tunables (speeds, sizes, etc.)
├── types.ts           # Shared types (GameScreen, UIState, entity types)
├── index.tsx          # React mount; runs `new Game(container, { onStateChange })`
├── entities/          # Player, Enemy, boss entities
├── systems/           # PlayerSystem, EnemySystem, CombatSystem, PowerUpSystem, ParticleSystem
├── weapons/           # WeaponRegistry, BulletPatterns
├── levels/            # Level1..5 + LevelData
├── rendering/         # Effects, Environment, BossModels, post-processing, procedural textures
├── audio/             # music.ts, sfx.ts (Howl instances + playlist)
└── ui/                # React overlays: MainMenu, PauseMenu, GameOver, LevelComplete, HUD
```

**Data flow (fixed by design — don't change without user approval):**
- State flows **up**: subsystems call `callbacks.onStateChange(uiState)`; React stores it in `useState` and renders the right overlay.
- Actions flow **down**: `index.tsx` calls imperative methods on the `Game` instance (`startLevel`, `pause`, `resume`, `restart`, `quitToMenu`).
- The game runs in its own `requestAnimationFrame` loop managed by `Engine`. **Do not move per-frame state into React state** — it kills perf.

## Existing design docs

The user has been using a planning system. **Before starting non-trivial contra-3d work, read:**
- `docs/superpowers/plans/2026-04-26-contra-3d-overhaul.md`
- `docs/superpowers/specs/2026-04-26-contra-3d-professional-overhaul-design.md` (if present)
- `docs/superpowers/plans/2026-04-26-contra-3d-visual-overhaul.md`

These capture decisions the user has already made; don't relitigate them.

## Git / branch state

- **Main branch**: `main`. Conventional-commit style is in use (`feat:`, `fix:`).
- **Active worktree** at `.worktrees/contra-3d-visual-overhaul` — currently has uncommitted changes to many `src/contra-3d/` files plus several untracked rendering files. **Check `git status` in the main worktree before touching contra-3d code** — your changes may need to land on that worktree's branch, not `main`.

## What this project does **not** have

- **No automated tests** (no Jest, Vitest, Playwright, etc.). The closest thing to a "test" is `tsc -b` + `vite build`. If a task warrants tests, propose adding Vitest as a follow-up rather than baking it in ad-hoc.
- **No CSS framework** (no Tailwind, no MUI). Styles are hand-written CSS in `App.css` / `index.css` / per-component.
- **No state management library** (no Redux, Zustand, Jotai). Just React state + the imperative `Game` class.
- **No router** — `App.tsx` uses local `useState` for the active game tab.
- **No backend** — pure static SPA, everything is client-side.

## Commits

Match the existing style — see `git log --oneline` on `main`. Short imperative summary, optional scope, no body needed for small changes.
