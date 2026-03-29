export type Point = {
  x: number
  y: number
}

export type Direction = 'up' | 'down' | 'left' | 'right'

export type GameStatus = 'playing' | 'paused' | 'gameover'

export type GameState = {
  gridSize: number
  snake: Point[]
  direction: Direction
  queuedDirection: Direction
  food: Point
  score: number
  status: GameStatus
}

const directionVectors: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const oppositeDirection: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

const pointKey = (point: Point) => `${point.x},${point.y}`

export function createInitialState(
  gridSize: number,
  rng: () => number = Math.random
): GameState {
  const middle = Math.floor(gridSize / 2)
  const snake: Point[] = [
    { x: middle + 1, y: middle },
    { x: middle, y: middle },
    { x: middle - 1, y: middle },
  ]

  return {
    gridSize,
    snake,
    direction: 'right',
    queuedDirection: 'right',
    food: placeFood(snake, gridSize, rng),
    score: 0,
    status: 'playing',
  }
}

export function queueDirection(state: GameState, next: Direction): GameState {
  if (state.status !== 'playing') {
    return state
  }

  if (oppositeDirection[state.direction] === next) {
    return state
  }

  return { ...state, queuedDirection: next }
}

export function togglePause(state: GameState): GameState {
  if (state.status === 'gameover') {
    return state
  }

  return {
    ...state,
    status: state.status === 'paused' ? 'playing' : 'paused',
  }
}

export function stepGame(
  state: GameState,
  rng: () => number = Math.random
): GameState {
  if (state.status !== 'playing') {
    return state
  }

  const direction = state.queuedDirection
  const vector = directionVectors[direction]
  const head = state.snake[0]
  const next: Point = { x: head.x + vector.x, y: head.y + vector.y }

  if (!isInside(next, state.gridSize)) {
    return { ...state, direction, status: 'gameover' }
  }

  const snakeSet = new Set(state.snake.map(pointKey))
  if (snakeSet.has(pointKey(next))) {
    return { ...state, direction, status: 'gameover' }
  }

  const ateFood = next.x === state.food.x && next.y === state.food.y
  const nextSnake = [next, ...state.snake]

  if (!ateFood) {
    nextSnake.pop()
  }

  const food = ateFood ? placeFood(nextSnake, state.gridSize, rng) : state.food
  const score = ateFood ? state.score + 1 : state.score

  return {
    ...state,
    snake: nextSnake,
    direction,
    queuedDirection: direction,
    food,
    score,
  }
}

export function placeFood(
  snake: Point[],
  gridSize: number,
  rng: () => number = Math.random
): Point {
  const occupied = new Set(snake.map(pointKey))
  const empty: Point[] = []

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const key = `${x},${y}`
      if (!occupied.has(key)) {
        empty.push({ x, y })
      }
    }
  }

  if (empty.length === 0) {
    return { x: 0, y: 0 }
  }

  const index = Math.floor(rng() * empty.length)
  return empty[index]
}

function isInside(point: Point, gridSize: number) {
  return (
    point.x >= 0 &&
    point.x < gridSize &&
    point.y >= 0 &&
    point.y < gridSize
  )
}
