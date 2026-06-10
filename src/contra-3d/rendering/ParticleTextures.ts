import * as THREE from 'three'

let explosionTex: THREE.CanvasTexture | null = null
let sparkTex: THREE.CanvasTexture | null = null
let smokeTex: THREE.CanvasTexture | null = null

export function getExplosionTexture(): THREE.CanvasTexture {
  if (explosionTex) return explosionTex
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.3, 'rgba(255, 180, 50, 1)')
  gradient.addColorStop(0.7, 'rgba(255, 100, 20, 0.6)')
  gradient.addColorStop(1, 'rgba(255, 50, 0, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)
  explosionTex = new THREE.CanvasTexture(canvas)
  explosionTex.needsUpdate = true
  return explosionTex
}

export function getSparkTexture(): THREE.CanvasTexture {
  if (sparkTex) return sparkTex
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.5, 'rgba(255, 255, 200, 1)')
  gradient.addColorStop(1, 'rgba(255, 255, 200, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 32, 32)
  sparkTex = new THREE.CanvasTexture(canvas)
  sparkTex.needsUpdate = true
  return sparkTex
}

export function getSmokeTexture(): THREE.CanvasTexture {
  if (smokeTex) return smokeTex
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(120, 120, 120, 0.5)')
  gradient.addColorStop(0.4, 'rgba(100, 100, 100, 0.25)')
  gradient.addColorStop(1, 'rgba(80, 80, 80, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)
  smokeTex = new THREE.CanvasTexture(canvas)
  smokeTex.needsUpdate = true
  return smokeTex
}
