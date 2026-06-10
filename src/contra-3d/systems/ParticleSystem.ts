import * as THREE from 'three'
import type { Effects } from '../rendering/Effects'
import { getExplosionTexture, getSparkTexture, getSmokeTexture } from '../rendering/ParticleTextures'

type SpriteParticle = {
  sprite: THREE.Sprite
  velocity: THREE.Vector3
  ttl: number
  maxTtl: number
  type: 'explosion' | 'spark' | 'smoke'
}

const explosionMat = new THREE.SpriteMaterial({
  map: getExplosionTexture(),
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  transparent: true,
})

const sparkMat = new THREE.SpriteMaterial({
  map: getSparkTexture(),
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  transparent: true,
})

const smokeMat = new THREE.SpriteMaterial({
  map: getSmokeTexture(),
  depthWrite: false,
  transparent: true,
  opacity: 0.5,
})

export class ParticleSystem {
  private particles: SpriteParticle[] = []
  private scene: THREE.Scene
  private effects: Effects | null = null

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  setEffects(effects: Effects): void {
    this.effects = effects
  }

  explode(position: THREE.Vector3, count = 8): void {
    this.effects?.shake(0.2, 0.25)
    for (let i = 0; i < count; i++) {
      const sprite = new THREE.Sprite(explosionMat.clone())
      sprite.position.copy(position)
      const size = 0.2 + Math.random() * 0.4
      sprite.scale.set(size, size, 1)
      this.scene.add(sprite)

      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
      const speed = 2 + Math.random() * 4
      this.particles.push({
        sprite,
        velocity: new THREE.Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed, 0),
        ttl: 0.5 + Math.random() * 0.3,
        maxTtl: 0.8,
        type: 'explosion',
      })
    }
    // Smoke particles
    for (let i = 0; i < 5; i++) {
      const sprite = new THREE.Sprite(smokeMat.clone())
      sprite.position.copy(position)
      sprite.position.x += (Math.random() - 0.5) * 0.3
      const size = 0.3 + Math.random() * 0.3
      sprite.scale.set(size, size, 1)
      this.scene.add(sprite)
      this.particles.push({
        sprite,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 1.5, 1 + Math.random() * 2, 0),
        ttl: 1 + Math.random() * 0.5,
        maxTtl: 1.5,
        type: 'smoke',
      })
    }
  }

  hitSpark(position: THREE.Vector3): void {
    for (let i = 0; i < 4; i++) {
      const sprite = new THREE.Sprite(sparkMat.clone())
      sprite.position.copy(position)
      sprite.scale.set(0.1, 0.1, 1)
      this.scene.add(sprite)
      this.particles.push({
        sprite,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, 0),
        ttl: 0.2,
        maxTtl: 0.2,
        type: 'spark',
      })
    }
  }

  update(delta: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.ttl -= delta
      if (p.ttl <= 0) {
        this.scene.remove(p.sprite)
        p.sprite.material.dispose()
        this.particles.splice(i, 1)
        continue
      }
      p.sprite.position.addScaledVector(p.velocity, delta)
      const t = p.ttl / p.maxTtl
      if (p.type === 'smoke') {
        p.sprite.scale.setScalar(1 + (1 - t) * 2)
        p.sprite.material.opacity = 0.5 * t
      } else {
        p.sprite.scale.setScalar(t * (p.type === 'explosion' ? 0.6 : 0.1))
      }
    }
  }

  clear(): void {
    for (const p of this.particles) {
      this.scene.remove(p.sprite)
      p.sprite.material.dispose()
    }
    this.particles = []
  }
}
