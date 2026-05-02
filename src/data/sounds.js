/**
 * Sound definitions for the baby sleep white noise player.
 * Each sound is generated via Web Audio API (no external files needed).
 * type: 'shh' | 'vacuum' | 'hairdryer' | 'rain' | 'ocean'
 */
export const SOUNDS = [
  {
    id: 'shh',
    name: 'Shhh',
    description: 'Classic hushing white noise',
    emoji: '🤫',
    color: 'from-violet-600 to-purple-900',
    accentColor: 'bg-violet-400',
    type: 'shh',
  },
  {
    id: 'vacuum',
    name: 'Vacuum',
    description: 'Deep rumbling vacuum cleaner',
    emoji: '🧹',
    color: 'from-amber-600 to-orange-900',
    accentColor: 'bg-amber-400',
    type: 'vacuum',
  },
  {
    id: 'hairdryer',
    name: 'Hair Dryer',
    description: 'Warm rushing air & motor hum',
    emoji: '💨',
    color: 'from-rose-500 to-pink-900',
    accentColor: 'bg-rose-400',
    type: 'hairdryer',
  },
  {
    id: 'rain',
    name: 'Rain',
    description: 'Steady rainfall to soothe',
    emoji: '🌧️',
    color: 'from-blue-600 to-blue-900',
    accentColor: 'bg-blue-400',
    type: 'rain',
  },
  {
    id: 'ocean',
    name: 'Ocean Waves',
    description: 'Gentle waves on the shore',
    emoji: '🌊',
    color: 'from-cyan-600 to-teal-900',
    accentColor: 'bg-cyan-400',
    type: 'ocean',
  },
]
