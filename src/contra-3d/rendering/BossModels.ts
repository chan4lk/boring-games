import * as THREE from 'three'

export function createBossMesh(bossType: string): THREE.Group {
  const group = new THREE.Group()

  if (bossType === 'tank') {
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.4, metalness: 0.6 })
    const turretMat = new THREE.MeshStandardMaterial({ color: 0x6b6b6b, roughness: 0.3, metalness: 0.7 })
    const cannonMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.2, metalness: 0.8 })

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.4, 1.2),
      bodyMat
    )
    body.position.set(0, 0.8, 0)
    group.add(body)

    const turret = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.8, 0.6, 8),
      turretMat
    )
    turret.position.set(0, 1.5, 0)
    group.add(turret)

    const cannon = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.2, 0.2),
      cannonMat
    )
    cannon.position.set(1.0, 1.7, 0)
    group.add(cannon)
  }

  // Cast shadows on all meshes
  group.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true
    }
  })

  return group
}
