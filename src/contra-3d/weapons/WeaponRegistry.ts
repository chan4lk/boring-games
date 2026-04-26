import type { WeaponDef, WeaponType } from '../types'
import { WEAPONS } from '../constants'

export class WeaponRegistry {
  private weapons: Map<WeaponType, WeaponDef> = new Map()

  constructor() {
    for (const [key, def] of Object.entries(WEAPONS)) {
      this.weapons.set(key as WeaponType, def)
    }
  }

  get(type: WeaponType): WeaponDef {
    return this.weapons.get(type)!
  }

  getAll(): [WeaponType, WeaponDef][] {
    return Array.from(this.weapons.entries())
  }

  getColor(type: WeaponType): number {
    return this.weapons.get(type)!.color
  }
}
