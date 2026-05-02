import { useState, useRef, useCallback, useEffect } from 'react'
import { createGenerator } from '../audio/generators'

/**
 * Core audio player hook.
 * Manages Web Audio API context lifecycle, sound selection,
 * play/pause, volume, and a countdown sleep timer.
 */
export function useAudioPlayer() {
  const [currentSound, setCurrentSound] = useState(null) // sound object from SOUNDS[]
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(0.75)
  const [timerMinutes, setTimerMinutes] = useState(null) // null = off
  const [timeLeft, setTimeLeft] = useState(null) // seconds remaining

  const ctxRef = useRef(null)
  const generatorRef = useRef(null)
  const timerIntervalRef = useRef(null)
  const volumeRef = useRef(0.75)

  // ─── AudioContext lazy init ───────────────────────────────────────────────
  function getCtx() {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    return ctxRef.current
  }

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
  }, [])

  // ─── Internal: stop generator ────────────────────────────────────────────
  const stopGenerator = useCallback(() => {
    if (generatorRef.current) {
      generatorRef.current.stop()
      generatorRef.current = null
    }
  }, [])

  // ─── Select sound (auto-plays) ────────────────────────────────────────────
  const selectSound = useCallback(
    (sound) => {
      // If same sound tapped while playing → toggle play/pause
      if (currentSound?.id === sound.id) {
        if (isPlaying) {
          stopGenerator()
          setIsPlaying(false)
        } else {
          startGenerator(sound, volumeRef.current)
          setIsPlaying(true)
        }
        return
      }
      // Stop previous
      stopGenerator()
      // Start new
      startGenerator(sound, volumeRef.current)
      setCurrentSound(sound)
      setIsPlaying(true)
    },
    [currentSound, isPlaying, startGenerator, stopGenerator]
  )

  // ─── Play / Pause ─────────────────────────────────────────────────────────
  const play = useCallback(() => {
    if (!currentSound) return
    startGenerator(currentSound, volumeRef.current)
    setIsPlaying(true)
  }, [currentSound, startGenerator])

  const pause = useCallback(() => {
    stopGenerator()
    setIsPlaying(false)
  }, [stopGenerator])

  // ─── Volume ───────────────────────────────────────────────────────────────
  const setVolume = useCallback((v) => {
    volumeRef.current = v
    setVolumeState(v)
    if (generatorRef.current) {
      generatorRef.current.setVolume(v)
    }
  }, [])

  // ─── Sleep Timer ──────────────────────────────────────────────────────────
  const clearTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    setTimeLeft(null)
  }, [])

  const setTimer = useCallback(
    (minutes) => {
      clearTimer()
      if (!minutes) {
        setTimerMinutes(null)
        return
      }
      setTimerMinutes(minutes)
      let remaining = minutes * 60
      setTimeLeft(remaining)

      timerIntervalRef.current = setInterval(() => {
        remaining -= 1
        setTimeLeft(remaining)
        if (remaining <= 0) {
          clearInterval(timerIntervalRef.current)
          timerIntervalRef.current = null
          setTimeLeft(null)
          setTimerMinutes(null)
          // Fade out then stop
          stopGenerator()
          setIsPlaying(false)
        }
      }, 1000)
    },
    [clearTimer, stopGenerator]
  )

  // ─── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopGenerator()
      clearTimer()
      try { ctxRef.current?.close() } catch (_) {}
    }
  }, [stopGenerator, clearTimer])

  // ─── Format time ─────────────────────────────────────────────────────────
  function formatTime(seconds) {
    if (seconds == null) return null
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  return {
    currentSound,
    isPlaying,
    volume,
    timerMinutes,
    timeLeft,
    timeLeftFormatted: formatTime(timeLeft),
    selectSound,
    play,
    pause,
    setVolume,
    setTimer,
  }
}
