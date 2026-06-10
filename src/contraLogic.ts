export type Point = {
  x: number
  y: number
}

export type Direction = 'up' | 'down' | 'left' | 'right'

export type GameStatus = 'playing' | 'paused' | 'gameover'

export type ContraInput = {
  move: Direction | null
  shootHeld: boolean
}

export type Bullet = Point & { id: number }
export type Enemy = Point & { id: number }
export type PowerUp = Point & { id: number; kind: 'spread' | 'rate' }

export type ContraState = {
  gridWidth: number
  gridHeight: number
  player: Point
  bullets: Bullet[]
  enemies: Enemy[]
  powerUps: PowerUp[]
  score: number
  lives: number
  status: GameStatus
  tick: number
  cooldown: number
  upgrades: {
    spread: number
    fireRate: number
  }
  invulnerableTicks: number
  nextId: number
}

const directionVectors: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

export function createContraInitialState(
  gridWidth: number,
  gridHeight: number
): ContraState {
  return {
    gridWidth,
    gridHeight,
    player: { x: 2, y: Math.floor(gridHeight / 2) },
    bullets: [],
    enemies: [],
    powerUps: [],
    score: 0,
    lives: 3,
    status: 'playing',
    tick: 0,
    cooldown: 0,
    upgrades: { spread: 0, fireRate: 0 },
    invulnerableTicks: 0,
    nextId: 1,
  }
}

export function toggleContraPause(state: ContraState): ContraState {
  if (state.status === 'gameover') {
    return state
  }

  return {
    ...state,
    status: state.status === 'paused' ? 'playing' : 'paused',
  }
}

export function stepContraGame(
  state: ContraState,
  input: ContraInput,
  rng: () => number = Math.random
): ContraState {
  if (state.status !== 'playing') {
    return state
  }

  const prevBullets = state.bullets
  const prevEnemies = state.enemies

  let nextState: ContraState = {
    ...state,
    tick: state.tick + 1,
    cooldown: Math.max(0, state.cooldown - 1),
    invulnerableTicks: Math.max(0, state.invulnerableTicks - 1),
  }

  nextState = applyMovement(nextState, input)
  nextState = applyShooting(nextState, input)
  nextState = moveBullets(nextState)
  nextState = moveEnemies(nextState)
  nextState = movePowerUps(nextState)
  nextState = resolveCollisions(nextState, prevBullets, prevEnemies)

  if (nextState.status === 'gameover') {
    return nextState
  }

  return spawnEntities(nextState, rng)
}

function applyMovement(state: ContraState, input: ContraInput): ContraState {
  if (!input.move) {
    return state
  }

  const vector = directionVectors[input.move]
  const next = {
    x: clamp(state.player.x + vector.x, 0, state.gridWidth - 1),
    y: clamp(state.player.y + vector.y, 0, state.gridHeight - 1),
  }

  return { ...state, player: next }
}

function applyShooting(state: ContraState, input: ContraInput): ContraState {
  if (!input.shootHeld || state.cooldown > 0) {
    return state
  }

  const spreadOffsets = getSpreadOffsets(state.upgrades.spread)
  const bullets: Bullet[] = []
  let nextId = state.nextId

  for (const offset of spreadOffsets) {
    const y = state.player.y + offset
    if (y < 0 || y >= state.gridHeight) {
      continue
    }
    bullets.push({ id: nextId, x: state.player.x + 1, y })
    nextId += 1
  }

  const cooldown = getCooldown(state.upgrades.fireRate)

  return {
    ...state,
    bullets: [...state.bullets, ...bullets],
    cooldown,
    nextId,
  }
}

function moveBullets(state: ContraState): ContraState {
  const bullets = state.bullets
    .map((bullet) => ({ ...bullet, x: bullet.x + 1 }))
    .filter((bullet) => bullet.x < state.gridWidth)

  return { ...state, bullets }
}

