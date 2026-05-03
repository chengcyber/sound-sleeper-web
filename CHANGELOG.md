# Changelog

All notable changes to Sound Sleeper will be documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

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
