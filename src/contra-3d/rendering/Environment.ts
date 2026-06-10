import * as THREE from 'three'
import { SceneManager } from '../SceneManager'
import { getGrassTexture, getGroundTexture } from './ProceduralTextures'
import { createTree, createRock, createCrate } from './EnvironmentDecorations'

export class Environment {
  private scene: THREE.Scene
  private floor: THREE.Mesh
  private terrainMeshes: THREE.Mesh[] = []
  private decorations: THREE.Object3D[] = []

  constructor(sceneManager: SceneManager) {
    this.scene = sceneManager.scene
    this.floor = this.createFloor()
  }

  private createFloor(): THREE.Mesh {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 30),
      new THREE.MeshStandardMaterial({
        color: 0x1e2f27,
        map: getGrassTexture(),
      })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.set(10, 0, 0)
    floor.receiveShadow = true
    this.scene.add(floor)
    return floor
  }

  setFloorColor(color: number): void {
    (this.floor.material as THREE.MeshStandardMaterial).color.setHex(color)
  }

  // scene.reset() removes and disposes the floor; rebuild it before reuse
  ensureFloor(): void {
    if (!this.floor.parent) {
      this.floor = this.createFloor()
    }
  }

  updateScroll(scrollOffset: number): void {
    this.floor.position.x = scrollOffset + 10
  }

  buildTerrain(segments: { x: number; width: number; height: number; y: number }[]): void {
    for (const seg of segments) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(seg.width, Math.max(seg.height, 0.2), 0.5),
        new THREE.MeshStandardMaterial({
          color: 0x4a3728,
          map: getGroundTexture(),
        })
      )
      mesh.position.set(seg.x + seg.width / 2, seg.height / 2, 0)
      mesh.receiveShadow = true
      this.scene.add(mesh)
      this.terrainMeshes.push(mesh)
    }
  }

  clearTerrain(): void {
    for (const m of this.terrainMeshes) {
      this.scene.remove(m)
      m.geometry.dispose()
      ;(m.material as THREE.Material).dispose()
    }
    this.terrainMeshes = []
  }

  buildDecorations(items: { type: 'tree' | 'rock' | 'crate'; x: number; y: number; scale?: number }[]): void {
    for (const item of items) {
      let obj: THREE.Object3D
      const pos = { x: item.x, y: item.y }
      const scale = item.scale ?? 1
      switch (item.type) {
        case 'tree':
          obj = createTree(pos, scale)
          break
        case 'rock':
          obj = createRock(pos, scale)
          break
        case 'crate':
          obj = createCrate(pos, scale)
          break
      }
      this.scene.add(obj!)
      this.decorations.push(obj!)
    }
  }

  clearDecorations(): void {
    for (const d of this.decorations) {
      this.scene.remove(d)
      d.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          ;(child.material as THREE.Material).dispose()
        }
      })
    }
    this.decorations = []
  }
}
