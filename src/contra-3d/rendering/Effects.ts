export class Effects {
  private shakeDuration = 0
  private shakeIntensity = 0

  shake(intensity: number, duration: number): void {
    this.shakeDuration = duration
    this.shakeIntensity = intensity
  }

  update(delta: number): { offsetX: number; offsetY: number } {
    if (this.shakeDuration <= 0) return { offsetX: 0, offsetY: 0 }
    this.shakeDuration -= delta
    const intensity = this.shakeIntensity * (this.shakeDuration / (this.shakeDuration + delta))
    return {
      offsetX: (Math.random() - 0.5) * intensity,
      offsetY: (Math.random() - 0.5) * intensity,
    }
  }
}
