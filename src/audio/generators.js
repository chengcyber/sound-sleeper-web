/**
 * Audio players for Shhh and Vacuum — both backed by real audio files.
 * Each player exposes: start(volume), pause(), resume(), stop(), setVolume(v)
 *
 * iOS lock screen card strategy
 * ──────────────────────────────
 * iOS suspends AudioContext on screen lock and WILL NOT allow ctx.resume()
 * from the background — so any Web Audio routing (MediaElementSourceNode →
 * GainNode) silences audio the moment the screen locks, regardless of
 * onstatechange handlers.
 *
 * What DOES work: keep the HTMLAudioElement playing NATIVELY (no AudioContext),
 * and "pause" by setting audio.volume to NEAR_ZERO (0.001) rather than calling
 * audio.pause().  iOS keeps the native audio session alive as long as the
 * element is playing with a non-zero volume, and the lock screen card persists.
 *
 *   audio.pause()        → session ends         ✗
 *   audio.muted = true   → session ends         ✗
 *   audio.volume = 0     → session may end      ✗
 *   audio.volume = 0.001 (playing) → keeps iOS session + lock screen card ✓
 */

const NEAR_ZERO = 0.001   // inaudible but keeps iOS native audio session alive

export function createAudioFilePlayer(url) {
  let audio = null
  let userVolume = 0.8
  let paused = false

  function setup(volume) {
    if (audio) return
    audio = new Audio(url)
    audio.loop = true
    audio.volume = volume
  }

  return {
    start(volume = 0.8) {
      userVolume = volume
      paused = false
      setup(volume)
      audio.volume = volume
      audio.play().catch(() => {})
    },

    // "Pause" = drop volume to near-zero; element keeps playing → iOS session alive
    pause() {
      if (!audio) return
      paused = true
      audio.volume = NEAR_ZERO
    },

    resume() {
      if (!audio) return
      paused = false
      audio.volume = userVolume
    },

    stop() {
      paused = false
      if (audio) {
        audio.pause()
        audio.src = ''
        audio = null
      }
    },

    setVolume(v) {
      userVolume = Math.max(NEAR_ZERO, Math.min(1, v))
      if (audio && !paused) {
        audio.volume = userVolume
      }
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
