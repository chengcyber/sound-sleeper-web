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

// ─── Shhh ─────────────────────────────────────────────────────────────────────
/**
 * Realistic rhythmic "Shhh" — mimics a human shushing a baby:
 *
 *  Each ~1.1 s shush cycle has this envelope (asymmetric, NOT a sine wave):
 *    [gap 180ms silent] → [attack 120ms 0→peak] → [sustain 300ms at peak]
 *    → [decay 500ms peak→0.05]  = 1100ms total per shush
 *
 *  Three overlapping noise layers:
 *    1. Sharp "sh" turbulence  3–7 kHz  (the teeth/tongue friction sound)
 *    2. Mouth-air body         1.5–4 kHz (breath column resonance)
 *    3. Soft undertone         700–2 kHz (very light, always-on "room" air)
 *
 *  The formant filter frequency also sweeps up during the attack (mouth opens)
 *  and falls during the decay (mouth closes), giving the "sh" its vocal shape.
 *
 *  Slight timing jitter ±80 ms per cycle keeps it from sounding robotic.
 */
export function createShhGenerator(ctx) {
  let masterGain = null    // overall volume
  let breathGain = null    // the shush envelope rides here (layers 1 & 2)
  let formant = null       // bandpass filter — frequency modulated per cycle
  let sources = []
  let timeoutId = null
  let stopped = false

  // Schedule one shush cycle starting at `startTime` (AudioContext time)
  function scheduleShush(startTime, peakAmplitude) {
    // Timing params (seconds)
    const gap     = 0.14 + Math.random() * 0.08   // 140–220 ms silent gap
    const attack  = 0.10 + Math.random() * 0.04   // 100–140 ms attack
    const sustain = 0.28 + Math.random() * 0.08   // 280–360 ms sustain
    const decay   = 0.46 + Math.random() * 0.10   // 460–560 ms decay
    const cycleDuration = gap + attack + sustain + decay

    const t0 = startTime + gap               // attack starts here
    const t1 = t0 + attack                   // sustain starts
    const t2 = t1 + sustain                  // decay starts
    const t3 = t2 + decay                    // next cycle starts

    // Amplitude envelope on breathGain
    breathGain.gain.setValueAtTime(0.05, startTime)
    breathGain.gain.setValueAtTime(0.05, t0)
    breathGain.gain.linearRampToValueAtTime(peakAmplitude, t1)
    breathGain.gain.setValueAtTime(peakAmplitude * 0.88, t1 + 0.02) // tiny flutter at peak
    breathGain.gain.exponentialRampToValueAtTime(0.05, t3)

    // Formant sweep: opens from 3 kHz → 4.8 kHz during attack, returns during decay
    formant.frequency.setValueAtTime(3000, startTime)
    formant.frequency.linearRampToValueAtTime(4800, t1)
    formant.frequency.exponentialRampToValueAtTime(3200, t3)

    return cycleDuration
  }

  // Recursive scheduler — always schedules the next shush 200 ms before it plays
  const LOOKAHEAD = 0.20 // seconds
  let nextShushAt = 0

  function tick() {
    if (stopped) return
    const now = ctx.currentTime
    if (nextShushAt < now + LOOKAHEAD) {
      // Slight variation in peak amplitude per shush (0.82–1.0)
      const peak = 0.82 + Math.random() * 0.18
      const dur = scheduleShush(nextShushAt, peak)
      nextShushAt += dur
    }
    // Check again in 100 ms
    timeoutId = setTimeout(tick, 100)
  }

  return {
    start(volume = 0.8) {
      stopped = false

      masterGain = ctx.createGain()
      masterGain.gain.value = volume
      masterGain.connect(ctx.destination)

      // Breath envelope gain (rides on top of masterGain)
      breathGain = ctx.createGain()
      breathGain.gain.value = 0.05
      breathGain.connect(masterGain)

      // Formant bandpass — swept per cycle
      formant = ctx.createBiquadFilter()
      formant.type = 'bandpass'
      formant.frequency.value = 3500
      formant.Q.value = 0.85

      // ── Layer 1: core "sh" turbulence 3–7 kHz ────────────────────────────
      const src1 = createWhiteNoiseSource(ctx)
      const hp1 = ctx.createBiquadFilter()
      hp1.type = 'highpass'
      hp1.frequency.value = 2800
      hp1.Q.value = 0.4
      const lp1 = ctx.createBiquadFilter()
      lp1.type = 'lowpass'
      lp1.frequency.value = 9000
      const g1 = ctx.createGain()
      g1.gain.value = 0.72
      src1.connect(hp1)
      hp1.connect(lp1)
      lp1.connect(formant)
      formant.connect(g1)
      g1.connect(breathGain)
      src1.start()

      // ── Layer 2: mouth-air body 1.5–4 kHz (follows same envelope) ────────
      const src2 = createPinkNoiseSource(ctx)
      const hp2 = ctx.createBiquadFilter()
      hp2.type = 'highpass'
      hp2.frequency.value = 1500
      const lp2 = ctx.createBiquadFilter()
      lp2.type = 'lowpass'
      lp2.frequency.value = 4000
      const g2 = ctx.createGain()
      g2.gain.value = 0.40
      src2.connect(hp2)
      hp2.connect(lp2)
      lp2.connect(g2)
      g2.connect(breathGain)
      src2.start()

      // ── Layer 3: always-on soft room-air undertone 700 Hz–2 kHz ──────────
      // This gives a sense of the acoustic space / continuous breath presence
      const src3 = createPinkNoiseSource(ctx)
      const hp3 = ctx.createBiquadFilter()
      hp3.type = 'highpass'
      hp3.frequency.value = 700
      const lp3 = ctx.createBiquadFilter()
      lp3.type = 'lowpass'
      lp3.frequency.value = 2000
      const g3 = ctx.createGain()
      g3.gain.value = 0.12   // always on, quiet background presence
      src3.connect(hp3)
      hp3.connect(lp3)
      lp3.connect(g3)
      g3.connect(masterGain)  // bypasses breathGain — always audible
      src3.start()

      sources = [src1, src2, src3]

      // Start scheduler
      nextShushAt = ctx.currentTime + 0.05
      tick()
    },
    stop() {
      stopped = true
      if (timeoutId) { clearTimeout(timeoutId); timeoutId = null }
      sources.forEach((s) => { try { s.stop() } catch (_) {} })
      masterGain?.disconnect()
      sources = []
      masterGain = null
      breathGain = null
      formant = null
    },
    setVolume(v) {
      if (masterGain) masterGain.gain.setTargetAtTime(v, ctx.currentTime, 0.05)
    },
  }
}
// ─── Vacuum Cleaner ───────────────────────────────────────────────────────────
/**
 * Realistic vacuum cleaner:
 *   - Motor harmonic stack: sine oscillators at 50 Hz and harmonics
 *     (50, 100, 150, 200, 250, 300, 400 Hz) — the characteristic "drone"
 *   - Turbulent air suction: band-filtered pink noise 200–3000 Hz
 *   - High-frequency air hiss: white noise 3–8 kHz (light)
 *   - Small random pitch wobble on the motor to add natural variation
 */
