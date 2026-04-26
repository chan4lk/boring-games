type MainMenuProps = {
  onStart: () => void
}

export function MainMenu({ onStart }: MainMenuProps) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      background: 'rgba(0,0,0,0.85)', fontFamily: 'monospace', color: '#fff',
      zIndex: 10,
    }}>
      <h1 style={{ fontSize: 48, margin: 0, color: '#2dd4bf', textShadow: '0 0 30px rgba(45,212,191,0.3)' }}>
        CONTRA 3D
      </h1>
      <p style={{ fontSize: 16, opacity: 0.6, marginTop: 8 }}>Big guns. Jungle heat. Hold the line.</p>
      <button onClick={onStart} style={{
        marginTop: 40, padding: '12px 40px', fontSize: 18,
        background: '#2dd4bf', color: '#000', border: 'none', borderRadius: 8,
        cursor: 'pointer', fontWeight: 'bold',
      }}>
        START GAME
      </button>
      <div style={{ marginTop: 32, fontSize: 13, opacity: 0.5, textAlign: 'center', lineHeight: 1.8 }}>
        <p>WASD — Move &nbsp;|&nbsp; Mouse — Aim &nbsp;|&nbsp; Click — Shoot</p>
        <p>P — Pause &nbsp;|&nbsp; R — Restart</p>
        <p style={{ marginTop: 8, color: '#fbbf24' }}>↑ ↑ ↓ ↓ ← → ← → B A — ?</p>
      </div>
    </div>
  )
}
