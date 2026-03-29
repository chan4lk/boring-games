import { useState } from 'react'
import SnakeGame from './SnakeGame.tsx'
import RocketGame from './RocketGame.tsx'
import './App.css'

type GameType = 'snake' | 'rockets'

const gameLabels: Record<GameType, string> = {
  snake: 'Snake',
  rockets: 'Blasting Rockets',
}

function App() {
  const [activeGame, setActiveGame] = useState<GameType>('snake')

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <p className="app__eyebrow">Mini Arcade</p>
          <h1>Pick a game</h1>
        </div>
        <nav className="app__tabs" aria-label="Game selection">
          {(Object.keys(gameLabels) as GameType[]).map((key) => (
            <button
              key={key}
              className={
                activeGame === key ? 'tab tab--active' : 'tab tab--inactive'
              }
              onClick={() => setActiveGame(key)}
            >
              {gameLabels[key]}
            </button>
          ))}
        </nav>
      </header>
      {activeGame === 'snake' ? <SnakeGame /> : <RocketGame />}
    </div>
  )
}

export default App
