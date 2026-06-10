import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import * as THREE from 'three'

export class PostProcessingManager {
  private composer: EffectComposer
  private bloomPass: UnrealBloomPass

  constructor(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
    this.composer = new EffectComposer(renderer)
    this.composer.addPass(new RenderPass(scene, camera))
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(renderer.domElement.width, renderer.domElement.height),
      0.3,
      0.2,
      0.8
    )
    this.composer.addPass(this.bloomPass)
    this.composer.addPass(new OutputPass())
  }

  render(delta: number): void {
    this.composer.render(delta)
  }

  setBloom(threshold: number, strength: number, radius: number): void {
    this.bloomPass.threshold = threshold
    this.bloomPass.strength = strength
    this.bloomPass.radius = radius
  }

  resize(width: number, height: number): void {
    this.composer.setSize(width, height)
  }

  dispose(): void {
    this.composer.dispose()
  }
}
