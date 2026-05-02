/**
 * Web Audio API — white noise generators for each sound type.
 * Returns a generator object with start(), stop(), and setVolume() methods.
 *
 * Realism strategy:
 *  - Vacuum / Hairdryer: layer *sine oscillators* at motor harmonic frequencies
 *    (the periodic "drone") on top of band-filtered noise.
 *  - Shh: tight high-frequency noise with a slow breathing LFO, no low end.
 *  - Rain / Ocean: filtered pink/brown noise with natural modulation.
 */

/**
 * Creates a white noise buffer source node.
 * @param {AudioContext} ctx
 * @param {number} bufferSeconds - size of noise buffer in seconds (loops seamlessly)
 */
function createWhiteNoiseSource(ctx, bufferSeconds = 2) {
  const bufSize = ctx.sampleRate * bufferSeconds
  const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufSize; i++) {
    data[i] = Math.random() * 2 - 1
  }
  const node = ctx.createBufferSource()
  node.buffer = buffer
  node.loop = true
  return node
}

/**
 * Creates a pink noise buffer source node (1/f spectrum approximation).
 */
function createPinkNoiseSource(ctx, bufferSeconds = 2) {
  const bufSize = ctx.sampleRate * bufferSeconds
  const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
  for (let i = 0; i < bufSize; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.96900 * b2 + white * 0.1538520
    b3 = 0.86650 * b3 + white * 0.3104856
    b4 = 0.55000 * b4 + white * 0.5329522
    b5 = -0.7616 * b5 - white * 0.0168980
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
    b6 = white * 0.115926
  }
  const node = ctx.createBufferSource()
  node.buffer = buffer
  node.loop = true
  return node
}

/**
 * Creates a brown noise buffer source node (1/f² spectrum: heavy bass rumble).
 */
function createBrownNoiseSource(ctx, bufferSeconds = 2) {
  const bufSize = ctx.sampleRate * bufferSeconds
  const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let lastOut = 0
  for (let i = 0; i < bufSize; i++) {
    const white = Math.random() * 2 - 1
    data[i] = (lastOut + 0.02 * white) / 1.02
    lastOut = data[i]
    data[i] *= 3.5
  }
  const node = ctx.createBufferSource()
  node.buffer = buffer
  node.loop = true
  return node
}

// ─── Rain ────────────────────────────────────────────────────────────────────
export function createRainGenerator(ctx) {
  let masterGain = null
  let sources = []

  return {
    start(volume = 0.8) {
      masterGain = ctx.createGain()
      masterGain.gain.value = volume
      masterGain.connect(ctx.destination)

      // Layer 1: broad rain noise (pink → lowpass)
      const src1 = createPinkNoiseSource(ctx)
      const lp1 = ctx.createBiquadFilter()
      lp1.type = 'lowpass'
      lp1.frequency.value = 8000
      lp1.Q.value = 0.5
      const g1 = ctx.createGain()
      g1.gain.value = 0.6
      src1.connect(lp1)
      lp1.connect(g1)
      g1.connect(masterGain)
      src1.start()

      // Layer 2: high-frequency drizzle (white → highpass → lowpass)
      const src2 = createWhiteNoiseSource(ctx)
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 3000
      const lp2 = ctx.createBiquadFilter()
      lp2.type = 'lowpass'
      lp2.frequency.value = 10000
      const g2 = ctx.createGain()
      g2.gain.value = 0.25
      src2.connect(hp)
      hp.connect(lp2)
      lp2.connect(g2)
      g2.connect(masterGain)
      src2.start()

      // Layer 3: subtle low rumble
      const src3 = createBrownNoiseSource(ctx)
      const lp3 = ctx.createBiquadFilter()
      lp3.type = 'lowpass'
      lp3.frequency.value = 400
      const g3 = ctx.createGain()
      g3.gain.value = 0.15
      src3.connect(lp3)
      lp3.connect(g3)
      g3.connect(masterGain)
      src3.start()

      sources = [src1, src2, src3]
    },
    stop() {
      sources.forEach((s) => { try { s.stop() } catch (_) {} })
      masterGain?.disconnect()
      sources = []
      masterGain = null
    },
    setVolume(v) {
      if (masterGain) masterGain.gain.setTargetAtTime(v, ctx.currentTime, 0.05)
    },
  }
}

// ─── Ocean Waves ─────────────────────────────────────────────────────────────
export function createOceanGenerator(ctx) {
  let masterGain = null
  let lfo = null
  let sources = []

  return {
    start(volume = 0.8) {
      masterGain = ctx.createGain()
      masterGain.gain.value = volume
      masterGain.connect(ctx.destination)

      // Noise source
      const src = createPinkNoiseSource(ctx)

      // Lowpass to soften highs
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 2400
      lp.Q.value = 1.2

      // Wave amplitude envelope (LFO)
      const waveGain = ctx.createGain()
      waveGain.gain.value = 0.5

      lfo = ctx.createOscillator()
      lfo.type = 'sine'
      lfo.frequency.value = 0.18 // ~one wave per 5.5 seconds

      const lfoGain = ctx.createGain()
      lfoGain.gain.value = 0.45

      lfo.connect(lfoGain)
      lfoGain.connect(waveGain.gain)
      lfo.start()

      src.connect(lp)
      lp.connect(waveGain)
      waveGain.connect(masterGain)
      src.start()
      sources = [src]
    },
    stop() {
      sources.forEach((s) => { try { s.stop() } catch (_) {} })
      try { lfo?.stop() } catch (_) {}
      masterGain?.disconnect()
      sources = []
      masterGain = null
      lfo = null
    },
    setVolume(v) {
      if (masterGain) masterGain.gain.setTargetAtTime(v, ctx.currentTime, 0.05)
    },
  }
}

