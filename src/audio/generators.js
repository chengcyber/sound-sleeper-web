/**
 * Audio players for Shhh and Vacuum — both backed by real audio files.
 * Each player exposes: start(volume), pause(), resume(), stop(), setVolume(v)
 */

// ─── Audio File Player ────────────────────────────────────────────────────────
/**
 * Wraps an HTMLAudioElement.
 *
 * iOS lock screen card strategy:
 *   Calling audio.pause() marks the session as inactive and iOS removes the
 *   lock screen card after a short timeout (~5 s).  Instead we keep the element
 *   playing at volume 0 ("muted-playing") so the session stays alive indefinitely.
 *   resume() restores the saved user volume.  stop() is the only place we truly
 *   pause + destroy the element.
 */
export function createAudioFilePlayer(url) {
  let audio = null
  let userVolume = 0.8  // last volume set by the user (not 0 from mute)
  let muted = false     // true while "paused" (audio still playing at vol=0)

  function ensureAudio(volume) {
    if (!audio) {
      audio = new Audio(url)
      audio.loop = true
      audio.volume = volume
    }
  }

  return {
    start(volume = 0.8) {
      userVolume = volume
      muted = false
      ensureAudio(volume)
      audio.volume = volume
      audio.play().catch(() => {})
    },
    // "Pause" = mute while keeping the element playing → iOS session stays alive
    // NOTE: audio.volume = 0 does NOT work on iOS (volume is hardware-controlled).
    // audio.muted = true is the correct cross-platform way to silence without stopping.
    pause() {
      if (audio) { audio.muted = true; muted = true }
    },
    // Resume = unmute (element is already playing)
    resume() {
      if (audio) {
        muted = false
        audio.muted = false
        // Guard: if somehow the element got paused (e.g. phone call interruption),
        // restart playback
        if (audio.paused) audio.play().catch(() => {})
      }
    },
    stop() {
      muted = false
      if (audio) {
        audio.pause()
        audio.src = ''
        audio = null
      }
    },
    setVolume(v) {
      userVolume = Math.max(0, Math.min(1, v))
      // Only apply if not in muted-pause state
      if (audio && !muted) {
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
