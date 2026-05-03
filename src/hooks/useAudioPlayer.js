import { useState, useRef, useCallback, useEffect } from 'react'
import { createGenerator } from '../audio/generators'

/**
 * A 0.5-second silent WAV encoded as a data URI.
 * Used as a looping <audio> element to keep the iOS/Android audio session
 * alive when the screen locks, preventing Web Audio from being killed.
 */
const SILENT_AUDIO_URI =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='

/**
 * Core audio player hook.
 * Manages Web Audio API context lifecycle, sound selection,
 * play/pause, volume, and a countdown sleep timer.
 *
 * Background-playback strategy (tablets / phones):
 *  1. Silent <audio> loop   — tricks iOS/Android into maintaining an active
 *     audio session even when the screen locks, so Web Audio keeps running.
 *  2. visibilitychange      — resumes a suspended AudioContext and restarts
 *     the generator if the user returns to the tab while it was "playing".
 *
 * Note: Screen Wake Lock is intentionally NOT used — for a sleep/ambient
 * sound app the user wants the screen to turn off while audio keeps playing.
 */
export function useAudioPlayer() {
  const [currentSound, setCurrentSound] = useState(null) // sound object from SOUNDS[]
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(0.75)

  const ctxRef = useRef(null)
  const generatorRef = useRef(null)
  const volumeRef = useRef(0.75)

  // Refs kept in sync with state so event listeners can read current values
  const isPlayingRef = useRef(false)
  const currentSoundRef = useRef(null)

  // Silent audio element — keeps the audio session alive on mobile
  const silentAudioRef = useRef(null)

  // ─── AudioContext lazy init ───────────────────────────────────────────────
  function getCtx() {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    return ctxRef.current
  }

  // ─── Silent audio session (iOS/Android keep-alive) ────────────────────────
  const startSilentAudio = useCallback(() => {
    if (!silentAudioRef.current) {
      const audio = new Audio(SILENT_AUDIO_URI)
      audio.loop = true
      audio.volume = 0
      silentAudioRef.current = audio
    }
    silentAudioRef.current.play().catch(() => {})
  }, [])

  const stopSilentAudio = useCallback(() => {
    if (silentAudioRef.current) {
      silentAudioRef.current.pause()
    }
  }, [])

  // ─── Internal: start generator ───────────────────────────────────────────
  const startGenerator = useCallback(async (sound, vol) => {
    const ctx = getCtx()
    // AudioContext starts suspended in modern browsers — must await resume()
    // before starting Web Audio nodes, otherwise they play silently.
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    const gen = createGenerator(sound.type, ctx)
    gen.start(vol)
    generatorRef.current = gen
    startSilentAudio()
  }, [startSilentAudio])

  // ─── Internal: stop generator ────────────────────────────────────────────
  // keepSession=true: stop Web Audio but keep the silent <audio> running so
  // iOS maintains the audio session and the lock screen card stays visible.
  const stopGenerator = useCallback((keepSession = false) => {
    if (generatorRef.current) {
      generatorRef.current.stop()
      generatorRef.current = null
    }
    if (!keepSession) {
      stopSilentAudio()
    }
  }, [stopSilentAudio])

  // ─── Select sound (auto-plays) ────────────────────────────────────────────
  const selectSound = useCallback(
    (sound) => {
      // If same sound tapped while playing → toggle play/pause
      if (currentSound?.id === sound.id) {
        if (isPlaying) {
          stopGenerator()
          setIsPlaying(false)
          isPlayingRef.current = false
        } else {
          startGenerator(sound, volumeRef.current)
          setIsPlaying(true)
          isPlayingRef.current = true
        }
        return
      }
      // Stop previous
      stopGenerator()
      // Start new
      startGenerator(sound, volumeRef.current)
      setCurrentSound(sound)
      currentSoundRef.current = sound
      setIsPlaying(true)
      isPlayingRef.current = true
    },
    [currentSound, isPlaying, startGenerator, stopGenerator]
  )

  // ─── Play / Pause ─────────────────────────────────────────────────────────
  const play = useCallback(() => {
    if (!currentSound) return
    startGenerator(currentSound, volumeRef.current)
    setIsPlaying(true)
    isPlayingRef.current = true
  }, [currentSound, startGenerator])

  const pause = useCallback(() => {
    stopGenerator(true) // keep silent audio alive so iOS session persists
    setIsPlaying(false)
    isPlayingRef.current = false
  }, [stopGenerator])

  // ─── Volume ───────────────────────────────────────────────────────────────
  const setVolume = useCallback((v) => {
    volumeRef.current = v
    setVolumeState(v)
    if (generatorRef.current) {
      generatorRef.current.setVolume(v)
    }
  }, [])

  // ─── Media Session API (lock screen controls) ─────────────────────────────
  useEffect(() => {
    if (!('mediaSession' in navigator)) return

    if (currentSound) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSound.name,
        artist: 'Sound Sleeper',
        album: 'White Noise',
      })
    }

    navigator.mediaSession.setActionHandler('play', () => {
      if (!isPlayingRef.current && currentSoundRef.current) {
        startGenerator(currentSoundRef.current, volumeRef.current)
        setIsPlaying(true)
        isPlayingRef.current = true
        navigator.mediaSession.playbackState = 'playing'
      }
    })

    navigator.mediaSession.setActionHandler('pause', () => {
      if (isPlayingRef.current) {
        stopGenerator(true) // keep silent audio alive
        setIsPlaying(false)
        isPlayingRef.current = false
        navigator.mediaSession.playbackState = 'paused'
      }
    })

    navigator.mediaSession.setActionHandler('stop', () => {
      stopGenerator(false) // full stop
      setIsPlaying(false)
      isPlayingRef.current = false
      navigator.mediaSession.playbackState = 'none'
    })

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
  }, [currentSound, isPlaying, startGenerator, stopGenerator])

  // ─── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopGenerator()
      try { ctxRef.current?.close() } catch (_) {}
    }
  }, [stopGenerator])

  // ─── Background / screen-off recovery ────────────────────────────────────
  useEffect(() => {
    // When the tab becomes visible again, resume a suspended AudioContext and
    // restart the generator if we are supposed to be playing. This covers the
    // case where the browser suspended audio while the screen was off.
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const ctx = ctxRef.current
        if (!ctx) return

        if (ctx.state === 'suspended' && isPlayingRef.current) {
          try {
            await ctx.resume()
          } catch (_) {}

          // Generator may have been garbage-collected; restart it
          if (!generatorRef.current && currentSoundRef.current) {
            const gen = createGenerator(currentSoundRef.current.type, ctx)
            gen.start(volumeRef.current)
            generatorRef.current = gen
            startSilentAudio()
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [startSilentAudio])

  return {
    currentSound,
    isPlaying,
    volume,
    selectSound,
    play,
    pause,
    setVolume,
  }
}
