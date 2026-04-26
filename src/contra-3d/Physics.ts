import * as THREE from 'three'

export type AABB = {
  minX: number
  maxX: number
  minY: number
  maxY: number
  minZ: number
  maxZ: number
}

export class Physics {
  getAABB(mesh: THREE.Object3D): AABB {
    const box = new THREE.Box3().setFromObject(mesh)
    return {
      minX: box.min.x, maxX: box.max.x,
      minY: box.min.y, maxY: box.max.y,
      minZ: box.min.z, maxZ: box.max.z,
    }
  }

  aabbOverlap(a: AABB, b: AABB): boolean {
    return (
      a.minX <= b.maxX && a.maxX >= b.minX &&
      a.minY <= b.maxY && a.maxY >= b.minY &&
      a.minZ <= b.maxZ && a.maxZ >= b.minZ
    )
  }

  distanceCheck(a: THREE.Object3D, b: THREE.Object3D, threshold: number): boolean {
    return a.position.distanceTo(b.position) < threshold
  }

  pointInAABB(px: number, py: number, aabb: AABB): boolean {
    return (
      px >= aabb.minX && px <= aabb.maxX &&
      py >= aabb.minY && py <= aabb.maxY
    )
  }

  clampToWorld(pos: { x: number; y: number }, worldWidth: number, worldHeight: number): void {
    pos.x = Math.max(0, Math.min(pos.x, worldWidth - 2))
    pos.y = Math.max(0, Math.min(pos.y, worldHeight - 1.5))
  }
}
