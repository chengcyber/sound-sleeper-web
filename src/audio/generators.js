/**
 * Audio players for Shhh and Vacuum — both backed by real audio files.
 * Each player exposes: start(volume), pause(), resume(), stop(), setVolume(v)
 *
 * iOS lock screen card behaviour
 * ──────────────────────────────
 * iOS keeps the lock screen card alive as long as audio is PLAYING.
 * When the user explicitly pauses, the card disappears — this is correct:
 * there is no way to silence audio AND keep the iOS session alive because
 * iOS ignores audio.volume changes from JS (hardware-only) and audio.muted
 * also terminates the session.
 *
 * Practical result:
 *   - Start sound, lock phone → sound continues, lock screen card persists ✓
 *   - Pause from lock screen / in-app → card goes away (correct / expected) ✓
 */

export function createAudioFilePlayer(url) {
  let audio = null
  let userVolume = 0.8

  function setup(volume) {
    if (audio) return
    audio = new Audio(url)
    audio.loop = true
    audio.volume = volume
  }

  return {
    start(volume = 0.8) {
      userVolume = volume
      setup(volume)
      audio.volume = volume
      audio.play().catch(() => {})
    },

    pause() {
      if (!audio) return
      audio.pause()
    },

    resume() {
      if (!audio) return
      audio.play().catch(() => {})
    },

    stop() {
      if (audio) {
        audio.pause()
        audio.src = ''
        audio = null
      }
    },

    setVolume(v) {
      userVolume = Math.max(0, Math.min(1, v))
      if (audio) audio.volume = userVolume
    },
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────
export function createGenerator(type) {
  switch (type) {
    case 'shh':    return createAudioFilePlayer('/audio/shh.mp3')
    case 'vacuum': return createAudioFilePlayer('/audio/vacuum.mp3')
    default:       return createAudioFilePlayer('/audio/shh.mp3')
  }
}
