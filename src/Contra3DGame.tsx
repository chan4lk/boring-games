import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const WORLD_WIDTH = 24
const WORLD_HEIGHT = 12
const PLAYER_SPEED = 10
const ENEMY_SPEED = 4
const BULLET_SPEED = 22
const FIRE_COOLDOWN = 0.12

type Enemy = {
  mesh: THREE.Object3D
  velocity: THREE.Vector3
}

type Bullet = {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
}

type PowerUp = {
  mesh: THREE.Mesh
  kind: 'spread' | 'rate'
}

export default function Contra3DGame() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [instance, setInstance] = useState(0)
  const [status, setStatus] = useState<'playing' | 'paused' | 'gameover'>(
    'playing'
  )
  const statusRef = useRef<'playing' | 'paused' | 'gameover'>('playing')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [spread, setSpread] = useState(1)
  const [fireRate, setFireRate] = useState(1)

  useEffect(() => {
    setStatus('playing')
    setScore(0)
    setLives(3)
    setSpread(1)
    setFireRate(1)

    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x0e1c1a, 6, 28)

    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    )
    camera.position.set(-6, 6, 12)
    camera.lookAt(6, 4, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setClearColor(0x0a0f0f)
    container.appendChild(renderer.domElement)

    const ambient = new THREE.AmbientLight(0x88a399, 0.6)
    scene.add(ambient)

    const dirLight = new THREE.DirectionalLight(0xfff1d6, 0.9)
    dirLight.position.set(6, 10, 8)
    scene.add(dirLight)

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 20),
      new THREE.MeshStandardMaterial({ color: 0x1e2f27 })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.set(10, 0, 0)
    scene.add(floor)

    const backgroundLayers: THREE.Mesh[] = []
    const layerColors = [0x112620, 0x18332a, 0x204036]
    for (let i = 0; i < 3; i += 1) {
      const layer = new THREE.Mesh(
        new THREE.PlaneGeometry(90, 26),
        new THREE.MeshStandardMaterial({
          color: layerColors[i],
          emissive: 0x0f1a16,
          emissiveIntensity: 0.4,
        })
      )
      layer.position.set(18, 8, -6 - i * 4)
      layer.rotation.y = Math.PI
      scene.add(layer)
      backgroundLayers.push(layer)
    }

    const soldierMaterial = new THREE.MeshStandardMaterial({ color: 0x2dd4bf })
    const armorMaterial = new THREE.MeshStandardMaterial({ color: 0x0f766e })
    const gunMaterial = new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
    const visorMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x1e90ff,
      emissiveIntensity: 0.4,
    })

    const createSoldier = (primary: THREE.Material, armor: THREE.Material) => {
      const group = new THREE.Group()

      const torso = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 1.0, 0.45),
        primary
      )
      torso.position.set(0, 0.9, 0)
      group.add(torso)

      const chest = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.5, 0.5),
        armor
      )
      chest.position.set(0, 1.0, 0)
      group.add(chest)

      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.45, 0.45),
        primary
      )
      head.position.set(0, 1.55, 0)
      group.add(head)

      const helmet = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.25, 0.55),
        armor
      )
      helmet.position.set(0, 1.7, 0)
      group.add(helmet)

      const visor = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.15, 0.05),
        visorMaterial
      )
      visor.position.set(0.2, 1.55, 0.25)
      group.add(visor)

      const backpack = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.6, 0.25),
        armor
      )
      backpack.position.set(-0.3, 0.95, -0.28)
      group.add(backpack)

      const armGeometry = new THREE.BoxGeometry(0.2, 0.55, 0.2)
      const legGeometry = new THREE.BoxGeometry(0.25, 0.6, 0.25)

      const leftArm = new THREE.Mesh(armGeometry, primary)
      leftArm.position.set(0.4, 1.0, 0)
      group.add(leftArm)

      const rightArm = new THREE.Mesh(armGeometry, primary)
      rightArm.position.set(0.4, 0.75, 0)
      group.add(rightArm)

      const leftLeg = new THREE.Mesh(legGeometry, primary)
      leftLeg.position.set(-0.18, 0.2, 0)
      group.add(leftLeg)

      const rightLeg = new THREE.Mesh(legGeometry, primary)
      rightLeg.position.set(0.18, 0.2, 0)
      group.add(rightLeg)

      const gun = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.2, 0.2),
        gunMaterial
      )
      gun.position.set(1.0, 1.05, 0.1)
      group.add(gun)

      const barrel = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.12, 0.12),
        gunMaterial
      )
      barrel.position.set(1.6, 1.05, 0.1)
      group.add(barrel)

      return group
    }

    const player = createSoldier(soldierMaterial, armorMaterial)
    player.position.set(2, 0, 0)
    scene.add(player)

    const enemyMaterialPrimary = new THREE.MeshStandardMaterial({
      color: 0xf97316,
    })
    const enemyMaterialArmor = new THREE.MeshStandardMaterial({
      color: 0x7c2d12,
    })
    const createEnemy = () => createSoldier(enemyMaterialPrimary, enemyMaterialArmor)

    const bulletGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 12)
    const bulletMaterial = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.9,
    })

    const muzzleFlashGeometry = new THREE.SphereGeometry(0.22, 12, 12)
    const muzzleFlashMaterial = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xf97316,
      emissiveIntensity: 1.2,
    })

    const powerGeometry = new THREE.IcosahedronGeometry(0.25, 0)
    const powerSpreadMaterial = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      emissive: 0x6d28d9,
      emissiveIntensity: 0.6,
    })
    const powerRateMaterial = new THREE.MeshStandardMaterial({
      color: 0xe879f9,
      emissive: 0xbe185d,
      emissiveIntensity: 0.6,
    })

    const enemies: Enemy[] = []
    const bullets: Bullet[] = []
    const powerUps: PowerUp[] = []
    const flashes: { mesh: THREE.Mesh; ttl: number }[] = []

    const keys = new Set<string>()
    let aimTarget = new THREE.Vector3(10, 4, 0)
    let lastShot = 0
    statusRef.current = 'playing'
    let currentLives = 3
    let currentScore = 0
    let currentSpread = 1
    let currentFireRate = 1

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)

    const handleResize = () => {
      if (!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }

    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(pointer, camera)
      const intersect = new THREE.Vector3()
      raycaster.ray.intersectPlane(groundPlane, intersect)
      if (Number.isFinite(intersect.x)) {
        aimTarget = intersect
      }
    }

    const handlePointerDown = () => {
      keys.add('shoot')
    }

    const handlePointerUp = () => {
      keys.delete('shoot')
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'p') {
        statusRef.current =
          statusRef.current === 'paused' ? 'playing' : 'paused'
        setStatus(statusRef.current)
        return
      }
      if (event.key === 'r') {
        setInstance((value) => value + 1)
        return
      }
      keys.add(event.key.toLowerCase())
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      keys.delete(event.key.toLowerCase())
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    renderer.domElement.addEventListener('mousemove', handleMouseMove)
    renderer.domElement.addEventListener('pointerdown', handlePointerDown)
    renderer.domElement.addEventListener('pointerup', handlePointerUp)
    renderer.domElement.addEventListener('pointerleave', handlePointerUp)

    let lastTime = performance.now()

    const spawnEnemy = () => {
      const mesh = createEnemy()
      mesh.position.set(
        WORLD_WIDTH,
        0.6 + Math.random() * (WORLD_HEIGHT - 1.8),
        0
      )
      scene.add(mesh)
      enemies.push({
        mesh,
        velocity: new THREE.Vector3(-ENEMY_SPEED, 0, 0),
      })
    }

    const spawnPowerUp = () => {
      const kind = Math.random() < 0.5 ? 'spread' : 'rate'
      const material = kind === 'spread' ? powerSpreadMaterial : powerRateMaterial
      const mesh = new THREE.Mesh(powerGeometry, material)
      mesh.position.set(
        WORLD_WIDTH,
        1 + Math.random() * (WORLD_HEIGHT - 2),
        0
      )
      scene.add(mesh)
      powerUps.push({ mesh, kind })
    }

    const shoot = (time: number) => {
      const cooldown = FIRE_COOLDOWN / currentFireRate
      if (time - lastShot < cooldown) return
      lastShot = time

      const spreadOffsets = currentSpread === 1 ? [0] : currentSpread === 2 ? [-0.5, 0, 0.5] : [-0.9, -0.45, 0, 0.45, 0.9]
      const aimDirection = new THREE.Vector3()
        .subVectors(aimTarget, player.position)
        .setZ(0)
        .normalize()

      for (const offset of spreadOffsets) {
        const mesh = new THREE.Mesh(bulletGeometry, bulletMaterial)
        mesh.rotation.z = Math.PI / 2
        mesh.position.copy(player.position).add(new THREE.Vector3(1.4, 1.05 + offset, 0.1))
        scene.add(mesh)
        const velocity = aimDirection.clone().multiplyScalar(BULLET_SPEED)
        bullets.push({ mesh, velocity })
      }

      const flash = new THREE.Mesh(muzzleFlashGeometry, muzzleFlashMaterial)
      flash.position.copy(player.position).add(new THREE.Vector3(1.7, 1.05, 0.1))
      scene.add(flash)
      flashes.push({ mesh: flash, ttl: 0.06 })
    }

    const animate = (time: number) => {
      const delta = Math.min(0.033, (time - lastTime) / 1000)
      lastTime = time

      if (statusRef.current === 'playing') {
        const move = new THREE.Vector3()
        if (keys.has('w') || keys.has('arrowup')) move.y += 1
        if (keys.has('s') || keys.has('arrowdown')) move.y -= 1
        if (keys.has('a') || keys.has('arrowleft')) move.x -= 1
        if (keys.has('d') || keys.has('arrowright')) move.x += 1
        if (move.length() > 0) {
          move.normalize().multiplyScalar(PLAYER_SPEED * delta)
          player.position.x = THREE.MathUtils.clamp(
            player.position.x + move.x,
            0,
            WORLD_WIDTH - 2
          )
          player.position.y = THREE.MathUtils.clamp(
            player.position.y + move.y,
            0,
            WORLD_HEIGHT - 1.5
          )
        }

        if (keys.has('shoot')) {
          shoot(time / 1000)
        }

        const gunDirection = new THREE.Vector3()
          .subVectors(aimTarget, player.position)
          .setZ(0)
          .normalize()
        player.lookAt(player.position.clone().add(gunDirection))

        bullets.forEach((bullet) => {
          bullet.mesh.position.addScaledVector(bullet.velocity, delta)
        })
        enemies.forEach((enemy) => {
          enemy.mesh.position.addScaledVector(enemy.velocity, delta)
        })
        powerUps.forEach((power) => {
          power.mesh.position.addScaledVector(new THREE.Vector3(-3, 0, 0), delta)
          power.mesh.rotation.y += delta * 2
        })

        for (let i = bullets.length - 1; i >= 0; i -= 1) {
          const bullet = bullets[i]
          if (bullet.mesh.position.x > WORLD_WIDTH + 2) {
            scene.remove(bullet.mesh)
            bullets.splice(i, 1)
          }
        }

        for (let i = flashes.length - 1; i >= 0; i -= 1) {
          const flash = flashes[i]
          flash.ttl -= delta
          flash.mesh.scale.setScalar(0.9 + (flash.ttl * 4))
          if (flash.ttl <= 0) {
            scene.remove(flash.mesh)
            flashes.splice(i, 1)
          }
        }

        for (let i = enemies.length - 1; i >= 0; i -= 1) {
          const enemy = enemies[i]
          if (enemy.mesh.position.x < -2) {
            scene.remove(enemy.mesh)
            enemies.splice(i, 1)
          }
        }

        for (let i = powerUps.length - 1; i >= 0; i -= 1) {
          const power = powerUps[i]
          if (power.mesh.position.x < -2) {
            scene.remove(power.mesh)
            powerUps.splice(i, 1)
          }
        }

        for (let i = enemies.length - 1; i >= 0; i -= 1) {
          const enemy = enemies[i]
          const distance = enemy.mesh.position.distanceTo(player.position)
          if (distance < 0.9) {
            currentLives -= 1
            setLives(currentLives)
            scene.remove(enemy.mesh)
            enemies.splice(i, 1)
            if (currentLives <= 0) {
              statusRef.current = 'gameover'
              setStatus('gameover')
              break
            }
          }
        }

        for (let i = bullets.length - 1; i >= 0; i -= 1) {
          const bullet = bullets[i]
          for (let j = enemies.length - 1; j >= 0; j -= 1) {
            const enemy = enemies[j]
            if (bullet.mesh.position.distanceTo(enemy.mesh.position) < 0.6) {
              scene.remove(bullet.mesh)
              bullets.splice(i, 1)
              scene.remove(enemy.mesh)
              enemies.splice(j, 1)
              currentScore += 15
              setScore(currentScore)
              break
            }
          }
        }

        for (let i = powerUps.length - 1; i >= 0; i -= 1) {
          const power = powerUps[i]
          if (power.mesh.position.distanceTo(player.position) < 0.8) {
            if (power.kind === 'spread') {
              currentSpread = Math.min(3, currentSpread + 1)
              setSpread(currentSpread)
            } else {
              currentFireRate = Math.min(3, currentFireRate + 1)
              setFireRate(currentFireRate)
            }
            currentScore += 5
            setScore(currentScore)
            scene.remove(power.mesh)
            powerUps.splice(i, 1)
          }
        }

        if (Math.random() < 0.03) spawnEnemy()
        if (Math.random() < 0.01) spawnPowerUp()

        backgroundLayers.forEach((layer, index) => {
          layer.position.x = 18 - player.position.x * (0.1 + index * 0.05)
        })
      }

      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }

    const animationId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      renderer.domElement.removeEventListener('mousemove', handleMouseMove)
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown)
      renderer.domElement.removeEventListener('pointerup', handlePointerUp)
      renderer.domElement.removeEventListener('pointerleave', handlePointerUp)
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [instance])

  const handleRestart = () => {
    setInstance((value) => value + 1)
  }

  const handleTogglePause = () => {
    setStatus((value) => {
      const next = value === 'paused' ? 'playing' : 'paused'
      statusRef.current = next
      return next
    })
  }

  return (
    <main className="snake">
      <header className="snake__header">
        <div>
          <p className="snake__eyebrow">Contra 3D</p>
          <h1>Big guns. Jungle heat. Hold the line.</h1>
        </div>
        <div className="snake__stats">
          <div>
            <span>Score</span>
            <strong>{score}</strong>
          </div>
          <div>
            <span>Lives</span>
            <strong>{lives}</strong>
          </div>
          <div>
            <span>Spread</span>
            <strong>{spread}x</strong>
          </div>
          <div>
            <span>Fire Rate</span>
            <strong>{fireRate}x</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>
              {status === 'playing'
                ? 'Running'
                : status === 'paused'
                  ? 'Paused'
                  : 'Game Over'}
            </strong>
          </div>
        </div>
      </header>

      <section className="snake__board">
        <div className="contra-3d" ref={containerRef} />
        {status === 'gameover' && (
          <div className="board__overlay" role="status">
            <p>Game Over</p>
            <button onClick={handleRestart}>Restart</button>
          </div>
        )}
      </section>

      <section className="snake__controls">
        <div className="controls">
          <button onClick={handleTogglePause}>
            {status === 'paused' ? 'Resume' : 'Pause'}
          </button>
          <button onClick={handleRestart}>Restart</button>
        </div>
        <p className="snake__hint">
          Controls: WASD to move, mouse to aim, click/hold to fire. Press{' '}
          <code>P</code> to pause, <code>R</code> to restart.
        </p>
      </section>
    </main>
  )
}
