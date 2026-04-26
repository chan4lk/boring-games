import { Howl } from 'howler'
import type { SfxKey } from './audio/sfx'
import { SFX_FILES } from './audio/sfx'
import type { MusicKey } from './audio/music'
import { MUSIC_FILES } from './audio/music'

export class AudioManager {
  private sfx: Map<SfxKey, Howl> = new Map()
  private music: Map<MusicKey, Howl> = new Map()
  private currentMusic: Howl | null = null
  private initialized = false

  init(): void {
    if (this.initialized) return

    for (const [key, src] of Object.entries(SFX_FILES)) {
      this.sfx.set(key as SfxKey, new Howl({ src: [src], volume: 0.5, onloaderror: () => console.warn(`SFX failed to load: ${src}`) }))
    }
    for (const [key, src] of Object.entries(MUSIC_FILES)) {
      this.music.set(key as MusicKey, new Howl({ src: [src], volume: 0.3, loop: true, onloaderror: () => console.warn(`Music failed to load: ${src}`) }))
    }
    this.initialized = true
  }

  play(key: SfxKey): void {
    const sound = this.sfx.get(key)
    if (sound) sound.play()
  }

  playMusic(key: MusicKey): void {
    if (this.currentMusic) this.currentMusic.stop()
    const track = this.music.get(key)
    if (track) {
      this.currentMusic = track
      track.play()
    }
  }

  stopMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.stop()
      this.currentMusic = null
    }
  }

  setMusicVolume(vol: number): void {
    this.music.forEach(h => h.volume(vol))
  }

  setSfxVolume(vol: number): void {
    this.sfx.forEach(h => h.volume(vol))
  }

  destroy(): void {
    this.stopMusic()
    this.sfx.forEach(h => h.unload())
    this.music.forEach(h => h.unload())
    this.sfx.clear()
    this.music.clear()
  }
}
