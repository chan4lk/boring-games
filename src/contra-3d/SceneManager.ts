import * as THREE from 'three'

export class SceneManager {
  readonly scene: THREE.Scene
  readonly camera: THREE.PerspectiveCamera
  readonly renderer: THREE.WebGLRenderer
  readonly container: HTMLDivElement
  private backgroundLayers: THREE.Mesh[] = []

  constructor(container: HTMLDivElement) {
    this.container = container
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.Fog(0x0e1c1a, 6, 28)

    this.camera = new THREE.PerspectiveCamera(
      50, container.clientWidth / container.clientHeight, 0.1, 100
    )
    this.camera.position.set(-6, 6, 12)
    this.camera.lookAt(6, 4, 0)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setClearColor(0x0a0f0f)
    container.appendChild(this.renderer.domElement)

    this.setupLights()
    ;(this.renderer.domElement as any).__camera = this.camera

    const handleResize = () => {
      this.camera.aspect = container.clientWidth / container.clientHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', handleResize)
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0x88a399, 0.6)
    this.scene.add(ambient)

    const dirLight = new THREE.DirectionalLight(0xfff1d6, 0.9)
    dirLight.position.set(6, 10, 8)
    this.scene.add(dirLight)

    const fillLight = new THREE.DirectionalLight(0x4466aa, 0.3)
    fillLight.position.set(-4, 2, -6)
    this.scene.add(fillLight)
  }

  createBackgroundLayers(config: { color: number; depth: number; scrollFactor: number }[]): void {
    this.backgroundLayers.forEach(l => this.scene.remove(l))
    this.backgroundLayers = []

    for (const layer of config) {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(90, 26),
        new THREE.MeshStandardMaterial({
          color: layer.color,
          emissive: 0x0f1a16,
          emissiveIntensity: 0.4,
          side: THREE.DoubleSide,
        })
      )
      mesh.position.set(18, 8, -6 - layer.depth * 4)
      mesh.rotation.y = Math.PI
      this.scene.add(mesh)
      this.backgroundLayers.push(mesh)
    }
  }

  updateParallax(scrollOffset: number, factors: number[] = [0.1, 0.15, 0.2]): void {
    this.backgroundLayers.forEach((layer, i) => {
      const factor = factors[i] ?? 0.1
      layer.position.x = 18 - scrollOffset * factor
    })
  }

  reset(): void {
    while (this.scene.children.length > 0) {
      const child = this.scene.children[0]
      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose()
      }
      this.scene.remove(child)
    }
    this.setupLights()
  }

  render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  destroy(): void {
    this.renderer.dispose()
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}
