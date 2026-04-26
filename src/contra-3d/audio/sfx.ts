export type SfxKey = 'shoot_machinegun' | 'shoot_spread' | 'shoot_laser' | 'shoot_fire'
  | 'shoot_rapid' | 'explosion' | 'pickup' | 'death' | 'hit' | 'cheat' | 'jump'
  | 'boss_alert' | 'level_complete'

export const SFX_FILES: Record<SfxKey, string> = {
  shoot_machinegun: '/audio/sfx/shoot_machinegun.mp3',
  shoot_spread: '/audio/sfx/shoot_spread.mp3',
  shoot_laser: '/audio/sfx/shoot_laser.mp3',
  shoot_fire: '/audio/sfx/shoot_fire.mp3',
  shoot_rapid: '/audio/sfx/shoot_rapid.mp3',
  explosion: '/audio/sfx/explosion.mp3',
  pickup: '/audio/sfx/pickup.mp3',
  death: '/audio/sfx/death.mp3',
  hit: '/audio/sfx/hit.mp3',
  cheat: '/audio/sfx/cheat.mp3',
  jump: '/audio/sfx/jump.mp3',
  boss_alert: '/audio/sfx/boss_alert.mp3',
  level_complete: '/audio/sfx/level_complete.mp3',
}