export function createVacuumGenerator(ctx) {
  let masterGain = null
  let oscillators = []
  let wobbleLfo = null
  let sources = []

  return {
    start(volume = 0.8) {
      masterGain = ctx.createGain()
      masterGain.gain.value = volume
      masterGain.connect(ctx.destination)

      // ── Deep sub-body rumble: brown noise below 120 Hz ──────────────────────
      // This is the "weight" you feel from a vacuum — the floor vibration layer
      const srcBrown = createBrownNoiseSource(ctx)
      const lpBrown = ctx.createBiquadFilter()
      lpBrown.type = 'lowpass'
      lpBrown.frequency.value = 120
      lpBrown.Q.value = 0.7
      const gBrown = ctx.createGain()
      gBrown.gain.value = 0.55
      srcBrown.connect(lpBrown)
      lpBrown.connect(gBrown)
      gBrown.connect(masterGain)
      srcBrown.start()
      sources.unshift(srcBrown) // add to cleanup list

      // ── Motor harmonics ─────────────────────────────────────────────────────
      // Real vacuums: 2-pole motor at 50 Hz line = 3000 RPM
      // Harmonics decay as 1/n, mixed with slight inharmonicity for realism
      const motorBase = 50 // Hz
      const harmonicAmps = [0.65, 0.42, 0.30, 0.22, 0.16, 0.11, 0.08, 0.05] // louder
      const motorGain = ctx.createGain()
      motorGain.gain.value = 0.52
      motorGain.connect(masterGain)

      // Slight pitch wobble LFO (0.8 Hz, ±1.5 Hz drift — motor load variation)
      wobbleLfo = ctx.createOscillator()
      wobbleLfo.type = 'sine'
      wobbleLfo.frequency.value = 0.8

      for (let n = 1; n <= harmonicAmps.length; n++) {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = motorBase * n

        // Connect wobble LFO → frequency modulation (scaled by harmonic number)
        const wobbleMod = ctx.createGain()
        wobbleMod.gain.value = 1.5 * n
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

      // ── Turbulent air suction — broadband 200-3000 Hz ───────────────────────
      const src1 = createPinkNoiseSource(ctx)
      const hp1 = ctx.createBiquadFilter()
      hp1.type = 'highpass'
      hp1.frequency.value = 200
      const lp1 = ctx.createBiquadFilter()
      lp1.type = 'lowpass'
      lp1.frequency.value = 3000
      lp1.Q.value = 0.5
      // Boost the 600-900 Hz "suction resonance" band
      const boost1 = ctx.createBiquadFilter()
      boost1.type = 'peaking'
      boost1.frequency.value = 700
      boost1.gain.value = 7
      boost1.Q.value = 1.5
      const g1 = ctx.createGain()
      g1.gain.value = 0.62  // was 0.45 — heavier air body
      src1.connect(hp1)
      hp1.connect(lp1)
      lp1.connect(boost1)
      boost1.connect(g1)
      g1.connect(masterGain)
      src1.start()

      // ── High-frequency air hiss 3–8 kHz ─────────────────────────────────────
      const src2 = createWhiteNoiseSource(ctx)
      const hp2 = ctx.createBiquadFilter()
      hp2.type = 'highpass'
      hp2.frequency.value = 3000
      const lp2 = ctx.createBiquadFilter()
      lp2.type = 'lowpass'
      lp2.frequency.value = 8000
      const g2 = ctx.createGain()
      g2.gain.value = 0.28  // was 0.18
      src2.connect(hp2)
      hp2.connect(lp2)
      lp2.connect(g2)
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
export function createGenerator(type, ctx) {
  switch (type) {
    case 'rain':       return createRainGenerator(ctx)
    case 'ocean':      return createOceanGenerator(ctx)
    case 'fan':
    case 'hairdryer':  return createHairdryerGenerator(ctx)
    case 'shh':        return createShhGenerator(ctx)
    case 'vacuum':     return createVacuumGenerator(ctx)
    default:           return createRainGenerator(ctx)
  }
}
