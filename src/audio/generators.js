/**
 * Audio players for Shhh and Vacuum — both backed by real audio files.
 * Each player exposes: start(volume), pause(), resume(), stop(), setVolume(v)
 */

// ─── Audio File Player ────────────────────────────────────────────────────────
/**
 * Wraps an HTMLAudioElement.
 * On iOS the HTMLAudioElement IS the audio session, so calling pause() keeps
 * the lock screen card alive (unlike stopping a Web Audio node which destroys
 * the session).  resume() simply calls audio.play().
 */
export function createAudioFilePlayer(url) {
  let audio = null

  function ensureAudio(volume) {
    if (!audio) {
      audio = new Audio(url)
      audio.loop = true
      audio.volume = volume
    }
  }

  return {
    start(volume = 0.8) {
      ensureAudio(volume)
      audio.volume = volume
      audio.play().catch(() => {})
    },
    pause() {
      if (audio) audio.pause()
    },
    resume() {
      if (audio) audio.play().catch(() => {})
    },
    stop() {
      if (audio) {
        audio.pause()
        audio.src = ''
        audio = null
      }
    },
    setVolume(v) {
      if (audio) audio.volume = Math.max(0, Math.min(1, v))
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
