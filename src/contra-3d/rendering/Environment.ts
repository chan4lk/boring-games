import * as THREE from 'three'
import { SceneManager } from '../SceneManager'

export class Environment {
  private scene: THREE.Scene
  private floor: THREE.Mesh
  private terrainMeshes: THREE.Mesh[] = []

  constructor(sceneManager: SceneManager) {
    this.scene = sceneManager.scene
    this.floor = this.createFloor()
  }

  private createFloor(): THREE.Mesh {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 20),
      new THREE.MeshStandardMaterial({ color: 0x1e2f27 })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.set(10, 0, 0)
    this.scene.add(floor)
    return floor
  }

  setFloorColor(color: number): void {
    (this.floor.material as THREE.MeshStandardMaterial).color.setHex(color)
  }

  clearTerrain(): void {
    for (const m of this.terrainMeshes) {
      this.scene.remove(m)
      m.geometry.dispose()
    }
    this.terrainMeshes = []
  }
}
