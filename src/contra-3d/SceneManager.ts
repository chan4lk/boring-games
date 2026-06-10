import * as THREE from 'three'
import { PostProcessingManager } from './rendering/PostProcessingManager'

export class SceneManager {
  readonly scene: THREE.Scene
  readonly camera: THREE.PerspectiveCamera
  readonly renderer: THREE.WebGLRenderer
  readonly container: HTMLDivElement
  readonly postProcessing: PostProcessingManager
  private backgroundLayers: THREE.Mesh[] = []
  private sky: THREE.Mesh | null = null
  private sun: THREE.DirectionalLight | null = null

  constructor(container: HTMLDivElement) {
    this.container = container
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.Fog(0xaac8b6, 14, 48)

    // Far plane must reach the sky dome so no ray ever falls through to the
    // raw clear color (which bypasses fog and renders visibly lighter)
    this.camera = new THREE.PerspectiveCamera(
      50, container.clientWidth / container.clientHeight, 0.1, 2000
    )
    this.camera.position.set(-6, 6, 12)
    this.camera.lookAt(6, 4, 0)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setClearColor(0xaac8b6)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.1
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(this.renderer.domElement)

    this.postProcessing = new PostProcessingManager(this.scene, this.camera, this.renderer)
    this.setupLights()
    ;(this.renderer.domElement as HTMLCanvasElement & { __camera?: THREE.Camera }).__camera = this.camera

    const handleResize = () => {
      this.camera.aspect = container.clientWidth / container.clientHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(container.clientWidth, container.clientHeight)
      this.postProcessing.resize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', handleResize)
  }

  private setupLights(): void {
    // Giant fog-saturated dome: every ray that would otherwise hit empty
    // clear color hits this instead, rendering as exact fog color so the
    // sky always blends seamlessly with fogged geometry
    this.sky = new THREE.Mesh(
      new THREE.SphereGeometry(900, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xaac8b6, side: THREE.BackSide })
    )
    this.sky.position.set(150, 0, 0)
    this.scene.add(this.sky)

    const ambient = new THREE.AmbientLight(0xb8c8c0, 0.5)
    this.scene.add(ambient)

    const hemiLight = new THREE.HemisphereLight(0xcfe3ee, 0x4a5a40, 1.0)
    this.scene.add(hemiLight)

    // Warm sun; repositioned every frame to track the scrolling camera so
    // shadows stay with the action for the whole level
    const sun = new THREE.DirectionalLight(0xfff2da, 1.8)
    sun.position.set(2, 14, 10)
    sun.castShadow = true
    sun.shadow.mapSize.width = 1024
    sun.shadow.mapSize.height = 1024
    sun.shadow.camera.near = 0.5
    sun.shadow.camera.far = 50
    sun.shadow.camera.left = -20
    sun.shadow.camera.right = 30
    sun.shadow.camera.top = 18
    sun.shadow.camera.bottom = -8
    sun.shadow.bias = -0.001
    this.scene.add(sun)
    this.scene.add(sun.target)
    this.sun = sun

    const fillLight = new THREE.DirectionalLight(0x9ab4d4, 0.4)
    fillLight.position.set(-4, 2, -6)
    this.scene.add(fillLight)
  }

  updateLighting(scrollOffset: number): void {
    if (!this.sun) return
    this.sun.position.set(scrollOffset + 2, 14, 10)
    this.sun.target.position.set(scrollOffset + 10, 0, 0)
  }

  createBackgroundLayers(config: { color: number; depth: number; scrollFactor: number }[]): void {
    this.backgroundLayers.forEach(l => this.scene.remove(l))
    this.backgroundLayers = []

    const fogColor = this.scene.fog instanceof THREE.Fog
      ? this.scene.fog.color
      : new THREE.Color(0x0e1c1a)
    for (const layer of config) {
      // Fog is computed from view-axis depth, so a vertical plane's flanks
      // render nearly unfogged — pull the color most of the way toward the
      // fog color so the plane's edges never contrast against empty sky
      const color = new THREE.Color(layer.color).lerp(fogColor, 0.45)
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(600, 160),
        new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
      )
      mesh.position.set(18, 20, -20 - layer.depth * 4)
      mesh.rotation.y = Math.PI
      this.scene.add(mesh)
      this.backgroundLayers.push(mesh)
    }
  }

  setAtmosphere(fogColor: string, fogNear: number, fogFar: number): void {
    const fog = parseInt(fogColor.replace('#', ''), 16)
    this.scene.fog = new THREE.Fog(fog, fogNear, fogFar)
    // Sky dome and clear color both match the fog so distance haze, empty
    // sky, and culled regions all blend into one seamless atmosphere
    this.renderer.setClearColor(fog)
    if (this.sky) {
      (this.sky.material as THREE.MeshBasicMaterial).color.setHex(fog)
    }
  }

  updateParallax(scrollOffset: number, factors: number[] = [0.1, 0.15, 0.2]): void {
    // Layers follow the camera, lagging by their scroll factor for depth
    this.backgroundLayers.forEach((layer, i) => {
      const factor = factors[i] ?? 0.1
      layer.position.x = 18 + scrollOffset * (1 - factor)
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
    this.postProcessing.render(0)
  }

  destroy(): void {
    this.postProcessing.dispose()
    this.renderer.dispose()
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}
