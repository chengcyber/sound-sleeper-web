import { useRegisterSW } from 'virtual:pwa-register/react'
import { SOUNDS } from './data/sounds'
import { useAudioPlayer } from './hooks/useAudioPlayer'
import SoundCard from './components/SoundCard'
import Player from './components/Player'

export default function App() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  const {
    currentSound,
    isPlaying,
    volume,
    timerMinutes,
    timeLeft,
    timeLeftFormatted,
    selectSound,
    play,
    pause,
    setVolume,
    setTimer,
  } = useAudioPlayer()

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col font-sans">
      {needRefresh && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-3 whitespace-nowrap">
          <span>有新版本可用</span>
          <button
            className="underline font-semibold"
            onClick={() => updateServiceWorker(true)}
          >
            立即更新
          </button>
        </div>
      )}
      {/* Stars / dots decorative background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: (Math.sin(i * 7.3) * 0.5 + 1) * 2 + 'px',
              height: (Math.sin(i * 7.3) * 0.5 + 1) * 2 + 'px',
              top: ((Math.sin(i * 3.1) * 0.5 + 0.5) * 100).toFixed(2) + '%',
              left: ((Math.cos(i * 5.7) * 0.5 + 0.5) * 100).toFixed(2) + '%',
              opacity: (Math.sin(i * 2.4) * 0.3 + 0.2).toFixed(2),
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 text-center px-4 pt-10 pb-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-3xl">🌙</span>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Sound Sleeper
          </h1>
        </div>
        <p className="text-white/40 text-sm md:text-base">
          Soothing white noise for better baby sleep
        </p>
      </header>

      {/* Sound Grid */}
      <main className="relative z-10 flex-1 px-4 pb-56">
        <div className="max-w-xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
            {SOUNDS.map((sound) => (
              <SoundCard
                key={sound.id}
                sound={sound}
                isActive={currentSound?.id === sound.id}
                isPlaying={isPlaying && currentSound?.id === sound.id}
                onClick={() => selectSound(sound)}
              />
            ))}
          </div>

          {!currentSound && (
            <p className="text-center text-white/25 text-sm mt-8">
              Tap a sound to begin
            </p>
          )}
        </div>
      </main>

      {/* Sticky Player */}
      <Player
        currentSound={currentSound}
        isPlaying={isPlaying}
        volume={volume}
        timerMinutes={timerMinutes}
        timeLeft={timeLeft}
        timeLeftFormatted={timeLeftFormatted}
        onPlay={play}
        onPause={pause}
        onVolumeChange={setVolume}
        onSetTimer={setTimer}
      />
    </div>
  )
}