// ─── Audio File Player (for pre-recorded sounds: shh, vacuum) ───────────────
/**
 * Wraps an HTMLAudioElement to match the same {start, stop, setVolume}
 * interface used by the Web Audio generators.
 * The audio loops seamlessly and volume is controlled via .volume.
 */
export function createAudioFilePlayer(url) {
  let audio = null
  return {
    start(volume = 0.8) {
      if (audio) { try { audio.pause() } catch (_) {} }
      audio = new Audio(url)
      audio.loop = true
      audio.volume = volume
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
      if (audio) audio.volume = Math.max(0, Math.min(1, v))
    },
  }
}
// ─── Hair Dryer ───────────────────────────────────────────────────────────────
/**
 * Realistic hair dryer:
 *   - Universal motor (AC/DC brush motor) runs at 10,000–30,000 RPM
 *   - Dominant frequency: 200–350 Hz motor fundamental + harmonics
 *   - Very strong broadband air rush: white/pink noise 1.5–8 kHz — the
 *     louder and more prominent component vs. vacuum
 *   - Higher-frequency fan blade noise: 2–5 kHz peaking band
 *   - Light pitch wobble (0.3 Hz) — minor load drift when drying hair
 */
export function createHairdryerGenerator(ctx) {
  let masterGain = null
  let oscillators = []
  let wobbleLfo = null
  let sources = []

  return {
    start(volume = 0.8) {
      masterGain = ctx.createGain()
      masterGain.gain.value = volume
      masterGain.connect(ctx.destination)

      // ── Motor harmonic stack (higher base than vacuum) ───────────────────────
      const motorBase = 240      // Hz: ~14,400 RPM motor's 4th harmonic perceived pitch
      //   (cheaper dryers: 50Hz × few poles, perceived as 200-350 Hz complex tone)
      const harmonicAmps = [0.45, 0.28, 0.18, 0.12, 0.08, 0.05]
      const motorGain = ctx.createGain()
      motorGain.gain.value = 0.28

      // Slight LP on motor to prevent it sounding too digital
      const motorLp = ctx.createBiquadFilter()
      motorLp.type = 'lowpass'
      motorLp.frequency.value = 2500
      motorGain.connect(motorLp)
      motorLp.connect(masterGain)

      wobbleLfo = ctx.createOscillator()
      wobbleLfo.type = 'sine'
      wobbleLfo.frequency.value = 0.35 // very slight pitch drift

      for (let n = 1; n <= harmonicAmps.length; n++) {
        const osc = ctx.createOscillator()
        osc.type = 'sawtooth' // richer harmonic content than sine for motors
        osc.frequency.value = motorBase * n

        const wobbleMod = ctx.createGain()
        wobbleMod.gain.value = 2.5 * n
        wobbleLfo.connect(wobbleMod)
        wobbleMod.connect(osc.frequency)

        const oscGain = ctx.createGain()
        oscGain.gain.value = harmonicAmps[n - 1]
        osc.connect(oscGain)
        oscGain.connect(motorGain)
        osc.start()
        oscillators.push(osc)
      }
      wobbleLfo.start()

      // ── Main air rush — the dominant layer for hairdryer ────────────────────
      // This should sound like a strong jet of hot air blowing out
      const src1 = createWhiteNoiseSource(ctx)
      const hp1 = ctx.createBiquadFilter()
      hp1.type = 'highpass'
      hp1.frequency.value = 1200
      const lp1 = ctx.createBiquadFilter()
      lp1.type = 'lowpass'
      lp1.frequency.value = 9000
      // Strong presence boost around 2.5 kHz — "roaring" air character
      const boost1 = ctx.createBiquadFilter()
      boost1.type = 'peaking'
      boost1.frequency.value = 2500
      boost1.gain.value = 8
      boost1.Q.value = 1.2
      const g1 = ctx.createGain()
      g1.gain.value = 0.55
      src1.connect(hp1)
      hp1.connect(lp1)
      lp1.connect(boost1)
      boost1.connect(g1)
      g1.connect(masterGain)
      src1.start()

      // ── Fan blade pass noise — 2–5 kHz narrower layer ───────────────────────
      const src2 = createPinkNoiseSource(ctx)
      const bp2 = ctx.createBiquadFilter()
      bp2.type = 'bandpass'
      bp2.frequency.value = 3200
      bp2.Q.value = 0.6
      const g2 = ctx.createGain()
      g2.gain.value = 0.25
      src2.connect(bp2)
      bp2.connect(g2)
      g2.connect(masterGain)
      src2.start()

      sources = [src1, src2]
    },
    stop() {
      sources.forEach((s) => { try { s.stop() } catch (_) {} })
      oscillators.forEach((o) => { try { o.stop() } catch (_) {} })
      try { wobbleLfo?.stop() } catch (_) {}
      masterGain?.disconnect()
      sources = []
      oscillators = []
      masterGain = null
      wobbleLfo = null
    },
    setVolume(v) {
      if (masterGain) masterGain.gain.setTargetAtTime(v, ctx.currentTime, 0.05)
    },
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────
export function createGenerator(type, _ctx) {
  switch (type) {
    case 'rain':       return createRainGenerator(_ctx)
    case 'ocean':      return createOceanGenerator(_ctx)
    case 'fan':
    case 'hairdryer':  return createHairdryerGenerator(_ctx)
    // shh & vacuum use real recordings — no Web Audio generation needed
    case 'shh':        return createAudioFilePlayer('/audio/shh.mp3')
    case 'vacuum':     return createAudioFilePlayer('/audio/vacuum.mp3')
    default:           return createRainGenerator(_ctx)
  }
}
