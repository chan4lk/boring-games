import type { WeaponDef, WeaponType } from './types'

export const WORLD_WIDTH = 24
export const WORLD_HEIGHT = 12
export const PLAYER_SPEED = 10
export const ENEMY_BASE_SPEED = 4
export const BULLET_SPEED = 22
export const BASE_FIRE_COOLDOWN = 0.12
export const PLAYER_MAX_HEALTH = 5
export const PLAYER_START_LIVES = 3
export const INVINCIBILITY_DURATION = 2.0
export const EXTRA_LIFE_SCORE = 50000
export const SCROLL_OFFSCREEN_MARGIN = 5

export const WEAPONS: Record<WeaponType, WeaponDef> = {
  machinegun: { name: 'Machine Gun', damage: 1, fireRate: 0.1, bulletCount: 1, spreadAngle: 0, bulletSpeed: 22, color: 0xfbbf24 },
  spread:     { name: 'Spread',     damage: 1, fireRate: 0.2, bulletCount: 5, spreadAngle: 30, bulletSpeed: 20, color: 0x818cf8 },
  laser:      { name: 'Laser',      damage: 3, fireRate: 0.3, bulletCount: 1, spreadAngle: 0, bulletSpeed: 30, color: 0xf472b6 },
  fire:       { name: 'Fire',       damage: 2, fireRate: 0.22, bulletCount: 1, spreadAngle: 0, bulletSpeed: 18, color: 0xfb923c },
  rapid:      { name: 'Rapid',      damage: 1, fireRate: 0.06, bulletCount: 1, spreadAngle: 0, bulletSpeed: 24, color: 0x34d399 },
}
