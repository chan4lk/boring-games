# Contra 3D Visual Overhaul Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the current flat-shaded box-geometry prototype into a polished-looking 3D side-scroller with procedural textures, environment decorations, bloom effects, proper particle effects, screen shake, and per-level atmosphere.

**Architecture:** All visual improvements use procedurally generated assets (CanvasTexture for textures, Three.js primitives for decorations, sprite particles with canvas gradients). No external image files or 3D models needed. Three.js r183 addon imports for bloom post-processing.

**Tech Stack:** Three.js r183, Canvas API, Three.js addon post-processing (`three/addons/postprocessing/`).

---

### Task 1: Render Terrain from Level Config Data (CRITICAL)

**Files:**
- Modify: `src/contra-3d/rendering/Environment.ts` (add `buildTerrain`, update `clearTerrain`)
- Modify: `src/contra-3d/LevelManager.ts` (wire terrain building in `load()`)

**Note:** Level configs define terrain platforms but they are never rendered — the level is just a flat plane. This is a gameplay-breaking bug AND makes the game look empty.

- [ ] In `Environment.ts`, add `buildTerrain(segments)` method:
  - Creates `BoxGeometry(seg.width, Math.max(seg.height, 0.2), 0.5)` per segment
  - Uses `MeshStandardMaterial({ color: 0x4a3728 })` (brown earth)
  - Positions each at `(seg.x + seg.width/2, seg.height/2, 0)`
  - Pushes into `this.terrainMeshes` and adds to `this.scene`
- [ ] In `Environment.ts`, update `clearTerrain()` to also call `(m.material as THREE.Material).dispose()`
- [ ] In `LevelManager.load()`, after `setFloorColor()`, call:
  ```typescript
  this.game.environment.clearTerrain()
  this.game.environment.buildTerrain(config.terrain)
  ```
- [ ] Verify: Start game. Terrain blocks should appear as brown platforms at the positions from level configs. They scroll with the camera.

---

### Task 2: Procedural Textures via CanvasTexture

**Files:**
- Create: `src/contra-3d/rendering/ProceduralTextures.ts`
- Modify: `src/contra-3d/rendering/Environment.ts`

- [ ] Create `rendering/ProceduralTextures.ts` with module-level cached factories:

```typescript
import * as THREE from 'three'

let grassTex: THREE.CanvasTexture | null = null
let groundTex: THREE.CanvasTexture | null = null

export function getGrassTexture(): THREE.CanvasTexture {
  if (grassTex) return grassTex
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  // Dark green base
  ctx.fillStyle = '#2d4a3a'
  ctx.fillRect(0, 0, 256, 256)
  // Grass blade strokes
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 256
    const y = Math.random() * 256
    const shade = 60 + Math.random() * 80
    ctx.strokeStyle = `rgb(40, ${shade + 40}, 30)`
    ctx.lineWidth = 1 + Math.random() * 2
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + (Math.random() - 0.5) * 4, y - 2 - Math.random() * 6)
    ctx.stroke()
  }
  // Noise overlay
  const imageData = ctx.getImageData(0, 0, 256, 256)
  for (let i = 0; i < imageData.data.length; i += 8) {
    const offset = Math.floor((Math.random() - 0.5) * 16)
    imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + offset))
    imageData.data[i + 1] = Math.max(0, Math.min(255, imageData.data[i + 1] + offset))
  }
  ctx.putImageData(imageData, 0, 0)

  grassTex = new THREE.CanvasTexture(canvas)
  grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping
  grassTex.repeat.set(8, 2)
  grassTex.needsUpdate = true
  return grassTex
}

export function getGroundTexture(): THREE.CanvasTexture {
  if (groundTex) return groundTex
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  // Brown base
  ctx.fillStyle = '#4a3728'
  ctx.fillRect(0, 0, 256, 256)
  // Speckles
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * 256
    const y = Math.random() * 256
    const size = 2 + Math.random() * 6
    const v = 60 + Math.random() * 50
    ctx.fillStyle = `rgb(${v + 10}, ${v}, ${v - 20})`
    ctx.beginPath()
    ctx.ellipse(x, y, size / 2, size / 4, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  groundTex = new THREE.CanvasTexture(canvas)
  groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping
  groundTex.repeat.set(4, 1)
  groundTex.needsUpdate = true
  return groundTex
}
```

- [ ] In `Environment.ts`:
  - Import `getGrassTexture()` and `getGroundTexture()`
  - In `createFloor()`: add `map: getGrassTexture()` to floor material
  - In `buildTerrain()`: add `map: getGroundTexture()` to terrain segment material
  - Tint: after applying texture, set `material.color` to the level's `groundColor` parsed as hex — the texture provides detail, the color provides the level theme tint

