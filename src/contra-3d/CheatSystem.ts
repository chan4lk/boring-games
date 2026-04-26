import type { Game } from './Game'

type CheatSequence = { keys: string[]; name: string; action: (game: Game) => void }

export class CheatSystem {
  private buffer: string[] = []
  private bufferMax = 20
  lastActivated: string | null = null
  private activatedTime = 0

  private sequences: CheatSequence[] = [
    {
      keys: ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'],
      name: 'Konami Code',
      action: (game) => { game.lives = 30 },
    },
  ]

  constructor(private game: Game) {}

  update(time: number): void {
    if (this.lastActivated && time - this.activatedTime > 3) {
      this.lastActivated = null
      this.game.emitState()
    }
  }

  recordKey(key: string): void {
    this.buffer.push(key.toLowerCase())
    if (this.buffer.length > this.bufferMax) {
      this.buffer.shift()
    }
    this.checkSequences()
  }

  private checkSequences(): void {
    for (const seq of this.sequences) {
      if (this.buffer.length < seq.keys.length) continue
      const start = this.buffer.length - seq.keys.length
      let match = true
      for (let i = 0; i < seq.keys.length; i++) {
        if (this.buffer[start + i] !== seq.keys[i]) {
          match = false
          break
        }
      }
      if (match) {
        seq.action(this.game)
        this.lastActivated = seq.name
        this.activatedTime = performance.now() / 1000
        this.game.emitState()
        this.buffer = []
        break
      }
    }
  }
}
