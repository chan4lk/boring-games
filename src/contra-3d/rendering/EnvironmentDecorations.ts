import * as THREE from 'three'

const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e })
const foliageMat1 = new THREE.MeshStandardMaterial({ color: 0x2d6b3a })
const foliageMat2 = new THREE.MeshStandardMaterial({ color: 0x3a7a48 })
const rockMat = new THREE.MeshStandardMaterial({ color: 0x666666, flatShading: true, roughness: 0.9 })
const crateMat = new THREE.MeshStandardMaterial({ color: 0x8b6914 })
const crateEdgeMat = new THREE.LineBasicMaterial({ color: 0x3a2a08 })

export function createTree(position: { x: number; y: number }, scale = 1): THREE.Group {
  const group = new THREE.Group()

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08 * scale, 0.12 * scale, 0.6 * scale, 6),
    trunkMat
  )
  trunk.position.set(0, 0.3 * scale, 0)
  group.add(trunk)

  const foliage1 = new THREE.Mesh(
    new THREE.ConeGeometry(0.3 * scale, 0.4 * scale, 6),
    foliageMat1
  )
  foliage1.position.set(0, 0.8 * scale, 0)
  group.add(foliage1)

  const foliage2 = new THREE.Mesh(
    new THREE.ConeGeometry(0.22 * scale, 0.3 * scale, 6),
    foliageMat2
  )
  foliage2.position.set(0, 1.1 * scale, 0)
  group.add(foliage2)

  group.position.set(position.x, position.y, 0)
  group.rotation.z = (Math.random() - 0.5) * 0.15
  return group
}

export function createRock(position: { x: number; y: number }, scale = 1): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.2 * scale),
    rockMat
  )
  const sx = 1 + (Math.random() - 0.5) * 0.6
  const sy = 0.8 + Math.random() * 0.4
  const sz = 0.8 + Math.random() * 0.4
  mesh.scale.set(sx, sy, sz)
  mesh.position.set(position.x, position.y + 0.1 * scale, 0)
  mesh.rotation.z = Math.random() * Math.PI
  return mesh
}

export function createCrate(position: { x: number; y: number }, scale = 1): THREE.Group {
  const group = new THREE.Group()

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.3 * scale, 0.3 * scale, 0.3 * scale),
    crateMat
  )
  group.add(body)

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(body.geometry),
    crateEdgeMat
  )
  edges.position.copy(body.position)
  group.add(edges)

  group.position.set(position.x, position.y + 0.15 * scale, 0)
  return group
}
