import { clsx } from 'clsx'

/**
 * SoundCard — individual selectable sound tile in the grid.
 * Props:
 *   sound       – sound object from SOUNDS[]
 *   isActive    – whether this sound is the currently selected one
 *   isPlaying   – whether audio is currently playing
 *   onClick     – callback when card is tapped/clicked
 */
export default function SoundCard({ sound, isActive, isPlaying, onClick }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative flex flex-col items-center justify-center gap-3',
        'w-full aspect-square rounded-2xl overflow-hidden',
        'transition-all duration-300 select-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
        isActive
          ? 'ring-2 ring-white/60 scale-[0.97]'
          : 'ring-1 ring-white/10 hover:ring-white/30 active:scale-[0.95]'
      )}
    >
      {/* Background gradient */}
      <div
        className={clsx(
          'absolute inset-0 bg-gradient-to-br opacity-80 transition-opacity duration-300',
          sound.color,
          isActive ? 'opacity-100' : 'opacity-60 hover:opacity-80'
        )}
      />

      {/* Subtle texture overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08)_0%,transparent_70%)]" />

      {/* Playing indicator ring animation */}
      {isActive && isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full border-2 border-white/20 animate-ping" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-2 px-2">
        <span
          className={clsx(
            'transition-all duration-300',
            'text-4xl md:text-5xl leading-none',
            isActive && isPlaying ? 'scale-110' : 'scale-100'
          )}
        >
          {sound.emoji}
        </span>
        <span className="text-white font-semibold text-sm md:text-base text-center leading-tight drop-shadow">
          {sound.name}
        </span>
        <span className="text-white/70 text-xs text-center leading-tight hidden sm:block">
          {sound.description}
        </span>
      </div>

      {/* Active playing indicator dot */}
      {isActive && (
        <div
          className={clsx(
            'absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full',
            sound.accentColor,
            isPlaying ? 'animate-pulse' : 'opacity-60'
          )}
        />
      )}
    </button>
  )
}
