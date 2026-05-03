/**
 * Audio players for Shhh and Vacuum — both backed by real audio files.
 * Each player exposes: start(volume), pause(), resume(), stop(), setVolume(v)
 *
 * iOS lock screen card strategy
 * ──────────────────────────────
 * iOS drops the lock screen card the moment it detects no audio output:
 *   - audio.pause()      → session ends   ✗
 *   - audio.muted = true → session ends   ✗  (iOS treats muted as inactive)
 *   - audio.volume = 0   → ignored on iOS ✗  (volume is hardware-only)
 *
 * What DOES work: keep the HTMLAudioElement playing AND route it through a
 * Web Audio GainNode set to ~0.001 (inaudible, but non-zero output).
 * iOS sees continuous output → session + lock screen card persist indefinitely.
 *
 * Architecture:
 *   HTMLAudioElement (always playing)
 *     → MediaElementSourceNode
 *     → GainNode  (userVolume while playing, NEAR_ZERO while "paused")
 *     → AudioContext.destination
 */

const NEAR_ZERO = 0.001   // inaudible but keeps iOS session alive

export function createAudioFilePlayer(url) {
  let audio = null
  let ctx = null
  let sourceNode = null
  let gainNode = null
  let userVolume = 0.8
  let paused = false

  function setup(volume) {
    if (audio) return   // already set up

    ctx = new (window.AudioContext || window.webkitAudioContext)()

    audio = new Audio(url)
    audio.loop = true
    // Note: crossOrigin is NOT set — these are same-origin files and adding it
    // would require the server to send CORS headers, which could break loading.

    sourceNode = ctx.createMediaElementSource(audio)
    gainNode = ctx.createGain()
    gainNode.gain.value = volume
    sourceNode.connect(gainNode)
    gainNode.connect(ctx.destination)

    // iOS suspends the AudioContext on screen lock. Auto-resume it so audio
    // keeps flowing through the GainNode and the lock screen card stays alive.
    ctx.onstatechange = () => {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    }
  }

  return {
    start(volume = 0.8) {
      userVolume = volume
      paused = false
      setup(volume)
      gainNode.gain.cancelScheduledValues(ctx.currentTime)
      gainNode.gain.setValueAtTime(volume, ctx.currentTime)
      if (ctx.state === 'suspended') ctx.resume()
      audio.play().catch(() => {})
    },

    // "Pause" = drop gain to near-zero; element keeps playing → iOS session alive
    pause() {
      if (!gainNode) return
      paused = true
      gainNode.gain.cancelScheduledValues(ctx.currentTime)
      gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(NEAR_ZERO, ctx.currentTime + 0.05)
    },

    // Resume = ramp gain back up instantly
    resume() {
      if (!gainNode) return
      paused = false
      gainNode.gain.cancelScheduledValues(ctx.currentTime)
      gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(userVolume, ctx.currentTime + 0.05)
      if (ctx.state === 'suspended') ctx.resume()
    },

    stop() {
      paused = false
      if (audio)      { audio.pause(); audio.src = ''; audio = null }
      if (sourceNode) { sourceNode.disconnect(); sourceNode = null }
      if (gainNode)   { gainNode.disconnect();   gainNode = null }
      if (ctx)        { ctx.close().catch(() => {}); ctx = null }
    },

    setVolume(v) {
      userVolume = Math.max(0, Math.min(1, v))
      if (gainNode && !paused) {
        gainNode.gain.cancelScheduledValues(ctx.currentTime)
        gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime)
        gainNode.gain.linearRampToValueAtTime(userVolume, ctx.currentTime + 0.05)
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
