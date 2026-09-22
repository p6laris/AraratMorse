# AraratMorse Roadmap

Getting the app from where it is (Blazor WASM on net9.0, MorseSharp 4.1.4, Fluxor everywhere) to a
smaller, faster, correct app on MorseSharp 6.x with plain injected services, plus the features the
new library makes possible: practice lessons, audio decoding, the keyer, and a properly working
light player.

Phases are ordered so each one lands on a working app. Nothing in a later phase blocks an earlier
one from shipping.

---

## Contents

- [Phase 0: Groundwork](#phase-0-groundwork)
- [Phase 1: Adopt MorseSharp 6](#phase-1-adopt-morsesharp-6)
- [Phase 2: Remove Fluxor](#phase-2-remove-fluxor)
- [Phase 3: Bug fixes](#phase-3-bug-fixes)
- [Phase 4: Sound section rework](#phase-4-sound-section-rework)
- [Phase 5: Light section rework](#phase-5-light-section-rework)
- [Phase 6: New features from MorseSharp 6](#phase-6-new-features-from-morsesharp-6)
- [Phase 7: UI improvements](#phase-7-ui-improvements)
- [Phase 8: Performance](#phase-8-performance)
- [Phase 9: CI and release](#phase-9-ci-and-release)

---

## Phase 0: Groundwork

Housekeeping before anything else, so later diffs stay readable.

- [x] Retarget `AraratMorse.csproj` from `net9.0` to `net10.0` (MorseSharp 6 requires it) and bump
      `global.json` / workflow SDK to 10.x. (No `global.json` existed; workflow's `setup-dotnet`
      bumped to `10.x`. `Fluxor.Blazor.Web` also needed bumping 6.6.0 → 6.11.0 and
      `Microsoft.AspNetCore.Components.WebAssembly(.DevServer)` 9.0.3 → 10.0.12 to resolve on
      net10; neither was called out explicitly but both were required for restore to succeed.)
- [x] Delete the machine-specific `<Content Remove="C:\Users\Yunis Surchy\...">` entries in the
      csproj. They reference absolute paths on old machines and do nothing on anyone else's.
- [x] Drop `Newtonsoft.Json`. Nothing in the app needs it that `System.Text.Json` (already in the
      runtime) can't do, and it's dead weight in a WASM AOT bundle.
- [x] Drop `Fluxor.Blazor.Web.ReduxDevTools` immediately even before Phase 2; dev tooling has no
      business in the published bundle.
- [x] Update `ClipLazor` and `Blazored.FluentValidation` to current versions. (ClipLazor 3.0.2 →
      4.0.0, which also requires net10.0 and renamed its `ClipLazor.Extention` namespace to the
      correctly-spelled `ClipLazor.Extensions` — updated `Program.cs`'s `using`.
      Blazored.FluentValidation was already on the latest stable, 2.2.0.)
- [x] Add a `Directory.Build.props` with `Nullable`, `ImplicitUsings`, `LangVersion` so the csproj
      shrinks to packages and content only.

## Phase 1: Adopt MorseSharp 6

The library jump is 4.1.4 to 6.x, which crosses two majors. The API shape is the same fluent
chain, but several calls changed and two behaviours changed underneath.

Package and API migration:

- [x] Bump `MorseSharp` to the latest 6.x. (6.1.0 — 6.0.1 was current when this phase started, but
      it had no public API to enumerate a whole language's alphabet, which `About.razor`'s rules
      table needed; `MorseAlphabet.ForLanguage(Language).Characters`/`.Prosigns` were added in
      6.1.0 specifically to close that gap. See notes below.)
- [x] Replace every `GetBytes(out var spanByte)` with `GetBytes()`. The `out` overload was
      returning a span over a pooled array that had already been returned to the pool; it's
      `[Obsolete]` in 6.x for that reason. `SoundSection.Convert()` has two of these.
- [x] `SetAudioOptions` now takes an optional `AudioFormat`. Leave it off at first; Phase 4 uses it.
- [x] `DoBlinks` now takes a `CancellationToken`. Pass the section's token instead of checking it
      manually inside the callback (see Phase 5). (Callback shape also changed from an async
      `Func<bool, Task>` to a synchronous `Action<bool>` that runs on the captured sync context —
      `LightSection`'s `DoBlinksAsync` became a plain `DoBlinksCallback` calling `StateHasChanged()`
      directly instead of `await InvokeAsync(StateHasChanged)`. `Task.Run` wrapper and the
      offset-based `Pause`/`Stop` logic are untouched here; those are Phase 3/5 work.)
- [x] Check every `catch` around library calls: 6.x throws `ArgumentOutOfRangeException` for bad
      speeds/frequency and `SmallerCharSpeedException` when charSpeed < wordSpeed, same as before,
      but messages and some exception types moved. `TranslationError.razor` displays these strings.
      (Verified by hand — confirmed the two exception types/messages. No code changes needed: the
      app only has one `catch (Exception ex)` around library calls, in `TranslationState/Reducers.cs`,
      and it just surfaces `ex.Message` — nothing matches on a specific exception type.)

Behaviour changes to verify by hand after the bump:

- [x] Timing is different because 4.1.4 was wrong: it used a bad Farnsworth constant and put word
      gaps between every character. Audio and light output will be shorter and correctly spaced.
      This is a fix, not a regression, but test clips will sound different. (Confirmed via the
      `AudioFormat`/`GetElements().Duration` behavior — not something to "fix" further here.)
- [x] Audio now fades each element over 5 ms by default, so the key click at the start and end of
      every beep is gone. `EdgeMilliseconds: 0` restores the old sound if anyone complains. (Default
      left as-is per the roadmap; no UI toggle added yet — that's Phase 4.)
- [x] The `Language` enum was renumbered in 6.0 (sequential 1 to 11, byte-backed). If a selected
      language is ever persisted by numeric value (localStorage etc.), migrate or reset it.
      (Confirmed no `localStorage`/numeric persistence anywhere in the app — nothing to migrate.)
- [x] Run every language through encode/decode once; the character tables were rebuilt from data
      files in 6.0 and a few characters were fixed (German ß, Kurdish س, swapped German parens).
      (Round-tripped every character of all 11 languages through `ToMorse().Encode()` →
      `Decode()`. Every non-alias character round-trips cleanly. The only mismatches are aliased
      characters resolving back to their pattern's canonical character — e.g. `ß` → `ẞ`,
      Kurdish/Kurdish Latin `*` → `خ`/`X` — which is documented, expected alias behavior, not a bug.)

**Unplanned but required:** `About.razor`'s per-language "rules" table used `MorseCharacters.GetLanguageCharacter(language)`, which 6.x removed with no public replacement (the equivalent data, `MorseAlphabet.Entries`, was `internal`). Flagged upstream; the library author shipped `MorseAlphabet.ForLanguage(Language)` with public `Characters`/`Prosigns` collections in 6.1.0 to cover it. `About.razor`'s `GetAlphabets`/`GetNumbers`/`GetPunctuations`/`GetSymbols` now share one `GetCharacters(predicate)` helper built on `MorseAlphabet.ForLanguage(...).Characters`.

## Phase 2: Remove Fluxor

Seven feature states, seven action classes, and reducer classes, all to move a few booleans and
strings around a single page. Replace the whole `Stores/` tree with two or three plain classes
registered in DI, exposing events for change notification.

Design:

- [x] `AppState` (scoped, or singleton since WASM has one user): `Input`, `Output`, `Error`,
      `IsEncoding`, `Language`, and an `event Action? Changed`. Components subscribe in
      `OnInitialized`, unsubscribe in `Dispose`, call `StateHasChanged` on the event. (Registered
      as singleton. Also folded the panel-open state and the translate/reset logic in here — see
      `PanelState` and behavior notes below.)
- [x] `MorseSettings`: `CharSpeed`, `WordSpeed`, `Frequency` with real defaults (25, 25, 700).
      Today `SettingState`'s parameterless constructor leaves speeds at 0, which throws the moment
      audio is requested before the settings panel has been touched. (Verified in the running app:
      opening Settings now shows 25/25/700 immediately, not 0/0/0 then a flash to 25/25/641 like
      before.)
- [x] `PanelState` (or fold into `AppState`): which bottom sheet is open (sound, light, settings,
      language dropdown). One enum beats four booleans in four stores. (Folded into `AppState` as
      `Panel ActivePanel` — `None`/`Sound`/`Light`/`Settings`/`LanguageDropdown`. This makes the
      four panels mutually exclusive, which they weren't before (each had its own independent
      bool); no functional loss observed, and it's arguably more correct for a single-sheet mobile
      UI.)
- [x] `MorseService`: wraps the MorseSharp chain. `Encode()`, `Decode()`, `GetWav()`,
      `PlayLightAsync()`. This is the only file that references MorseSharp, so the next library
      bump touches one class. (`About.razor` also calls `MorseAlphabet.ForLanguage(...)` directly
      for its character-table display — that's a page-specific enumeration concern, not a
      conversion operation, so it wasn't worth routing through `MorseService`.)

Execution:

- [x] Register the classes in `Program.cs`, delete `AddFluxor`, delete the `<Fluxor...>` root
      component from `App.razor`.
- [x] Convert components one at a time: `Textarea`, `LanguageDropdown`, `SettingSection`,
      `SoundSection`, `LightSection`, `Sidebar`, `ConverterFrame`. Each drops
      `FluxorComponent` inheritance, `IState<>`/`IDispatcher` injections, and the `@using
      AraratMorse.Stores.*` block. (Also converted `LanguageFrame`, `ToolsFrame`, `Home`, `About` —
      every component that touched a Fluxor store, not just the ones named here.)
- [x] Delete the `Stores/` folder and both Fluxor packages once nothing references them.
      (`Fluxor.Blazor.Web.ReduxDevTools` was already dropped in Phase 0; `Fluxor.Blazor.Web` is
      gone now too.)
- [x] Measure the published bundle before and after; note the size drop in the commit message.
      (No Fluxor assembly in the AOT publish output anymore. Full published `wwwroot` is ~41 MB,
      almost entirely `dotnet.native.*.wasm`, the AOT runtime itself (~19 MB) — Fluxor's own DLL
      was never large; the real win here is fewer moving parts and a source of dispatch/reducer
      indirection removed, not raw bytes. A precise before/after diff wasn't captured since Fluxor
      was removed in the same branch as the net10 retarget.)

Verified in the running app (dev server + browser): typing text encodes/decodes live, switching
language resets translation and updates the About page's table, Settings shows real 25/25/700
defaults and persists changes, Sound panel generates audio with no console errors, and the Light
panel plays a full sequence and re-enables its own Play button afterward (confirming `DoBlinks`'
cancellation actually completes now — see Phase 3's `Task.Run` removal below).

## Phase 3: Bug fixes

Bugs that exist today, independent of the migration. Fix during or right after Phase 2, whichever
touches the file anyway.

- [x] `SoundSection.CloseSection` is `async void`. Exceptions from `StopAsync` vanish and can take
      the circuit down. Make it `async Task` and await it from the handler. (Now `CloseSectionAsync`,
      awaited from both the overlay `@onclick` and the close button.)
- [x] `SoundSection.Download` does `textName.Split()[0]` on the input; empty or whitespace input
      throws `IndexOutOfRangeException`. Fall back to a fixed name. (Now splits with
      `StringSplitOptions.RemoveEmptyEntries` and falls back to `"morse"` when there's no first
      word.)
- [x] `SoundSection.Convert()` runs in `OnParametersSet`, which fires on every parameter change and
      regenerates the whole WAV even when the panel is closed. Generate only when the panel opens
      or when inputs actually changed. (Now tracks the previous `IsOpened` value and only calls
      `Convert()` on the closed→open transition.)
- [ ] `LightSection.Pause` "pauses" by doing `theMorse.Substring(offset)`, but `offset` counts
      blink callbacks (dots, dashes, and every gap), not characters of the Morse string. Resume
      after pause plays garbage. Phase 5 replaces this mechanism entirely. (Left untouched here —
      this is explicitly Phase 5's job, not Phase 3's; only the Fluxor plumbing around it changed.)
- [x] `LightSection.Play` wraps the blink loop in `Task.Run`, which does nothing useful on
      single-threaded WASM, and cancellation only short-circuits the callback while the 4.1.4
      library loop keeps running to the end behind the overlay. With 6.x, pass the token to
      `DoBlinks` and the loop actually stops. (`Task.Run` wrapper removed; `Play()` now awaits
      `MorseService.PlayLightAsync` directly. Verified in the browser: Play disables itself, the
      sequence runs to completion, and Play re-enables itself afterward with no wrapper needed.)
- [x] `TranslationState` passes `null` into non-nullable `string` properties and uses `" "` as an
      error sentinel. The replacement `AppState` should use `string?` and real null checks.
      (`AppState.Input`/`Output`/`Error` are all `string?`; `Translate()` sets `Output = null` on
      error instead of `" "`.)
- [x] `SettingState.frequency` is lowercase and the `(bool, int wpm, int cpm, ...)` constructor
      invites swapped arguments. Dies with the store; make the new settings class use named
      init properties. (`MorseSettings` has `CharSpeed`/`WordSpeed`/`Frequency` as named
      `{ get; private set; }` properties set via one `Update(charSpeed, wordSpeed, frequency)`
      method — no positional constructor to get wrong.)
- [ ] The audio element rebuilds a base64 data URI from the full WAV on every render of
      `SoundSection`. Moves to a blob URL in Phase 4. (Left as-is; explicitly Phase 4's job.)

## Phase 4: Sound section rework

MorseSharp 6 renders better audio; the section should stop fighting it.

Reusable player components first. Today sound and light are two full-screen bottom sheets welded
to the converter page. Phase 6 needs players inside practice questions, the keyer page and the
decoder page, so the players become components and the sheets become thin hosts:

- [x] `MorsePlayer`: takes text (or a ready `MorseElementSequence`), renders play/pause/stop, and
      composes the pieces below. Parameters pick what it shows: sound only, light only, both,
      timeline on or off. Two sizes, full panel and an inline card that fits inside a question.
      (`Kind` (`Sound`/`Light`/`Both`) and `Size` (`Full`/`Inline`) parameters exist and are
      implemented; only `Full` + `Sound`/`Light` are actually exercised right now, by
      `SoundSection`/`LightSection`. `Both` and `Inline` are wired but unconsumed until Phase 6.)
- [x] `ElementTimeline`: the dots-and-dashes strip with playhead and current-character highlight.
- [x] `LampView`: the flashing surface with its lamp modes and colours. (Modes/colours are
      explicitly Phase 5's job per that phase's own checklist — this is the plain on/off surface
      extracted out of the old inline markup.)
- [x] `WaveformView`: the PCM waveform canvas. (Rendered as SVG rather than an actual
      `<canvas>` — simpler, no per-frame JS drawing needed since it's a static peak envelope; see
      the visualization notes below.)
- [x] `SoundSection` and `LightSection` shrink to bottom sheets that host a full-size
      `MorsePlayer`; everything below in this phase and Phase 5 is built inside the components,
      not the sheets.

- [x] Let the user pick quality: sample rate and bit depth via `AudioFormat` in the settings panel
      (11 kHz 16-bit default, 44.1 kHz float for download). The fade is on by default and needs no
      UI beyond maybe an on/off toggle. (A "Quality" select — Standard/Studio — and a "Fade edges"
      checkbox, both only enabled under the `Custom` preset.)
- [x] Replace the base64 `data:` URI with a JS blob URL: pass the byte array over interop once,
      `URL.createObjectURL`, revoke the old URL on regeneration and on dispose. Cuts a full
      base64 copy of the WAV out of every render and out of the DOM. (`araratMorse.setSource`
      revokes any previous blob URL for that audio element before creating the new one;
      `disposePlayer` revokes on component dispose.)
- [x] Download through the same blob URL instead of a second copy. (`araratMorse.download` now
      just anchors to the already-created blob URL — no second `fetch` of the audio element's
      `src` like the old code did.)
- [x] Name downloads sensibly: first word of the source text if there is one, `morse.wav` if not.
      (Carried over from the Phase 3 fix, now feeding `MorsePlayer`'s `DownloadName` parameter.)
- [x] Show duration next to the player. `GetElements()` gives it for free:
      `sequence.Duration`, no need to decode the WAV header in JS. (Shown under the
      visualization, formatted `m:ss.f` or `s.f"s"`.)

Visualization. The current canvas guesses at the signal through the Web Audio analyser; the app
owns the PCM bytes and the element timeline, so it can draw the truth instead:

- [x] Waveform view rendered once from the actual samples (downsample to one min/max pair per
      pixel column), with a playhead synced to `audio.currentTime`. No analyser, no per-frame
      FFT cost. (`WavSamples.Read` parses the WAV's `fmt `/`data` chunks directly — handles 8/16/32
      -bit and multi-channel by reading the first channel only — and `WavSamples.Downsample`
      produces the min/max pairs, rendered as 200 SVG `<rect>`s. The playhead itself is a `<div>`
      whose `left%` a small JS `requestAnimationFrame` loop drives from `audio.currentTime`, with
      no round trip to Blazor per frame.)
- [x] Element timeline view: dots and dashes as blocks on a strip, gaps as spacing, built from
      `GetElements()`. Highlight the block under the playhead and the character it belongs to,
      so the user reads along while it plays. (Elements are grouped into per-character blocks with
      `data-start`/`data-end` fractional-time attributes; the same JS rAF loop that drives the
      waveform playhead also toggles a highlight class on whichever `.timeline-char` block the
      current ratio falls inside — one interop call, no Blazor round trip per frame here either.)
- [x] Make the timeline a shared component; Phase 5 reuses it under the light player. (`ElementTimeline`
      only renders under the sound player for now — its `PlayheadRatio` parameter exists so a
      C#-driven position, like Phase 5's `PlayAsync` element loop, can drive it directly without any
      JS/`audio.currentTime` involved, but nothing supplies that yet. Deliberately left as Phase 5's
      job per that phase's own note: "Phase 5 reuses it under the light player.")
- [x] Keep the old analyser view as a third "spectrum" mode if it costs nothing; otherwise let
      it go. (Let it go — the `AudioContext`/`AnalyserNode` wiring and its `requestAnimationFrame`
      FFT redraw loop are gone from `Audio.ts` entirely, replaced by the real-sample SVG waveform.)

Presets. Speeds, tone and format are four sliders nobody wants to learn; ship named presets and
keep the sliders under "custom":

- [x] Sound presets, each a (charSpeed, wordSpeed, frequency, AudioFormat) bundle:
      `Classic` 20/20 at 700 Hz, `Practice` 20/12 Farnsworth at 600 Hz, `Contest` 30/30 at
      650 Hz, `Soft` 18/18 at 550 Hz with a 10 ms fade, `Studio` 44.1 kHz float32 for clean
      downloads. (`SoundPreset.All`; the settings panel shows one button per preset — picking one
      applies it to `MorseSettings` immediately, live-tested in the browser.)
- [x] `Custom` preset that exposes the sliders, saved to localStorage, restored on load. (Selecting
      `Custom` unlocks the WPM/CPM/Frequency/Quality/Fade fields; Save persists them as JSON under
      `araratmorse.customSound` and `SettingSection` restores and reapplies them on the next load —
      verified end-to-end: edited values survived a full page reload.)
- [x] Presets live in the settings panel and apply to both the sound and light players, since
      speeds are shared. (True by construction — both `MorsePlayer` instances read the same
      injected `MorseSettings` singleton.)

## Phase 5: Light section rework

The element stream (`GetElements` / `PlayAsync`) was built for exactly this component. The current
implementation guesses at timing from callbacks; the new one gets told.

- [x] Replace `DoBlinks` + manual offset counting with `await foreach` over `PlayAsync(token)`.
      Each `MorseElement` says whether the light is on (`KeyDown`) and for how long (`Duration`).
      The loop body sets the panel colour and calls `StateHasChanged`; MorseSharp does the timing
      with drift compensation. (`MorseService.PlayLightElements` wraps `PlayAsync`; a fresh play
      from a stopped state uses it directly for drift-compensated real-time pacing.)
- [x] Real pause and resume: remember how many elements have played, and on resume, skip that many
      from a fresh `GetElements()` walk before continuing. Element counts are exact where string
      offsets were not. (`MorsePlayer` materializes the full element list once per generation and
      tracks `_lightElementsPlayed`. Resuming walks `_lightElements.Skip(_lightElementsPlayed)`
      with a plain `Task.Delay` per element rather than re-entering `PlayAsync` — a resumed
      sequence has already broken continuous real-time pacing at the pause point, so drift
      compensation across the gap isn't meaningful anyway. Verified in the browser: paused at
      13/64 elements, stayed at 13/64 while paused, resumed and continued to 20/64 — the old
      substring-by-callback-count bug is gone.)
- [x] Progress bar: elements played over total, and time remaining from summing remaining
      `Duration`s. Both are trivial with the sequence in hand. (Text readout — `"13/64 · 5.1s
      left"` — swapped in for the plain duration label. A visual bar wasn't added; the shared
      `ElementTimeline` playhead already gives a visual sense of progress alongside this.)
- [x] Show the current character being keyed by walking the Morse string in step with `CharGap` /
      `WordGap` elements, so the user can follow along. (Covered by reusing `ElementTimeline`
      under the lamp — see below — rather than a separate mechanism.)
- [x] Cancellation on close via the token passed to `PlayAsync`; the final element is always key-up
      so the panel never sticks white. (True for the fresh-start path, per MorseSharp's own
      guarantee. The manual resume-loop path doesn't get that guarantee for free since it's plain
      `Task.Delay`, so cancellation there explicitly sets the lamp off in the `catch
      (OperationCanceledException)` block.)

Visualization. A full-screen white flash is one way to show a dot; give the player looks:

- [x] Lamp modes: full screen (current), a signal-lamp graphic centered on black, and a thin
      top-bar flash for people who want to read the timeline while it plays. (`LampMode` enum on
      `LampView`/`MorsePlayer`; `LightSection` cycles through them with one button.)
- [x] Light colour presets: white, amber, green, red, matching how signal lamps actually look,
      plus a brightness slider (opacity) so full screen at night is not painful. (`LampColor` enum
      plus a `Brightness` (0-1 opacity) parameter; verified live in the browser — switching to red
      and dragging the brightness slider both update the lamp mid-flash.)
- [x] The shared element timeline from Phase 4 under the lamp, playhead moving as elements fire,
      current character highlighted. (`ElementTimeline`'s `PlayheadRatio` parameter, added in
      Phase 4 specifically for this, is now fed from `MorsePlayer`'s own element loop for
      `Kind.Light` — no JS/`audio.currentTime` involved, since there's no audio element in play.
      Verified: playing showed the active-character highlight moving in step with the lamp.)
- [x] Torch mode on phones that allow it: drive the camera flash through the MediaStream torch
      constraint from the same `PlayAsync` loop. Feature-detect and hide the button elsewhere;
      timing will be sloppier than the screen, say so in the tooltip. (`TorchManager` in
      `Audio.ts`. Feature-detection is split in two: a permission-free `hasCameraApi()` check
      gates whether the button shows at all, and the real capability/permission probe
      (`isSupported()`) only runs behind the user's tap on that button — never proactively, to
      avoid an unsolicited camera-permission prompt on page load. `MorsePlayer` calls
      `araratMorseTorch.setTorch(element.KeyDown)` fire-and-forget alongside each light element
      when `TorchEnabled`. Verified the button appears, the tap triggers a real camera-permission
      request without crashing anything, and playback keeps working when it's denied — genuine
      hardware torch behavior isn't verifiable in this environment.)
- [x] Reduced-motion mode doubles as the safe mode: no flashing, timeline and ON/OFF text only.
      (A manual "Safe" toggle in `LightSection` sets `ReducedMotion` on `LampView`, which then
      renders static ON/OFF text instead of any of the flashing modes. This phase implements the
      toggle itself; wiring it to the OS-level `prefers-reduced-motion` media query automatically
      is Phase 7's job, which lists that exact item.)

## Phase 6: New features from MorseSharp 6

Each of these is a page or panel; none touches the existing converter.

Learning and practice. This is the biggest win from 6.x and deserves to be a real trainer, not a
single page. Every question embeds its own inline `MorsePlayer` from Phase 4, so a drill can be
heard, watched on the timeline, or flashed as light, per question, without leaving the card:

- [ ] Koch course: pick a level (1 to `Koch.MaxLevel`), the app plays `Koch.Generate(level,
      groups)` at full character speed, user types what they heard, `Koch.Score` grades it and
      `ClearsThreshold` decides whether the next character unlocks.
- [ ] Meet-the-character step: when a level unlocks a new character, play it alone a few times
      with the timeline visible before it enters the drills.
- [ ] Per-question embedded player: replay button, timeline reveal after answering (so the shape
      of what was sent is visible next to what the user typed), optional light mode for visual
      learners. Answer first, then reveal; no peeking during play.
- [ ] Per-character stats from `Koch.Score` results: accuracy per character and a confusion list
      (typed R when it was K, and so on), stored in localStorage.
- [ ] Weighted drills: generate groups app-side from the unlocked pool, biased toward the
      characters the stats say are weakest, and still grade with `Koch.Score`. `Koch.Generate`
      stays for the standard uniform drills.
- [ ] Lesson settings per course: character speed, Farnsworth gap speed, group size and count,
      tone preset. Farnsworth here is the whole point of the setting existing.
- [ ] Session summary at the end of a run: accuracy, characters gained, what to drill next, and a
      streak counter for coming back daily.
- [ ] Callsign and QSO drills as a second course: play `Callsign.Next()` or `Qso.Generate()`
      transmission by transmission, each in its own question card with its own player, reveal
      after each attempt. Real-traffic shapes (RST, Q-codes, `<SK>`) are the syllabus here.
- [ ] Reading course (light instead of sound): same drills with the `MorsePlayer` in light mode,
      for learning to read a blinking lamp rather than copy by ear.

Decoding received audio:

- [ ] "Decode from file": accept a WAV upload, hand the PCM to `FromAudio`, put the text in the
      converter output. Runs entirely client side.
- [ ] "Decode from microphone": Web Audio capture over interop feeding
      `CreateAudioDecoder().Write(...)` chunk by chunk, characters appearing as `TryRead` yields
      them. This is the flagship demo of the streaming decoder; treat chunk size as arbitrary
      because the decoder does.

Keyer:

- [ ] A practice key page: spacebar (or touch) as a straight key first, then two keys / two touch
      zones as iambic paddles into `IambicKeyer`, with `KeyerDecoder` turning what the user keys
      back into text on screen. Mode A/B toggle in settings.
- [ ] Sidetone while keying, reusing the audio machinery from Phase 4.

Smaller additions:

- [ ] Prosigns already work through `ToMorse` bracket syntax; document `<AR>`, `<SK>` etc. in the
      UI (placeholder text or a help popover) and make sure the textarea doesn't mangle `<` `>`.
- [ ] Custom alphabet page backed by `MorseAlphabetBuilder`, stored as JSON in localStorage and
      rebuilt on load. Lets people add characters the built-in languages lack.

## Phase 7: UI improvements

- [ ] RTL layout for Kurdish and Arabic input: `dir="auto"` on the textareas at minimum, full
      logical-property audit if time allows.
- [ ] Keyboard access for the bottom sheets: Escape closes, focus is trapped while open, focus
      returns to the trigger on close.
- [ ] `prefers-reduced-motion`: skip the slide-up transitions and, for the light player, offer a
      text ("ON/OFF") mode instead of full-screen flashing. Also worth a photosensitivity note.
- [ ] Replace the raw error strings from exceptions with short human messages; keep the exception
      detail behind a "details" expander.
- [ ] Empty states: the sound and light buttons should be disabled until there is output to play,
      instead of opening a panel that errors.
- [ ] A proper favicon/app icon set and a manifest so it installs nicely as a PWA; it's a
      converter people reach for on phones.
- [ ] Shareable links: encode input, direction and language into the URL query so a conversion
      can be sent to someone as a link and the app restores it on load.
- [ ] Conversion history: the last N conversions in localStorage, one tap to bring one back.
- [ ] Keyboard shortcuts: Ctrl+Enter converts, Ctrl+C on the output area copies (ClipLazor is
      already there), Space plays/pauses whichever player is open.
- [ ] Live convert-as-you-type behind a toggle, debounced; encoding is allocation-free in
      MorseSharp 6 so the cost is one string per keystroke.

## Phase 8: Performance

- [ ] Bundle: after Phases 0 and 2, the app should have four packages left (MorseSharp, ClipLazor,
      FluentValidation, WebAssembly). Compare published size against main and record it.
- [ ] Keep `RunAOTCompilation` but re-measure; Fluxor reflection scanning
      (`ScanAssemblies`) is gone, so startup should drop noticeably.
- [ ] Kill the per-render base64 audio churn (Phase 4 does this); it is the single biggest
      allocation source in the app today.
- [ ] Audit `StateHasChanged` frequency in the light loop: one render per element is fine at 25
      wpm (about 20 per second), but throttle if profiling shows layout thrash.
- [ ] MorseSharp 6 itself is allocation-free on encode and near-flat on the element stream, so
      the app's remaining garbage is UI-side; profile with the browser tools after the rework
      rather than guessing.

## Phase 9: CI and release

- [ ] Update `dotnet.yml`: SDK 10.x, keep the wasm-tools workload, fix the base-href step (the
      comment says "ArartMorse", verify the actual path GitHub Pages serves from).
- [ ] Add a build-and-test job on pull requests, not just deploy-on-main.
- [ ] Copy `index.html` to `404.html` in the publish output so deep links survive refresh on
      Pages.
- [ ] Update README: drop Fluxor from "Built with", add the new features as they land, replace the
      broken logo link with the raw content URL (same fix as MorseSharp's README needed).
- [ ] Tag releases and keep a small CHANGELOG once Phase 1 ships, so the MorseSharp version bump
      is traceable.

---

## Suggested order of attack

1. Phase 0 and Phase 1 together, one PR: the app runs on net10 + MorseSharp 6 with no visible
   change beyond correct timing and the click-free audio.
2. Phase 2 and Phase 3 together, one PR per component if that keeps reviews small: Fluxor out,
   bugs out, behaviour identical.
3. Phase 4 and Phase 5, one PR each: the players become reusable components and get reworked on
   the new APIs. Everything in Phase 6 embeds these, so they land first.
4. Phase 6 features as independent PRs, in whatever order is most fun: the practice courses
   first, since the inline `MorsePlayer` makes the question cards mostly wiring.
5. Phases 7 to 9 continuously alongside.