---

### Task 3: Environment Decorations (Trees, Rocks, Crates)

**Files:**
- Create: `src/contra-3d/rendering/EnvironmentDecorations.ts`
- Modify: `src/contra-3d/types.ts`
- Modify: `src/contra-3d/rendering/Environment.ts`
- Modify: `src/contra-3d/LevelManager.ts`
- Modify: `src/contra-3d/levels/Level1.ts` through `Level5.ts`

- [ ] In `types.ts`, add to `LevelConfig`:
  ```typescript
  decorations?: { type: 'tree' | 'rock' | 'crate'; x: number; y: number; scale?: number }[]
  ```

- [ ] Create `rendering/EnvironmentDecorations.ts`:
  - `createTree(pos, scale)`: `CylinderGeometry(0.08, 0.12, 0.6)` trunk (brown), 2-3 `ConeGeometry(0.3, 0.4)` stacked for foliage (green shades), slight random rotation
  - `createRock(pos, scale)`: `DodecahedronGeometry(0.2 * scale)`, gray `MeshStandardMaterial({ flatShading: true, roughness: 0.9 })`, randomized non-uniform scale
  - `createCrate(pos, scale)`: `BoxGeometry(0.3, 0.3, 0.3)` (brown) + `EdgesGeometry` wireframe (dark lines)
  - Each returns `THREE.Group | THREE.Mesh`

- [ ] In `Environment.ts`:
  - Add `private decorations: THREE.Object3D[] = []`
  - Add `buildDecorations(decorations)` — iterates array, calls factory, adds to scene and `decorations` array
  - Add `clearDecorations()` — removes from scene, disposes geometry/material

- [ ] In `LevelManager.load()`, after `buildTerrain()`:
  ```typescript
  this.game.environment.clearDecorations()
  this.game.environment.buildDecorations(config.decorations ?? [])
  ```

- [ ] Add `decorations` arrays to each level (10-20 per level):
  - **Level 1 (Jungle)**: ~15 trees, ~5 rocks — dense foliage feel
  - **Level 2 (Military Base)**: ~10 crates, ~5 rocks — industrial
  - **Level 3 (Waterfall)**: ~10 trees, ~8 rocks — natural mix
  - **Level 4 (Alien Hive)**: ~15 rock variants (different colors, purple tint) — alien terrain
  - **Level 5 (Final Fortress)**: ~8 crates, ~8 rocks — fortified

- [ ] In `Game.ts`, call `this.environment.clearDecorations()` in `restart()` and `quitToMenu()` (these already call `this.scene.reset()` which wipes the scene, but the `decorations` array in Environment becomes stale since the meshes are removed by `scene.reset()` but still referenced in the array)

---

### Task 4: Per-Level Fog and Sky Colors

**Files:**
- Modify: `src/contra-3d/SceneManager.ts`
- Modify: `src/contra-3d/LevelManager.ts`

- [ ] In `SceneManager.ts`, add method:
  ```typescript
  setAtmosphere(fogColor: string, fogNear: number, fogFar: number, skyColor: string): void {
    this.scene.fog = new THREE.Fog(
      parseInt(fogColor.replace('#', ''), 16),
      fogNear,
      fogFar
    )
    this.renderer.setClearColor(parseInt(skyColor.replace('#', ''), 16))
  }
  ```
  - **Important:** Reassign `this.scene.fog` rather than mutating, to avoid stale object issues

- [ ] In `LevelManager.load()`, after creating background layers and before floor setup:
  ```typescript
  const bg = config.background
  this.game.scene.setAtmosphere(bg.fogColor, bg.fogNear, bg.fogFar, bg.skyColor)
  ```

- [ ] Verify each level has distinct atmosphere (green for L1 Jungle, gray for L2 Base, dark green for L3 Waterfall, purple for L4 Hive, red for L5 Fortress)

---

### Task 5: Bloom Post-Processing

**Files:**
- Create: `src/contra-3d/rendering/PostProcessingManager.ts`
- Modify: `src/contra-3d/SceneManager.ts`
- Modify: `src/contra-3d/Game.ts`

