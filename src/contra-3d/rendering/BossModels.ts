import * as THREE from 'three'

export function createBossMesh(bossType: string): THREE.Group {
  const group = new THREE.Group()

  if (bossType === 'tank') {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.4, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x4a4a4a })
    )
    body.position.set(0, 0.8, 0)
    group.add(body)

    const turret = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.8, 0.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x6b6b6b })
    )
    turret.position.set(0, 1.5, 0)
    group.add(turret)

    const cannon = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.2, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    )
    cannon.position.set(1.0, 1.7, 0)
    group.add(cannon)
  }

  return group
}
