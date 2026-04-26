import type { UIState } from '../types'

type HUDProps = UIState & { cheatActive: string | null }

export function HUD({ score, lives, health, maxHealth, weapon, spreadLevel, fireRateLevel, currentLevel, totalLevels, bossHealth, bossMaxHealth, cheatActive }: HUDProps) {
  const weaponName = weapon.charAt(0).toUpperCase() + weapon.slice(1)
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '12px 20px', pointerEvents: 'none', fontFamily: 'monospace', color: '#fff',
    }}>
      <div>
        <div style={{ fontSize: 14, opacity: 0.6 }}>SCORE</div>
        <div style={{ fontSize: 24, fontWeight: 'bold' }}>{score.toLocaleString()}</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, opacity: 0.6 }}>LIVES</div>
        <div style={{ fontSize: 24, fontWeight: 'bold' }}>{'♥'.repeat(lives)}</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, opacity: 0.6 }}>LEVEL</div>
        <div style={{ fontSize: 24, fontWeight: 'bold' }}>{currentLevel}/{totalLevels}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 14, opacity: 0.6 }}>HEALTH</div>
        <div style={{
          width: 120, height: 12, background: '#333', borderRadius: 6, overflow: 'hidden', marginTop: 4,
        }}>
          <div style={{
            width: `${(health / maxHealth) * 100}%`, height: '100%',
            background: health > 2 ? '#2dd4bf' : health > 1 ? '#fbbf24' : '#ef4444',
            borderRadius: 6, transition: 'width 0.2s',
          }} />
        </div>
        <div style={{ fontSize: 14, marginTop: 4, opacity: 0.8 }}>{weaponName} S{spreadLevel} R{fireRateLevel}</div>
      </div>
      {bossHealth > 0 && (
        <div style={{ position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)', width: 300 }}>
          <div style={{ fontSize: 14, opacity: 0.6, textAlign: 'center' }}>BOSS</div>
          <div style={{ width: '100%', height: 8, background: '#333', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${(bossHealth / bossMaxHealth) * 100}%`, height: '100%', background: '#ef4444', borderRadius: 4 }} />
          </div>
        </div>
      )}
      {cheatActive && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 32, fontWeight: 'bold', color: '#fbbf24', textShadow: '0 0 20px rgba(251,191,36,0.5)', animation: 'pulse 1s infinite' }}>
          CHEAT ACTIVATED
        </div>
      )}
    </div>
  )
}