- [ ] Create `rendering/PostProcessingManager.ts`:
  ```typescript
  import { EffectComposer } from 'three/addons/postprocessing/EffectComposer'
  import { RenderPass } from 'three/addons/postprocessing/RenderPass'
  import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass'
  import { OutputPass } from 'three/addons/postprocessing/OutputPass'
  import * as THREE from 'three'

  export class PostProcessingManager {
    private composer: EffectComposer
    private bloomPass: UnrealBloomPass

    constructor(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
      this.composer = new EffectComposer(renderer)
      this.composer.addPass(new RenderPass(scene, camera))
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(renderer.domElement.width, renderer.domElement.height),
        0.3,   // strength
        0.2,   // radius
        0.8    // threshold
      )
      this.composer.addPass(this.bloomPass)
      this.composer.addPass(new OutputPass())
    }

    render(delta: number): void {
      this.composer.render(delta)
    }

    setBloom(threshold: number, strength: number, radius: number): void {
      this.bloomPass.threshold = threshold
      this.bloomPass.strength = strength
      this.bloomPass.radius = radius
    }

    resize(width: number, height: number): void {
      this.composer.setSize(width, height)
    }

    dispose(): void {
      this.composer.dispose()
    }
  }
  ```

- [ ] In `SceneManager.ts`:
  - Import `PostProcessingManager`
  - Add `readonly postProcessing: PostProcessingManager` property
  - In constructor, after creating renderer: `this.postProcessing = new PostProcessingManager(this.scene, this.camera, this.renderer)`
  - Replace `render()` with `render(delta: number = 0): void` that calls `this.postProcessing.render(delta)` instead of `this.renderer.render(this.scene, this.camera)`
  - In `destroy()`, call `this.postProcessing.dispose()`
  - In resize handler, call `this.postProcessing.resize()`

- [ ] In `Game.ts`, change `this.scene.render()` to `this.scene.render(delta)`:

- [ ] Verify: Bullets (emissive materials) now have a soft glow. Powerups (emissive icosahedrons) glow. Explosions bloom. The bloom threshold (0.8) ensures only bright/emissive surfaces are affected.

---

### Task 6: Wire Screen Shake to Game Events

**Files:**
- Modify: `src/contra-3d/systems/CombatSystem.ts`

- [ ] In `CombatSystem.ts`, the class already has access to `this.game.effects`:
  - On enemy death (when `enemy.health <= 0`): `this.game.effects.shake(0.15, 0.3)`
  - On player hit (when player takes damage, in the `player.invincibleUntil` block): `this.game.effects.shake(0.3, 0.5)`
  - On player death (when player health hits 0): `this.game.effects.shake(0.5, 0.8)`

- [ ] In `ParticleSystem.ts`:
  - Add optional `effects?: Effects` property
  - Add `setEffects(effects: Effects): void` method
  - In `explode()`, if `this.effects` is set: `this.effects.shake(0.2, 0.25)`
  - In `Game.ts`, pass effects: `this.particles.setEffects(this.effects)`

- [ ] Verify: Kill an enemy — subtle shake. Player hit — stronger shake. Explosion — medium shake.

---

### Task 7: Sprite-Based Particles (Replace BoxGeometry)

**Files:**
- Create: `src/contra-3d/rendering/ParticleTextures.ts`
- Modify: `src/contra-3d/systems/ParticleSystem.ts`

- [ ] Create `rendering/ParticleTextures.ts` with canvas textures:
  - `getExplosionTexture()`: 64x64 canvas, `radialGradient` white center → orange middle → transparent edge
  - `getSparkTexture()`: 32x32 canvas, `radialGradient` white center → yellow edge → transparent
  - `getSmokeTexture()`: 64x64 canvas, `radialGradient` `rgba(100,100,100,0.6)` center → transparent edge
  - Each uses `needsUpdate = true`, cached as module-level singletons

- [ ] Rewrite `ParticleSystem.ts`:
  - Change particle type from `{ mesh: THREE.Mesh, ... }` to `{ sprite: THREE.Sprite, velocity: { x: number; y: number }, ttl: number, maxTtl: number }`
  - Create `SpriteMaterial` for each particle type: `AdditiveBlending`, `depthWrite: false`, `transparent: true`
  - `explode(position, count)`: Create sprites with explosion sprite material, random velocity, size 0.2-0.6. Shrink over lifetime.
  - `hitSpark(position)`: Create sprites with spark material, size 0.1-0.15, fast velocity, short TTL (0.2s).
  - Add `emitSmoke(position, count)`: Smoke sprites that drift upward and expand over time (scale up), longer TTL (1-2s).
  - Call `emitSmoke` at end of `explode()` for 5-8 smoke particles.
  - In `update(delta)`: Update sprite position, scale, and opacity. Fade out for smoke, shrink for explosions. Remove and dispose when TTL expires.

---

### Task 8: Hit Flash on Enemies

