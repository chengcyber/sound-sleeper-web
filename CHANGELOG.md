# Changelog

All notable changes to Sound Sleeper will be documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
