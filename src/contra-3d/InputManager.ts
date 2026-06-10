import * as THREE from 'three'

export class InputManager {
  readonly keys = new Set<string>()
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
  private domElement: HTMLElement
  private handlers: (() => void)[] = []
  private hasPointer = false
  aimTarget = new THREE.Vector3(10, 4, 0)

  constructor(domElement: HTMLElement) {
    this.domElement = domElement
    this.registerHandlers()
  }

  private registerHandlers(): void {
    const onKeyDown = (e: KeyboardEvent) => {
      this.keys.add(e.key.toLowerCase())
    }
    const onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase())
    const onMouseMove = (e: MouseEvent) => {
      const rect = this.domElement.getBoundingClientRect()
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      this.hasPointer = true
    }
    const onPointerDown = () => this.keys.add('shoot')
    const onPointerUp = () => this.keys.delete('shoot')

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    this.domElement.addEventListener('mousemove', onMouseMove)
    this.domElement.addEventListener('pointerdown', onPointerDown)
    this.domElement.addEventListener('pointerup', onPointerUp)
    this.domElement.addEventListener('pointerleave', onPointerUp)

    this.handlers = [
      () => { window.removeEventListener('keydown', onKeyDown) },
      () => { window.removeEventListener('keyup', onKeyUp) },
      () => { this.domElement.removeEventListener('mousemove', onMouseMove) },
      () => { this.domElement.removeEventListener('pointerdown', onPointerDown) },
      () => { this.domElement.removeEventListener('pointerup', onPointerUp) },
      () => { this.domElement.removeEventListener('pointerleave', onPointerUp) },
    ]
  }

  private getCamera(): THREE.Camera {
    return (this.domElement as HTMLElement & { __camera?: THREE.Camera }).__camera || new THREE.PerspectiveCamera()
  }

  // Re-project the cursor onto the Z=0 plane every frame so the aim point
  // tracks the scrolling camera instead of freezing at the last mousemove.
  updateAim(fallbackX: number, fallbackY: number): void {
    if (!this.hasPointer) {
      this.aimTarget.set(fallbackX, fallbackY, 0)
      return
    }
    this.raycaster.setFromCamera(this.pointer, this.getCamera())
    const intersect = new THREE.Vector3()
    this.raycaster.ray.intersectPlane(this.groundPlane, intersect)
    if (Number.isFinite(intersect.x)) {
      this.aimTarget.copy(intersect)
    }
  }

  setCamera(camera: THREE.Camera): void {
    ;(this.domElement as HTMLElement & { __camera?: THREE.Camera }).__camera = camera
  }

  isDown(key: string): boolean {
    return this.keys.has(key)
  }

  isShooting(): boolean {
    return this.keys.has('shoot')
  }

  getMovement(): { x: number; y: number } {
    const move = { x: 0, y: 0 }
    if (this.keys.has('w') || this.keys.has('arrowup')) move.y += 1
    if (this.keys.has('s') || this.keys.has('arrowdown')) move.y -= 1
    if (this.keys.has('a') || this.keys.has('arrowleft')) move.x -= 1
    if (this.keys.has('d') || this.keys.has('arrowright')) move.x += 1
    return move
  }

  destroy(): void {
    this.handlers.forEach(fn => fn())
  }
}