**Files:**
- Modify: `src/contra-3d/systems/CombatSystem.ts`

- [ ] In `CombatSystem.ts`:
  - Add `private enemyFlashTimers: Map<number, number> = new Map()`
  - In `handleBulletHits()` (or wherever `enemy.health -= damage` happens), add: `this.enemyFlashTimers.set(enemy.id, 0.15)`
  - In `update()`, after `handleBulletHits`, iterate flash timers:
    - When timer starts: traverse enemy mesh children, store original color in `userData.originalColor`, set material color to white
    - While timer > 0: decrement by delta
    - When timer expires: traverse children, restore color from `userData.originalColor`, delete stored data

---

### Task 9: Player Model Polish and Idle Animations

**Files:**
- Modify: `src/contra-3d/entities/Player.ts`
- Modify: `src/contra-3d/systems/PlayerSystem.ts`

- [ ] In `createPlayerMesh()`:
  - Change legs: Use `CylinderGeometry(0.15, 0.18, 0.55)` instead of `BoxGeometry`
  - Change arms: Use `CylinderGeometry(0.1, 0.12, 0.5)` instead of `BoxGeometry`
  - Add shoulder pads: small sphere/box segments on each shoulder
  - Add boots: `BoxGeometry(0.2, 0.1, 0.2)` in dark color at bottom of each leg
  - Split gun: body (main box) + barrel (thin cylinder at front)
  - Add emissive strip on gun barrel
  - Store leg/arm refs in `group.userData` (e.g., `group.userData.leftLeg = leftLeg`)

- [ ] In `PlayerSystem.update()`:
  - Idle breathing bob: `player.mesh.position.y += Math.sin(time * 4) * 0.008`
  - Leg swing on movement: `Math.sin(time * 12) * 0.3` rotation on leg X axis (if refs are available in userData)
  - Gun sway: subtle rotation offset based on aim direction

---

### Task 10: Lighting and Shadows

**Files:**
- Modify: `src/contra-3d/SceneManager.ts`
- Modify: `src/contra-3d/entities/Player.ts`
- Modify: `src/contra-3d/entities/Enemy.ts`
- Modify: `src/contra-3d/rendering/BossModels.ts`
- Modify: `src/contra-3d/rendering/Environment.ts`

- [ ] In `SceneManager.ts`:
  - Reduce ambient light from 0.6 to 0.3
  - Add `new THREE.HemisphereLight(0x87ceeb, 0x3a2a1a, 0.5)` — sky blue above, warm brown below
  - Add rim light: `new THREE.DirectionalLight(0xffffff, 0.6)` at `(-8, 6, -10)`
  - Tweak main directional: move to `(4, 8, 6)` for more dramatic angle
  - Enable shadows:
    ```typescript
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    dirLight.castShadow = true
    // shadow camera config
    dirLight.shadow.mapSize.width = 1024
    dirLight.shadow.mapSize.height = 1024
    dirLight.shadow.camera.near = 0.5
    dirLight.shadow.camera.far = 30
    dirLight.shadow.camera.left = -15
    dirLight.shadow.camera.right = 15
    dirLight.shadow.camera.top = 15
    dirLight.shadow.camera.bottom = -15
    ```

- [ ] In `Player.ts`: Set mesh children to `castShadow = true` via `group.traverse()`
- [ ] In `Enemy.ts`: Set mesh children to `castShadow = true`
- [ ] In `BossModels.ts`: Set mesh children to `castShadow = true`
- [ ] In `Environment.ts`: Set floor and terrain to `receiveShadow = true`

- [ ] **Material improvements:**
  - In `Player.ts`: Set `bodyMat.roughness = 0.6`, `armorMat.roughness = 0.4, armorMat.metalness = 0.3`, `gunMat.roughness = 0.3, gunMat.metalness = 0.7`
  - In `Enemy.ts`: Add `roughness` to primary material, `roughness + metalness` to armor material

---

### Verification

1. Start dev server: `npm run dev`
2. Open http://localhost:5173/boring-games/
3. Click "Contra 3D" tab
4. Click "START GAME"
5. Check: Terrain platforms are visible as textured brown blocks
6. Check: Ground has grass texture
7. Check: Trees, rocks, and crates appear along the level
8. Check: Fog color differs per level (especially L4 purple, L5 red)
9. Check: Bullets glow (bloom on emissive materials)
10. Check: Screen shakes on explosions and hits
11. Check: Particles are soft sprites, not hard boxes
12. Check: Enemies flash white when shot
13. Check: Player has cylinder limbs, subtle bob animation
14. Check: Better lighting with shadows, hemisphere color variation
