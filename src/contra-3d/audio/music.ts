export type MusicKey = 'menu' | 'level1' | 'level2' | 'level3' | 'level4' | 'level5' | 'boss'

export const MUSIC_FILES: Record<MusicKey, string> = {
  menu: '/audio/music/menu.mp3',
  level1: '/audio/music/level1.mp3',
  level2: '/audio/music/level2.mp3',
  level3: '/audio/music/level3.mp3',
  level4: '/audio/music/level4.mp3',
  level5: '/audio/music/level5.mp3',
  boss: '/audio/music/boss.mp3',
}
