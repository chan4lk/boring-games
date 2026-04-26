import * as THREE from 'three'

type Particle = {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  ttl: number
  maxTtl: number
}

export class ParticleSystem {
  private particles: Particle[] = []
  private scene: THREE.Scene

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  explode(position: THREE.Vector3, count = 8): void {
    for (let i = 0; i < count; i++) {
      const size = 0.04 + Math.random() * 0.08
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        new THREE.MeshStandardMaterial({
          color: 0xf97316,
          emissive: 0xea580c,
          emissiveIntensity: 0.6,
        })
      )
      mesh.position.copy(position)
      this.scene.add(mesh)

      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
      const speed = 2 + Math.random() * 4
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed, 0),
        ttl: 0.5 + Math.random() * 0.3,
        maxTtl: 0.8,
      })
    }
  }

  hitSpark(position: THREE.Vector3): void {
    for (let i = 0; i < 4; i++) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.03, 0.03),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1 })
      )
      mesh.position.copy(position)
      this.scene.add(mesh)
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, 0),
        ttl: 0.2,
        maxTtl: 0.2,
      })
    }
  }

  update(delta: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.ttl -= delta
      if (p.ttl <= 0) {
        this.scene.remove(p.mesh)
        this.particles.splice(i, 1)
        continue
      }
      p.mesh.position.addScaledVector(p.velocity, delta)
      const scale = p.ttl / p.maxTtl
      p.mesh.scale.setScalar(scale)
    }
  }

  clear(): void {
    for (const p of this.particles) {
      this.scene.remove(p.mesh)
    }
    this.particles = []
  }
}
