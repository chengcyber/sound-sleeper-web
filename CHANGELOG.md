# Changelog

All notable changes to Sound Sleeper will be documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.3.1] - 2026-05-03
### Changed
- Audio fades in gradually from silence to the target volume when playback starts or resumes, instead of jumping to full volume immediately

## [1.3.0] - 2026-05-03
### Added
- Hair Dryer white noise (`hairdryer.mp3`) as a new sound option

### Changed
- Updated Shhh audio file (`shh.mp3`) with a new recording

## [1.2.6] - 2026-05-03
### Fixed
- Pause had no effect: `audio.volume` changes are silently ignored by iOS
  (volume is hardware-only). Reverted to simple `audio.pause()` / `audio.play()`.
  The lock screen card persists while audio is playing and disappears when
  explicitly paused — correct and expected iOS behaviour.

## [1.2.5] - 2026-05-03
### Fixed
- Audio still silent on screen lock: `AudioContext.resume()` is not permitted
  from the background on iOS — any Web Audio routing (MediaElementSourceNode →
  GainNode) is silenced the moment the screen locks. Removed Web Audio entirely.
  "Pause" now sets `audio.volume = 0.001` directly on the HTMLAudioElement
  (non-zero, so iOS keeps the native audio session and lock screen card alive).

## [1.2.4] - 2026-05-03
### Fixed
- Audio silent immediately on screen lock: iOS suspends the AudioContext when
  the screen locks, blocking the GainNode pipeline even though the
  HTMLAudioElement is still playing. Fixed by adding `ctx.onstatechange` that
  calls `ctx.resume()` whenever the context enters the "suspended" state, keeping
  audio flowing through the GainNode and the lock screen card alive.

## [1.2.3] - 2026-05-02
### Fixed
- iOS lock screen card disappears on pause: `audio.muted=true` also causes iOS
  to end the session. Only truly working fix: route HTMLAudioElement through
  a Web Audio MediaElementSourceNode → GainNode, and on "pause" ramp gain to
  0.001 (inaudible but non-zero). iOS sees continuous audio output and keeps
  the lock screen card alive indefinitely. Resume ramps gain back to userVolume.

## [1.2.2] - 2026-05-02
### Fixed
- Pause did not silence audio on iOS: `audio.volume = 0` is a no-op on iOS
  (volume is hardware-controlled); replaced with `audio.muted = true/false`
  which iOS does allow via JavaScript

## [1.2.1] - 2026-05-02
### Fixed
- iOS lock screen card disappears after a few seconds of pause: switched from
  `audio.pause()` to `audio.volume = 0` (muted-playing) so the HTMLAudioElement
  session stays active indefinitely; resume restores volume instantly with no
  async `.play()` call, which also fixes the "quick resume doesn't work" issue

## [1.2.0] - 2026-05-02
### Changed
- Removed Hair Dryer, Rain, and Ocean Waves sounds; app now focuses on Shhh and Vacuum only
### Fixed
- iOS lock screen pause button now actually pauses audio for HTMLAudioElement-based sounds
  (previous mute-trick only worked for Web Audio nodes; HTMLAudioElement correctly retains
  the lock screen card when `.pause()` is called, no keep-alive hacks needed)
- Removed all silent-audio keep-alive and AudioContext complexity from useAudioPlayer

## [1.1.3] - 2026-05-02
### Fixed
- iOS lock screen card disappears after pause: stop calling `stopGenerator` on pause; instead mute the Web Audio node to near-zero volume so the audio session and lock screen card remain alive. Resume unmutes rather than restarts the generator.

## [1.1.2] - 2026-05-02

### Fixed
- iOS lock screen card no longer disappears after pausing — silent `<audio>`
  keep-alive is now maintained during pause so the OS audio session stays
  active; the lock screen play button correctly resumes playback

---

## [1.1.1] - 2026-05-02

### Fixed
- iOS lock screen play/pause controls now work correctly — registered Media
  Session API handlers (`play`, `pause`, `stop`) so the system media card
  responds to user interaction; lock screen card also displays the sound name
- Volume slider visual bug fixed — replaced `accent-color` + webkit track
  classes with a dynamic inline `linear-gradient` that correctly fills the
  track left of the thumb on all browsers (WebKit / Firefox)

---

## [1.1.0] - 2026-05-02

### Changed
- Removed Sleep Timer — simplified the player bar and reduced its height
- Volume control redesigned: now a full-width row above the playback controls,
  with a larger touch-friendly slider and percentage readout
- Volume can now be adjusted at any time, even before a sound is selected

---

## [1.0.1] - 2026-05-02

### Fixed
- Favicon and PWA icons now have perfectly equal padding on all sides —
  content is trimmed to its bounding box first, then centered in a square
  canvas with 6% uniform padding, eliminating uneven whitespace
- Regenerated `favicon.svg` from the corrected square source
- Excluded oversized `favicon.png` source file from Workbox precache to fix
  PWA build error (was 2.73 MB, exceeding the 2 MiB limit)

---

## [1.0.0] - 2026-05-02

### Added
- Initial release with 5 white noise sounds: Rain, Ocean, Vacuum, Hairdryer, Shh
- Web Audio API sound generators (no audio files needed for synthesis)
- Volume control and sleep timer (15 / 30 / 60 / 90 min)
- PWA support — installable on iPad/iPhone via "Add to Home Screen"
  - Service Worker with Workbox (precache JS/CSS/HTML, runtime cache audio)
  - `autoUpdate` strategy: new version activates on next page load
  - In-app update banner when a new version is available
- Background audio keep-alive: silent `<audio>` loop maintains iOS audio
  session so white noise continues after screen locks
- `visibilitychange` recovery: resumes suspended AudioContext when screen
  wakes up
- App version displayed in header (injected at build time from package.json)
