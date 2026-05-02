import { clsx } from 'clsx'
import SleepTimer from './SleepTimer'

/**
 * Player — sticky bottom panel with:
 *   - Current sound name + status
 *   - Play / Pause button
 *   - Volume slider
 *   - Sleep timer section
 */
export default function Player({
  currentSound,
  isPlaying,
  volume,
  timerMinutes,
  timeLeft,
  timeLeftFormatted,
  onPlay,
  onPause,
  onVolumeChange,
  onSetTimer,
}) {
  const hasSound = !!currentSound

  return (
    <div
      className={clsx(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-gray-900/95 backdrop-blur-xl',
        'border-t border-white/10',
        'pb-safe' // safe area for iPhone home bar (uses CSS env())
      )}
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
    >
      {/* Timer Section */}
      <SleepTimer
        timerMinutes={timerMinutes}
        timeLeft={timeLeft}
        timeLeftFormatted={timeLeftFormatted}
        onSetTimer={onSetTimer}
      />

      {/* Divider */}
      <div className="h-px bg-white/5 mx-4" />

      {/* Main controls */}
      <div className="flex items-center gap-4 px-4 py-3">
        {/* Sound info */}
        <div className="flex-1 min-w-0">
          {hasSound ? (
            <div className="flex items-center gap-2.5">
              <span className="text-2xl leading-none">{currentSound.emoji}</span>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">
                  {currentSound.name}
                </p>
                <p className="text-white/50 text-xs">
                  {isPlaying ? 'Playing…' : 'Paused'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-white/40 text-sm">Select a sound to start</p>
          )}
        </div>

        {/* Volume slider */}
        <div className="flex items-center gap-2 w-28 md:w-36">
          <span className="text-white/40 text-xs select-none">
            {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            disabled={!hasSound}
            className={clsx(
              'flex-1 h-1.5 rounded-full appearance-none cursor-pointer',
              'accent-indigo-500',
              '[&::-webkit-slider-runnable-track]:rounded-full',
              '[&::-webkit-slider-runnable-track]:bg-white/20',
              '[&::-webkit-slider-thumb]:appearance-none',
              '[&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5',
              '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-400',
              '[&::-webkit-slider-thumb]:cursor-pointer',
              !hasSound && 'opacity-40'
            )}
          />
        </div>

        {/* Play / Pause button */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={!hasSound}
          className={clsx(
            'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
            'transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
            hasSound
              ? 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-lg shadow-indigo-900/50'
              : 'bg-white/10 opacity-40 cursor-not-allowed'
          )}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            // Pause icon
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            // Play icon
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current ml-0.5">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
