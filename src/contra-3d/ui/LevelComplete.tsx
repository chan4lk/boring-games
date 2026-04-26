type LevelCompleteProps = {
  score: number
  currentLevel: number
  totalLevels: number
  onNext: () => void
}

export function LevelComplete({ score, currentLevel, totalLevels, onNext }: LevelCompleteProps) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      background: 'rgba(0,0,0,0.7)', fontFamily: 'monospace', color: '#fff',
      zIndex: 10,
    }}>
      <h2 style={{ fontSize: 32, color: '#2dd4bf', margin: 0 }}>LEVEL COMPLETE</h2>
      <p style={{ fontSize: 18, marginTop: 12 }}>Score: {score.toLocaleString()}</p>
      <p style={{ fontSize: 14, opacity: 0.5 }}>Level {currentLevel} of {totalLevels}</p>
      {currentLevel < totalLevels ? (
        <button onClick={onNext} style={{ marginTop: 16, padding: '10px 32px', fontSize: 16, background: '#2dd4bf', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>Next Level</button>
      ) : (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 20, color: '#fbbf24' }}>You Win!</p>
        </div>
      )}
    </div>
  )
}
