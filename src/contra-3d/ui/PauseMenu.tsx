type PauseMenuProps = {
  onResume: () => void
  onRestart: () => void
  onQuit: () => void
}

export function PauseMenu({ onResume, onRestart, onQuit }: PauseMenuProps) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      background: 'rgba(0,0,0,0.6)', fontFamily: 'monospace', color: '#fff',
      zIndex: 10,
    }}>
      <h2 style={{ fontSize: 32, marginBottom: 24 }}>PAUSED</h2>
      <button onClick={onResume} style={{ margin: 6, padding: '10px 32px', fontSize: 16, background: '#2dd4bf', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', width: 200 }}>Resume</button>
      <button onClick={onRestart} style={{ margin: 6, padding: '10px 32px', fontSize: 16, background: '#2dd4bf', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', width: 200 }}>Restart</button>
      <button onClick={onQuit} style={{ margin: 6, padding: '10px 32px', fontSize: 16, background: '#2dd4bf', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', width: 200 }}>Quit to Menu</button>
    </div>
  )
}
