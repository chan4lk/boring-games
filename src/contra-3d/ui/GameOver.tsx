type GameOverProps = {
  score: number
  currentLevel: number
  onRestart: () => void
  onQuit: () => void
}

export function GameOver({ score, currentLevel, onRestart, onQuit }: GameOverProps) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      background: 'rgba(0,0,0,0.8)', fontFamily: 'monospace', color: '#fff',
      zIndex: 10,
    }}>
      <h2 style={{ fontSize: 36, color: '#ef4444', margin: 0 }}>GAME OVER</h2>
      <p style={{ fontSize: 20, marginTop: 16 }}>Score: {score.toLocaleString()}</p>
      <p style={{ fontSize: 14, opacity: 0.5 }}>Reached Level {currentLevel}</p>
      <button onClick={onRestart} style={{ margin: 6, padding: '10px 32px', fontSize: 16, background: '#2dd4bf', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', width: 200 }}>Try Again</button>
      <button onClick={onQuit} style={{ margin: 6, padding: '10px 32px', fontSize: 16, background: '#2dd4bf', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', width: 200 }}>Main Menu</button>
    </div>
  )
}
