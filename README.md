# Sound Sleeper

A minimal white noise PWA for falling asleep. Pick a sound, set the volume, lock your phone — the audio keeps playing in the background with a lock screen card.

## Features

- **Two sounds** — Shhh (shushing) and Vacuum cleaner
- **Volume control** with real-time track fill
- **PWA** — installable on iOS and Android, works offline
- **iOS lock screen card** — Media Session API integration for lock screen play/pause controls
- Looping, low-latency native `HTMLAudioElement` playback

## Getting Started

```bash
npm install
npm run dev        # http://localhost:5173
```

## Build

```bash
npm run build      # output → dist/
npm run preview    # preview the production build locally
```

## Regenerate Icons

Place your source icon at `public/favicon.png` (or `public/favicon.svg`), then:

```bash
node scripts/gen-icons.mjs
```

This generates all PWA icon sizes under `public/icons/`.

## Project Structure

```
src/
  audio/
    generators.js       # HTMLAudioElement players (start/pause/resume/stop/setVolume)
  components/
    Player.jsx          # Main UI — sound grid + volume slider
    SoundCard.jsx       # Individual sound card
  data/
    sounds.js           # Sound definitions (id, label, emoji)
  hooks/
    useAudioPlayer.js   # Audio state + Media Session API integration
public/
  audio/                # shh.mp3, vacuum.mp3
  icons/                # Generated PWA icons
```

## iOS Notes

iOS keeps the lock screen audio card alive as long as `HTMLAudioElement` is playing. When the user pauses, the card disappears — this is expected iOS behaviour. There is no way to silence audio and keep the session alive simultaneously on iOS (`audio.volume` is hardware-only and cannot be changed from JavaScript; `audio.muted = true` and `audio.pause()` both terminate the session).

## Tech Stack

- [React 19](https://react.dev)
- [Vite](https://vite.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
