import * as THREE from 'three'

let grassTex: THREE.CanvasTexture | null = null
let groundTex: THREE.CanvasTexture | null = null

export function getGrassTexture(): THREE.CanvasTexture {
  if (grassTex) return grassTex
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  // Dark green base
  ctx.fillStyle = '#2d4a3a'
  ctx.fillRect(0, 0, 256, 256)
  // Grass blade strokes
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 256
    const y = Math.random() * 256
    const shade = 60 + Math.random() * 80
    ctx.strokeStyle = `rgb(40, ${shade + 40}, 30)`
    ctx.lineWidth = 1 + Math.random() * 2
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + (Math.random() - 0.5) * 4, y - 2 - Math.random() * 6)
    ctx.stroke()
  }
  // Noise overlay
  const imageData = ctx.getImageData(0, 0, 256, 256)
  for (let i = 0; i < imageData.data.length; i += 8) {
    const offset = Math.floor((Math.random() - 0.5) * 16)
    imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + offset))
    imageData.data[i + 1] = Math.max(0, Math.min(255, imageData.data[i + 1] + offset))
  }
  ctx.putImageData(imageData, 0, 0)

  grassTex = new THREE.CanvasTexture(canvas)
  grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping
  grassTex.repeat.set(8, 2)
  grassTex.needsUpdate = true
  return grassTex
}

export function getGroundTexture(): THREE.CanvasTexture {
  if (groundTex) return groundTex
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  // Brown base
  ctx.fillStyle = '#4a3728'
  ctx.fillRect(0, 0, 256, 256)
  // Speckles
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * 256
    const y = Math.random() * 256
    const size = 2 + Math.random() * 6
    const v = 60 + Math.random() * 50
    ctx.fillStyle = `rgb(${v + 10}, ${v}, ${v - 20})`
    ctx.beginPath()
    ctx.ellipse(x, y, size / 2, size / 4, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  groundTex = new THREE.CanvasTexture(canvas)
  groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping
  groundTex.repeat.set(4, 1)
  groundTex.needsUpdate = true
  return groundTex
}
