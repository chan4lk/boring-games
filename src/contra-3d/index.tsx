import { useEffect, useRef, useState, useCallback } from 'react'
import { Game } from './Game'
import { HUD } from './ui/HUD'
import { MainMenu } from './ui/MainMenu'
import { PauseMenu } from './ui/PauseMenu'
import { GameOver } from './ui/GameOver'
import { LevelComplete } from './ui/LevelComplete'
import type { UIState } from './types'

const initialUIState: UIState = {
  screen: 'menu', score: 0, lives: 3,
  health: 5, maxHealth: 5, weapon: 'machinegun',
  spreadLevel: 1, fireRateLevel: 1,
  currentLevel: 1, totalLevels: 0,
  bossHealth: 0, bossMaxHealth: 0,
  cheatActive: null,
}

export default function Contra3DGame() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Game | null>(null)
  const [ui, setUI] = useState<UIState>(initialUIState)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const game = new Game(container, { onStateChange: setUI })
    gameRef.current = game
    game.start()

    return () => {
      game.destroy()
      gameRef.current = null
    }
  }, [])

  const handleStart = useCallback(() => {
    gameRef.current?.startLevel(1)
  }, [])

  const handleResume = useCallback(() => {
    gameRef.current?.resume()
  }, [])

  const handleRestart = useCallback(() => {
    gameRef.current?.restart()
  }, [])

  const handleQuit = useCallback(() => {
    gameRef.current?.quitToMenu()
  }, [])

  const handleNextLevel = useCallback(() => {
    const nextLevel = (gameRef.current?.currentLevel ?? 0) + 1
    gameRef.current?.startLevel(nextLevel)
  }, [])

  const handleTogglePause = useCallback(() => {
    const game = gameRef.current
    if (!game) return
    if (game.screen === 'playing') game.pause()
    else if (game.screen === 'paused') game.resume()
  }, [])

  return (
    <main className="snake">
      <div ref={containerRef} style={{ width: '100%', height: 500, position: 'relative' }}>
        {ui.screen === 'playing' && <HUD {...ui} />}
        {ui.screen === 'menu' && <MainMenu onStart={handleStart} />}
        {(ui.screen === 'paused') && <PauseMenu onResume={handleResume} onRestart={handleRestart} onQuit={handleQuit} />}
        {ui.screen === 'gameover' && <GameOver score={ui.score} currentLevel={ui.currentLevel} onRestart={handleRestart} onQuit={handleQuit} />}
        {ui.screen === 'levelComplete' && (
          <LevelComplete score={ui.score} currentLevel={ui.currentLevel} totalLevels={ui.totalLevels} onNext={handleNextLevel} />
        )}
      </div>

      <section className="snake__controls">
        <div className="controls">
          {ui.screen === 'playing' && <button onClick={handleTogglePause}>Pause</button>}
          {ui.screen === 'paused' && <button onClick={handleResume}>Resume</button>}
          <button onClick={handleRestart}>Restart</button>
        </div>
        <p className="snake__hint">
          Controls: WASD to move, mouse to aim, click/hold to fire. Press <code>P</code> to pause, <code>R</code> to restart.
        </p>
      </section>
    </main>
  )
}
