import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createContraInitialState,
  stepContraGame,
  toggleContraPause,
  type ContraInput,
  type Direction,
} from './contraLogic'

const GRID_WIDTH = 22
const GRID_HEIGHT = 12
const TICK_MS = 110

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

const createInput = (): ContraInput => ({ move: null, shootHeld: false })

export default function ContraGame() {
  const [game, setGame] = useState(() =>
    createContraInitialState(GRID_WIDTH, GRID_HEIGHT)
  )
  const inputRef = useRef<ContraInput>(createInput())

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()

      if (event.code === 'Space' || key === ' ' || key === 'space') {
        event.preventDefault()
        inputRef.current.shootHeld = true
        return
      }

      if (key === 'p') {
        event.preventDefault()
        setGame((state) => toggleContraPause(state))
        return
      }

      if (key === 'r') {
        setGame(createContraInitialState(GRID_WIDTH, GRID_HEIGHT))
        return
      }

      const direction = keyToDirection[key]
      if (direction) {
        event.preventDefault()
        inputRef.current.move = direction
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (event.code === 'Space' || key === ' ' || key === 'space') {
        inputRef.current.shootHeld = false
        return
      }

      const direction = keyToDirection[key]
      if (direction && inputRef.current.move === direction) {
        inputRef.current.move = null
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useEffect(() => {
    if (game.status !== 'playing') {
      return
    }

    const interval = window.setInterval(() => {
      setGame((state) => stepContraGame(state, inputRef.current))
    }, TICK_MS)

    return () => window.clearInterval(interval)
  }, [game.status])

  const playerKey = `${game.player.x},${game.player.y}`
  const bulletMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const bullet of game.bullets) {
      map.set(`${bullet.x},${bullet.y}`, bullet.id)
    }
    return map
  }, [game.bullets])

  const enemyMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const enemy of game.enemies) {
      map.set(`${enemy.x},${enemy.y}`, enemy.id)
    }
    return map
  }, [game.enemies])

  const powerMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const power of game.powerUps) {
      map.set(`${power.x},${power.y}`, power.kind)
    }
    return map
  }, [game.powerUps])

  const cells = []
  for (let y = 0; y < game.gridHeight; y += 1) {
    for (let x = 0; x < game.gridWidth; x += 1) {
      const key = `${x},${y}`
      const isPlayer = key === playerKey
      const bulletId = bulletMap.get(key)
      const enemyId = enemyMap.get(key)
      const power = powerMap.get(key)

      const className = [
        'cell',
        'cell--contra',
        isPlayer ? 'cell--contra-player' : '',
        bulletId ? 'cell--contra-bullet' : '',
        enemyId ? 'cell--contra-enemy' : '',
        power ? 'cell--contra-power' : '',
        power === 'spread' ? 'cell--contra-power-spread' : '',
      ]
        .filter(Boolean)
        .join(' ')

      cells.push(<div key={key} className={className} />)
    }
  }

  const handleRestart = () => {
    setGame(createContraInitialState(GRID_WIDTH, GRID_HEIGHT))
  }

  const handleTogglePause = () => {
    setGame((state) => toggleContraPause(state))
  }

  const handleShootStart = () => {
    inputRef.current.shootHeld = true
  }

  const handleShootEnd = () => {
    inputRef.current.shootHeld = false
  }

  const handleMove = (direction: Direction | null) => {
    inputRef.current.move = direction
  }

  return (
    <main className="snake">
      <header className="snake__header">
        <div>
          <p className="snake__eyebrow">Contra</p>
          <h1>Side-scroll. Fire fast. Survive.</h1>
        </div>
        <div className="snake__stats">
          <div>
            <span>Score</span>
            <strong>{game.score}</strong>
          </div>
          <div>
            <span>Lives</span>
            <strong>{game.lives}</strong>
          </div>
          <div>
            <span>Spread</span>
            <strong>{game.upgrades.spread + 1}x</strong>
          </div>
          <div>
            <span>Fire Rate</span>
            <strong>{game.upgrades.fireRate + 1}x</strong>
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
          className="board board--contra"
          role="grid"
          aria-label="Contra game board"
          style={{ gridTemplateColumns: `repeat(${game.gridWidth}, 1fr)` }}
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
          <button
            onPointerDown={handleShootStart}
            onPointerUp={handleShootEnd}
            onPointerLeave={handleShootEnd}
          >
            Fire
          </button>
        </div>
        <div className="controls__pad controls__pad--wide">
          <button
            className="pad pad--up"
            onPointerDown={() => handleMove('up')}
            onPointerUp={() => handleMove(null)}
            aria-label="Move up"
          >
            ▲
          </button>
          <button
            className="pad pad--left"
            onPointerDown={() => handleMove('left')}
            onPointerUp={() => handleMove(null)}
            aria-label="Move left"
          >
            ◀
          </button>
          <button
            className="pad pad--down"
            onPointerDown={() => handleMove('down')}
            onPointerUp={() => handleMove(null)}
            aria-label="Move down"
          >
            ▼
          </button>
          <button
            className="pad pad--right"
            onPointerDown={() => handleMove('right')}
            onPointerUp={() => handleMove(null)}
            aria-label="Move right"
          >
            ▶
          </button>
        </div>
        <p className="snake__hint">
          Controls: Arrow keys/WASD to move, <code>Space</code> to fire,{' '}
          <code>P</code> to pause, <code>R</code> to restart.
        </p>
      </section>
    </main>
  )
}
