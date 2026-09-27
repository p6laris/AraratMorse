# Changelog

All notable changes to Ararat Morse. Versions are tagged `vX.Y.Z` when they reach `main` and deploy.

## [2.0.0] - 2026-09-27

A rebuild on .NET 10 and MorseSharp 6, and the practice features that MorseSharp 6 made possible.

### Platform
- .NET 10 and MorseSharp 6.1 (from 4.1.4), keeping ahead-of-time compilation. Timing is now
  correct at every speed, and the generated audio no longer clicks.
- Fluxor, Newtonsoft.Json and FluentValidation removed; state lives in a small `AppState`
  service. The download is 35% smaller (12.2 to 7.95 MB gzip) with half the assemblies (73 to 37).
- Installable as a PWA, with an icon set, a web manifest, and an offline service worker in
  published builds.

### Converter
- History of recent conversions, and share links (`?lang=&mode=&text=`) that restore a conversion.
- Prosign help, and plain-language error messages with the technical detail behind "Details".
- Right-to-left layout for Kurdish and Arabic text.
- Sound and Light stay disabled until there's something valid to play.

### Players
- One reusable player for sound and light: a waveform and dot/dash timeline scaled to the sounding
  part, a play/pause toggle, a live elapsed-time readout, and correct state when playback ends.
- Sound: tone presets and custom speed, spacing, pitch and quality, plus WAV download.
- Light: lamp shapes, colours and brightness, the camera flash where supported, and a Safe mode.
  A photosensitivity warning shows before the first full-screen flash, and Safe mode is the
  default when the system asks for reduced motion.

### New pages
- Koch trainer, with Koch order, per-character stats, weighted drills and a streak.
- Callsign and QSO drills, graded word by word.
- Keyer practice with a straight key and iambic paddles.
- Custom alphabet builder.
- Decode from a WAV file and from the microphone.

### Accessibility
- The sidebar and all sheets are reachable and usable by keyboard, with focus kept inside open
  sheets and Escape to close. Space plays or pauses, and `/` focuses the input.
- The system reduce-motion setting is honoured.

### Fixes
- Refreshing or opening a link to any page (for example `/koch`) on GitHub Pages loads that page
  instead of a 404.
- Resuming the light player after a pause plays the rest of the message instead of garbage.
- Audio is no longer rebuilt as a data URI on every render.
- The console error from loading ClipLazor's module as a classic script is gone.

- The unknown-prosign error keeps the brackets, as in "<ZZ> isn't a prosign".
- Settings error messages update as you fix the values, instead of waiting for the next Save.

### CI
- Pull requests and pushes to `dev` build with warnings as errors, check that `app.css` is
  regenerated, and run the `AraratMorse.Tests` unit tests. The deploy verifies its base-href
  rewrite and serves the app as `404.html`.
- The Pages deploy runs the tests first and publishes through GitHub's Pages actions instead of
  a `gh-pages` branch.
- Tagging `vX.Y.Z` creates a GitHub Release with git-cliff notes (`cliff.toml`) and a zipped build.

## [1.0.0]

The original converter: encode and decode in 10 languages, with audio and light playback, on
Blazor WebAssembly with Fluxor and MorseSharp 4.1.4.

[2.0.0]: https://github.com/p6laris/AraratMorse/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/p6laris/AraratMorse/tree/v1.0.0
