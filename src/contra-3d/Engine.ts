export class Engine {
  private animFrameId: number | null = null
  private lastTime = 0
  private running = false
  private updateFn: (delta: number, time: number) => void

  constructor(updateFn: (delta: number, time: number) => void) {
    this.updateFn = updateFn
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.tick(this.lastTime)
  }

  stop(): void {
    this.running = false
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }
  }

  private tick = (now: number): void => {
    if (!this.running) return
    const delta = Math.min(0.033, (now - this.lastTime) / 1000)
    this.lastTime = now
    this.updateFn(delta, now / 1000)
    this.animFrameId = requestAnimationFrame(this.tick)
  }

  isRunning(): boolean {
    return this.running
  }
}
