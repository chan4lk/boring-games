export type Point = {
  x: number
  y: number
}

export type Direction = 'up' | 'down' | 'left' | 'right'

export type GameStatus = 'playing' | 'paused' | 'gameover'

export type RocketInput = {
  move: Direction | null
  shootHeld: boolean
}

export type Bullet = Point & { id: number }
export type Enemy = Point & { id: number }
export type Reward = Point & { id: number; kind: 'spread' | 'speed' }

export type GameState = {
  gridWidth: number
  gridHeight: number
  player: Point
  bullets: Bullet[]
  enemies: Enemy[]
  rewards: Reward[]
  score: number
  status: GameStatus
  tick: number
  cooldown: number
  upgrades: {
    spread: number
    fireRate: number
  }
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

export function createRocketInitialState(
  gridWidth: number,
  gridHeight: number
): GameState {
  return {
    gridWidth,
    gridHeight,
    player: { x: Math.floor(gridWidth / 2), y: gridHeight - 2 },
    bullets: [],
    enemies: [],
    rewards: [],
    score: 0,
    status: 'playing',
    tick: 0,
    cooldown: 0,
    upgrades: { spread: 0, fireRate: 0 },
    nextId: 1,
  }
}

export function toggleRocketPause(state: GameState): GameState {
  if (state.status === 'gameover') {
    return state
  }

  return {
    ...state,
    status: state.status === 'paused' ? 'playing' : 'paused',
  }
}

export function stepRocketGame(
  state: GameState,
  input: RocketInput,
  rng: () => number = Math.random
): GameState {
  if (state.status !== 'playing') {
    return state
  }

  const prevBullets = state.bullets
  const prevEnemies = state.enemies

  let nextState: GameState = {
    ...state,
    tick: state.tick + 1,
    cooldown: Math.max(0, state.cooldown - 1),
  }

  nextState = applyMovement(nextState, input)
  nextState = applyShooting(nextState, input)
  nextState = moveBullets(nextState)
  nextState = moveEnemies(nextState)
  nextState = moveRewards(nextState)
  nextState = resolveCollisions(nextState, prevBullets, prevEnemies)

  if (nextState.status === 'gameover') {
    return nextState
  }

  return spawnEntities(nextState, rng)
}

function applyMovement(state: GameState, input: RocketInput): GameState {
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

function applyShooting(state: GameState, input: RocketInput): GameState {
  if (!input.shootHeld || state.cooldown > 0) {
    return state
  }

  const spreadOffsets = getSpreadOffsets(state.upgrades.spread)
  const bullets: Bullet[] = []
  let nextId = state.nextId

  for (const offset of spreadOffsets) {
    const x = state.player.x + offset
    if (x < 0 || x >= state.gridWidth) {
      continue
    }
    bullets.push({ id: nextId, x, y: state.player.y - 1 })
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

function moveBullets(state: GameState): GameState {
  const bullets = state.bullets
    .map((bullet) => ({ ...bullet, y: bullet.y - 1 }))
    .filter((bullet) => bullet.y >= 0)

  return { ...state, bullets }
}

function moveEnemies(state: GameState): GameState {
  const enemies = state.enemies.map((enemy) => ({ ...enemy, y: enemy.y + 1 }))

  for (const enemy of enemies) {
    if (enemy.x === state.player.x && enemy.y === state.player.y) {
      return { ...state, enemies, status: 'gameover' }
    }
  }

  return {
    ...state,
    enemies: enemies.filter((enemy) => enemy.y < state.gridHeight),
  }
}

function moveRewards(state: GameState): GameState {
  const rewards = state.rewards
    .map((reward) => ({ ...reward, y: reward.y + 1 }))
    .filter((reward) => reward.y < state.gridHeight)

  return { ...state, rewards }
}

function resolveCollisions(
  state: GameState,
  prevBullets: Bullet[],
  prevEnemies: Enemy[]
): GameState {
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
      score += 10
    }
  }

  for (const enemy of prevEnemies) {
    const bulletId = prevBulletMap.get(`${enemy.x},${enemy.y + 1}`)
    if (bulletId !== undefined) {
      removedBullets.add(bulletId)
      removedEnemies.add(enemy.id)
      score += 10
    }
  }

  const bullets = state.bullets.filter(
    (bullet) => !removedBullets.has(bullet.id)
  )
  const enemies = state.enemies.filter(
    (enemy) => !removedEnemies.has(enemy.id)
  )

  let rewards = [...state.rewards]
  let upgrades = { ...state.upgrades }

  rewards = rewards.filter((reward) => {
    if (reward.x === state.player.x && reward.y === state.player.y) {
      score += 5
      if (reward.kind === 'spread') {
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
    rewards,
    score,
    upgrades,
  }
}

function spawnEntities(state: GameState, rng: () => number): GameState {
  let { enemies, rewards, nextId } = state

  const spawnChance = 0.18
  const rewardChance = 0.04

  if (rng() < spawnChance) {
    enemies = [
      ...enemies,
      { id: nextId, x: Math.floor(rng() * state.gridWidth), y: 0 },
    ]
    nextId += 1
  }

  if (rng() < rewardChance) {
    rewards = [
      ...rewards,
      {
        id: nextId,
        x: Math.floor(rng() * state.gridWidth),
        y: 0,
        kind: rng() < 0.5 ? 'spread' : 'speed',
      },
    ]
    nextId += 1
  }

  return { ...state, enemies, rewards, nextId }
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
