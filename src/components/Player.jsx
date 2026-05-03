import { clsx } from 'clsx'

/**
 * Player — sticky bottom panel with:
 *   - Volume row (full-width, always interactive)
 *   - Sound info + Play/Pause button
 */
export default function Player({
  currentSound,
  isPlaying,
  volume,
  onPlay,
  onPause,
  onVolumeChange,
}) {
  const hasSound = !!currentSound
  const volumePct = Math.round(volume * 100)
  const volumeIcon = volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'

  return (
    <div
      className={clsx(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-gray-900/95 backdrop-blur-xl',
        'border-t border-white/10'
      )}
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
    >
      {/* Volume row — always interactive */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-1">
        <span className="text-base select-none w-6 text-center">{volumeIcon}</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.02}
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className={clsx(
            'flex-1 h-2 rounded-full appearance-none cursor-pointer',
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5',
            '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-400',
            '[&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-webkit-slider-thumb]:shadow-md',
            '[&::-webkit-slider-thumb]:border-0',
            '[&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5',
            '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-400',
            '[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer',
            '[&::-moz-range-track]:rounded-full [&::-moz-range-track]:h-2'
          )}
          style={{
            background: `linear-gradient(to right, rgb(129 140 248) ${volumePct}%, rgba(255,255,255,0.2) ${volumePct}%)`,
          }}
          aria-label="Volume"
        />
        <span className="text-white/50 text-xs tabular-nums w-8 text-right select-none">
          {volumePct}%
        </span>
      </div>

      {/* Main controls */}
      <div className="flex items-center gap-4 px-4 py-2.5">
        {/* Sound info */}
        <div className="flex-1 min-w-0">
          {hasSound ? (
            <div className="flex items-center gap-2.5">
              <span className="text-2xl leading-none">{currentSound.emoji}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-white font-semibold text-sm truncate">
                    {currentSound.name}
                  </p>
                  {isPlaying && (
                    <span className="inline-flex items-center justify-center rounded px-1 py-0.5 bg-white/10 text-white/60 flex-shrink-0">
                      <svg viewBox="0 0 18 18" className="w-3 h-3 fill-current" aria-label="Loop">
                        <path d="M2 5h11v2l3-3-3-3v2H1v5h1V5zm14 8H3v-2l-3 3 3 3v-2h13V9h-1v4z"/>
                      </svg>
                      <span className="text-[10px] font-bold leading-none ml-0.5">1</span>
                    </span>
                  )}
                </div>
                <p className="text-white/50 text-xs">
                  {isPlaying ? 'Playing' : 'Paused'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-white/40 text-sm">Select a sound to start</p>
          )}
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
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current ml-0.5">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