function moveEnemies(state: ContraState): ContraState {
  const enemies = state.enemies.map((enemy) => ({ ...enemy, x: enemy.x - 1 }))

  let lives = state.lives
  let status = state.status
  let invulnerableTicks = state.invulnerableTicks

  if (invulnerableTicks === 0) {
    for (const enemy of enemies) {
      if (enemy.x === state.player.x && enemy.y === state.player.y) {
        lives -= 1
        invulnerableTicks = 12
        break
      }
    }
  }

  if (lives <= 0) {
    status = 'gameover'
  }

  return {
    ...state,
    enemies: enemies.filter((enemy) => enemy.x >= 0),
    lives,
    status,
    invulnerableTicks,
  }
}

function movePowerUps(state: ContraState): ContraState {
  const powerUps = state.powerUps
    .map((power) => ({ ...power, x: power.x - 1 }))
    .filter((power) => power.x >= 0)

  return { ...state, powerUps }
}

function resolveCollisions(
  state: ContraState,
  prevBullets: Bullet[],
  prevEnemies: Enemy[]
): ContraState {
  const bulletMap = new Map<string, Bullet>()
  for (const bullet of state.bullets) {
    bulletMap.set(`${bullet.x},${bullet.y}`, bullet)
  }

  const prevBulletMap = new Map<string, number>()
  for (const bullet of prevBullets) {
    prevBulletMap.set(`${bullet.x},${bullet.y}`, bullet.id)
  }

  const removedBullets = new Set<number>()
  const removedEnemies = new Set<number>()
  let score = state.score

  for (const enemy of state.enemies) {
    const key = `${enemy.x},${enemy.y}`
    const bullet = bulletMap.get(key)
    if (bullet) {
      removedBullets.add(bullet.id)
      removedEnemies.add(enemy.id)
      score += 15
    }
  }

  for (const enemy of prevEnemies) {
    const bulletId = prevBulletMap.get(`${enemy.x - 1},${enemy.y}`)
    if (bulletId !== undefined) {
      removedBullets.add(bulletId)
      removedEnemies.add(enemy.id)
      score += 15
    }
  }

  const bullets = state.bullets.filter(
    (bullet) => !removedBullets.has(bullet.id)
  )
  const enemies = state.enemies.filter(
    (enemy) => !removedEnemies.has(enemy.id)
  )

  let powerUps = [...state.powerUps]
  const upgrades = { ...state.upgrades }

  powerUps = powerUps.filter((power) => {
    if (power.x === state.player.x && power.y === state.player.y) {
      score += 8
      if (power.kind === 'spread') {
        upgrades.spread = Math.min(2, upgrades.spread + 1)
      } else {
        upgrades.fireRate = Math.min(2, upgrades.fireRate + 1)
      }
      return false
    }
    return true
  })

  return {
    ...state,
    enemies,
    bullets,
    powerUps,
    score,
    upgrades,
  }
}

function spawnEntities(state: ContraState, rng: () => number): ContraState {
  let { enemies, powerUps, nextId } = state

  const spawnChance = 0.2
  const powerChance = 0.045

  if (rng() < spawnChance) {
    enemies = [
      ...enemies,
      {
        id: nextId,
        x: state.gridWidth - 1,
        y: Math.floor(rng() * state.gridHeight),
      },
    ]
    nextId += 1
  }

  if (rng() < powerChance) {
    powerUps = [
      ...powerUps,
      {
        id: nextId,
        x: state.gridWidth - 1,
        y: Math.floor(rng() * state.gridHeight),
        kind: rng() < 0.5 ? 'spread' : 'rate',
      },
    ]
    nextId += 1
  }

  return { ...state, enemies, powerUps, nextId }
}

function getSpreadOffsets(spread: number) {
  if (spread === 0) {
    return [0]
  }
  if (spread === 1) {
    return [-1, 0, 1]
  }
  return [-2, -1, 0, 1, 2]
}

function getCooldown(fireRate: number) {
  return Math.max(2, 6 - fireRate * 2)
}
