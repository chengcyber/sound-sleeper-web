import { useState, useRef, useCallback, useEffect } from 'react'
import { createGenerator } from '../audio/generators'

/**
 * Core audio player hook.
 *
 * Both sounds (Shhh, Vacuum) are backed by HTMLAudioElement.
 * On iOS, HTMLAudioElement IS the audio session — calling .pause() keeps the
 * lock screen card alive (the OS shows "paused" state).  Calling .play()
 * resumes it.  No Web Audio / silent-audio keep-alive tricks are needed.
 */
export function useAudioPlayer() {
  const [currentSound, setCurrentSound] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(0.75)

  const generatorRef = useRef(null)
  const volumeRef = useRef(0.75)

  // Refs kept in sync so Media Session event handlers can read current values
  const isPlayingRef = useRef(false)
  const currentSoundRef = useRef(null)

  // ─── Internal helpers ─────────────────────────────────────────────────────
  const startGenerator = useCallback((sound, vol) => {
    // Tear down any existing generator first
    if (generatorRef.current) {
      generatorRef.current.stop()
      generatorRef.current = null
    }
    const gen = createGenerator(sound.type)
    gen.start(vol)
    generatorRef.current = gen
  }, [])

  // ─── Select sound (auto-plays) ────────────────────────────────────────────
  const selectSound = useCallback(
    (sound) => {
      if (currentSound?.id === sound.id) {
        // Same sound → toggle play / pause
        if (isPlaying) {
          generatorRef.current?.pause()
          setIsPlaying(false)
          isPlayingRef.current = false
        } else {
          generatorRef.current?.resume()
          setIsPlaying(true)
          isPlayingRef.current = true
        }
        return
      }
      // Different sound → start fresh
      startGenerator(sound, volumeRef.current)
      setCurrentSound(sound)
      currentSoundRef.current = sound
      setIsPlaying(true)
      isPlayingRef.current = true
    },
    [currentSound, isPlaying, startGenerator]
  )

  // ─── Play / Pause ─────────────────────────────────────────────────────────
  const play = useCallback(() => {
    if (!currentSound) return
    if (generatorRef.current) {
      generatorRef.current.resume()
    } else {
      startGenerator(currentSound, volumeRef.current)
    }
    setIsPlaying(true)
    isPlayingRef.current = true
  }, [currentSound, startGenerator])

  const pause = useCallback(() => {
    generatorRef.current?.pause()
    setIsPlaying(false)
    isPlayingRef.current = false
  }, [])

  // ─── Volume ───────────────────────────────────────────────────────────────
  const setVolume = useCallback((v) => {
    volumeRef.current = v
    setVolumeState(v)
    generatorRef.current?.setVolume(v)
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
        if (generatorRef.current) {
          generatorRef.current.resume()
        } else {
          startGenerator(currentSoundRef.current, volumeRef.current)
        }
        setIsPlaying(true)
        isPlayingRef.current = true
        navigator.mediaSession.playbackState = 'playing'
      }
    })

    navigator.mediaSession.setActionHandler('pause', () => {
      if (isPlayingRef.current) {
        generatorRef.current?.pause()
        setIsPlaying(false)
        isPlayingRef.current = false
        navigator.mediaSession.playbackState = 'paused'
      }
    })

    navigator.mediaSession.setActionHandler('stop', () => {
      generatorRef.current?.stop()
      generatorRef.current = null
      setIsPlaying(false)
      isPlayingRef.current = false
      navigator.mediaSession.playbackState = 'none'
    })

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
  }, [currentSound, isPlaying, startGenerator])

  // ─── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      generatorRef.current?.stop()
    }
  }, [])

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
