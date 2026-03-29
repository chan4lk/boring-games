import { useEffect, useMemo, useState } from 'react'
import {
  createInitialState,
  queueDirection,
  stepGame,
  togglePause,
  type Direction,
} from './game'

const GRID_SIZE = 20
const TICK_MS = 120

const keyToDirection: Record<string, Direction> = {
  arrowup: 'up',
  w: 'up',
  arrowdown: 'down',
  s: 'down',
  arrowleft: 'left',
  a: 'left',
  arrowright: 'right',
  d: 'right',
}

export default function SnakeGame() {
  const [game, setGame] = useState(() => createInitialState(GRID_SIZE))

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()

      if (key === ' ') {
        event.preventDefault()
        setGame((state) => togglePause(state))
        return
      }

      if (key === 'r') {
        setGame(createInitialState(GRID_SIZE))
        return
      }

      const direction = keyToDirection[key]
      if (direction) {
        event.preventDefault()
        setGame((state) => queueDirection(state, direction))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (game.status !== 'playing') {
      return
    }

    const interval = window.setInterval(() => {
      setGame((state) => stepGame(state))
    }, TICK_MS)

    return () => window.clearInterval(interval)
  }, [game.status])

  const snakeSet = useMemo(() => {
    return new Set(game.snake.map((segment) => `${segment.x},${segment.y}`))
  }, [game.snake])

  const headKey = `${game.snake[0].x},${game.snake[0].y}`
  const foodKey = `${game.food.x},${game.food.y}`

  const cells = []
  for (let y = 0; y < game.gridSize; y += 1) {
    for (let x = 0; x < game.gridSize; x += 1) {
      const key = `${x},${y}`
      const isSnake = snakeSet.has(key)
      const isHead = key === headKey
      const isFood = key === foodKey

      const className = [
        'cell',
        isSnake ? 'cell--snake' : '',
        isHead ? 'cell--head' : '',
        isFood ? 'cell--food' : '',
      ]
        .filter(Boolean)
        .join(' ')

      cells.push(<div key={key} className={className} />)
    }
  }

  const handleDirection = (direction: Direction) => {
    setGame((state) => queueDirection(state, direction))
  }

  const handleRestart = () => {
    setGame(createInitialState(GRID_SIZE))
  }

  const handleTogglePause = () => {
    setGame((state) => togglePause(state))
  }

  return (
    <main className="snake">
      <header className="snake__header">
        <div>
          <p className="snake__eyebrow">Classic Snake</p>
          <h1>Stay alive. Eat. Grow.</h1>
        </div>
        <div className="snake__stats">
          <div>
            <span>Score</span>
            <strong>{game.score}</strong>
          </div>
          <div>
            <span>Length</span>
            <strong>{game.snake.length}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>
              {game.status === 'playing'
                ? 'Running'
                : game.status === 'paused'
                  ? 'Paused'
                  : 'Game Over'}
            </strong>
          </div>
        </div>
      </header>

      <section className="snake__board">
        <div
          className="board"
          role="grid"
          aria-label="Snake game board"
          style={{ gridTemplateColumns: `repeat(${game.gridSize}, 1fr)` }}
        >
          {cells}
        </div>
        {game.status === 'gameover' && (
          <div className="board__overlay" role="status">
            <p>Game Over</p>
            <button onClick={handleRestart}>Restart</button>
          </div>
        )}
      </section>

      <section className="snake__controls">
        <div className="controls">
          <button onClick={handleTogglePause}>
            {game.status === 'paused' ? 'Resume' : 'Pause'}
          </button>
          <button onClick={handleRestart}>Restart</button>
        </div>
        <div className="controls__pad">
          <button
            className="pad pad--up"
            onPointerDown={() => handleDirection('up')}
            aria-label="Move up"
          >
            ▲
          </button>
          <button
            className="pad pad--left"
            onPointerDown={() => handleDirection('left')}
            aria-label="Move left"
          >
            ◀
          </button>
          <button
            className="pad pad--down"
            onPointerDown={() => handleDirection('down')}
            aria-label="Move down"
          >
            ▼
          </button>
          <button
            className="pad pad--right"
            onPointerDown={() => handleDirection('right')}
            aria-label="Move right"
          >
            ▶
          </button>
        </div>
        <p className="snake__hint">
          Controls: Arrow keys or WASD. Press <code>Space</code> to pause,{' '}
          <code>R</code> to restart.
        </p>
      </section>
    </main>
  )
}
