import { clsx } from 'clsx'

const PRESETS = [15, 30, 60, 90]

/**
 * SleepTimer — preset buttons and countdown display.
 * Props:
 *   timerMinutes  – currently set timer in minutes (null = off)
 *   timeLeft      – seconds remaining (null if not running)
 *   timeLeftFormatted – "MM:SS" string
 *   onSetTimer    – callback(minutes | null)
 */
export default function SleepTimer({
  timerMinutes,
  timeLeft,
  timeLeftFormatted,
  onSetTimer,
}) {
  const isActive = timeLeft != null

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">⏱️</span>
          <span className="text-white/80 font-medium text-sm">Sleep Timer</span>
        </div>
        {isActive && (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-indigo-300 font-mono font-semibold text-sm tabular-nums">
              {timeLeftFormatted}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {PRESETS.map((min) => {
          const isSelected = timerMinutes === min && isActive
          return (
            <button
              key={min}
              onClick={() => onSetTimer(isSelected ? null : min)}
              className={clsx(
                'flex-1 min-w-[60px] py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70',
                isSelected
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white active:bg-white/5'
              )}
            >
              {min}m
            </button>
          )
        })}
        {isActive && (
          <button
            onClick={() => onSetTimer(null)}
            className={clsx(
              'flex-1 min-w-[60px] py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200',
              'bg-red-900/40 text-red-300 hover:bg-red-900/60 active:bg-red-900/20',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70'
            )}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
