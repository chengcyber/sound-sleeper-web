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
  let fadeTimer = null

  function cancelFade() {
    if (fadeTimer !== null) {
      clearInterval(fadeTimer)
      fadeTimer = null
    }
  }

  function fadeIn(targetVolume, duration = 2000) {
    cancelFade()
    if (!audio) return
    audio.volume = 0
    const steps = Math.round(duration / 50)
    const step = targetVolume / steps
    let current = 0
    fadeTimer = setInterval(() => {
      current += step
      if (current >= targetVolume) {
        audio.volume = targetVolume
        cancelFade()
      } else {
        audio.volume = current
      }
    }, 50)
  }

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
      audio.play().catch(() => {})
      fadeIn(volume)
    },

    pause() {
      if (!audio) return
      cancelFade()
      audio.pause()
    },

    resume() {
      if (!audio) return
      audio.play().catch(() => {})
      fadeIn(userVolume)
    },

    stop() {
      cancelFade()
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
    case 'shh':       return createAudioFilePlayer('/audio/shh.mp3')
    case 'vacuum':    return createAudioFilePlayer('/audio/vacuum.mp3')
    case 'hairdryer': return createAudioFilePlayer('/audio/hairdryer.mp3')
    default:          return createAudioFilePlayer('/audio/shh.mp3')
  }
}
