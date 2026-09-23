"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var AraratMorse;
(function (AraratMorse) {
    function formatSeconds(seconds) {
        if (!isFinite(seconds) || seconds < 0)
            seconds = 0;
        if (seconds < 60)
            return `${seconds.toFixed(1)}s`;
        const minutes = Math.floor(seconds / 60);
        return `${minutes}:${(seconds - minutes * 60).toFixed(1).padStart(4, "0")}`;
    }
    class AudioManager {
        constructor() {
            this.blobUrls = new Map();
            this.playheads = new Map();
            this.watches = new Map();
        }
        getAudio(audioId) {
            return document.getElementById(audioId);
        }
        setSource(audioId, bytes) {
            this.revokeSource(audioId);
            const blob = new Blob([bytes], { type: "audio/wav" });
            const url = URL.createObjectURL(blob);
            this.blobUrls.set(audioId, url);
            const audio = this.getAudio(audioId);
            if (audio)
                audio.src = url;
        }
        revokeSource(audioId) {
            const url = this.blobUrls.get(audioId);
            if (url) {
                URL.revokeObjectURL(url);
                this.blobUrls.delete(audioId);
            }
        }
        // Resolves false when the browser refuses to start (e.g. autoplay policy), so the caller
        // doesn't sit in a "playing" state that never happens.
        play(audioId) {
            const audio = this.getAudio(audioId);
            if (!audio)
                return Promise.resolve(false);
            return audio.play().then(() => true, () => false);
        }
        // Reports the end of playback to .NET (rewinding so the next play starts over) and keeps
        // an elapsed-time label current while playing.
        watch(audioId, dotNetRef, elapsedId) {
            this.unwatch(audioId);
            const audio = this.getAudio(audioId);
            if (!audio)
                return;
            const state = { audio, rafId: null, listeners: [] };
            const render = () => {
                const label = document.getElementById(elapsedId);
                if (label)
                    label.textContent = formatSeconds(audio.currentTime);
            };
            const loop = () => {
                render();
                state.rafId = (!audio.paused && !audio.ended) ? requestAnimationFrame(loop) : null;
            };
            const onPlay = () => {
                if (state.rafId === null)
                    state.rafId = requestAnimationFrame(loop);
            };
            const onEnded = () => {
                audio.currentTime = 0;
                render();
                dotNetRef.invokeMethodAsync("OnPlaybackEnded");
            };
            state.listeners = [["play", onPlay], ["seeked", render], ["ended", onEnded]];
            for (const [name, handler] of state.listeners)
                audio.addEventListener(name, handler);
            this.watches.set(audioId, state);
            render();
        }
        unwatch(audioId) {
            const state = this.watches.get(audioId);
            if (!state)
                return;
            if (state.rafId !== null)
                cancelAnimationFrame(state.rafId);
            for (const [name, handler] of state.listeners)
                state.audio.removeEventListener(name, handler);
            this.watches.delete(audioId);
        }
        pause(audioId) {
            var _a;
            (_a = this.getAudio(audioId)) === null || _a === void 0 ? void 0 : _a.pause();
        }
        stop(audioId) {
            const audio = this.getAudio(audioId);
            if (!audio)
                return;
            audio.pause();
            audio.currentTime = 0;
        }
        download(audioId, name) {
            const url = this.blobUrls.get(audioId);
            if (!url)
                return;
            const a = document.createElement("a");
            a.href = url;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
        // Moves a playhead element left-to-right in step with audio.currentTime, and (when a
        // timeline container is given) toggles a highlight on whichever .timeline-char sits
        // under it — all without a per-frame round trip to Blazor.
        // visibleSeconds is how much of the audio the drawing covers: it stops at the last tone,
        // before the trailing silence, so the playhead is measured against that and parks at the
        // end while the silence plays out.
        attachPlayhead(audioId, playheadId, timelineContainerId, visibleSeconds) {
            this.detachPlayhead(playheadId);
            const audio = this.getAudio(audioId);
            const playhead = document.getElementById(playheadId);
            if (!audio || !playhead)
                return;
            const container = timelineContainerId ? document.getElementById(timelineContainerId) : null;
            const chars = container
                ? Array.from(container.querySelectorAll(".timeline-char"))
                : [];
            const state = { rafId: null, audio, onPlay: () => {
                }, onSeeked: () => {
                } };
            const step = () => {
                const span = visibleSeconds > 0 ? visibleSeconds : audio.duration;
                const ratio = span > 0 ? audio.currentTime / span : 0;
                const clamped = Math.min(1, Math.max(0, ratio));
                // At rest (never started, stopped, or finished and rewound) show a clean strip.
                const atRest = audio.paused && audio.currentTime === 0;
                playhead.style.width = `${clamped * 100}%`;
                playhead.style.opacity = atRest || clamped === 0 ? "0" : "1";
                for (const el of chars) {
                    const start = parseFloat(el.dataset.start || "0");
                    const end = parseFloat(el.dataset.end || "0");
                    el.classList.toggle("bg-white/15", !atRest && clamped >= start && clamped < end);
                }
                state.rafId = (!audio.paused && !audio.ended) ? requestAnimationFrame(step) : null;
            };
            state.onPlay = () => {
                if (state.rafId === null)
                    state.rafId = requestAnimationFrame(step);
            };
            // Stop and the end-of-playback rewind happen while paused, when the frame loop isn't
            // running, so redraw once on seek or the playhead would stay where it stopped.
            state.onSeeked = () => {
                if (state.rafId === null)
                    step();
            };
            audio.addEventListener("play", state.onPlay);
            audio.addEventListener("seeked", state.onSeeked);
            this.playheads.set(playheadId, state);
            step();
        }
        detachPlayhead(playheadId) {
            const state = this.playheads.get(playheadId);
            if (!state)
                return;
            if (state.rafId !== null)
                cancelAnimationFrame(state.rafId);
            state.audio.removeEventListener("play", state.onPlay);
            state.audio.removeEventListener("seeked", state.onSeeked);
            this.playheads.delete(playheadId);
        }
        disposePlayer(audioId, playheadIds) {
            this.unwatch(audioId);
            for (const id of playheadIds)
                this.detachPlayhead(id);
            this.revokeSource(audioId);
        }
    }
    // Best-effort camera-flash torch control for the light player on phones that allow it.
    // Timing rides on whatever the MediaStream constraint API delivers, which is looser than the
    // screen — callers should say so in a tooltip.
    class TorchManager {
        constructor() {
            this.track = null;
        }
        // A coarse, permission-free check: does the browser even expose the API. The real torch
        // capability (and the camera-permission prompt that comes with it) is only probed by
        // isSupported(), which callers should only invoke behind a user gesture.
        hasCameraApi() {
            return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        }
        isSupported() {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                var _c;
                try {
                    if (!((_a = navigator.mediaDevices) === null || _a === void 0 ? void 0 : _a.getUserMedia))
                        return false;
                    const stream = yield navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                    const track = stream.getVideoTracks()[0];
                    const capabilities = ((_c = (_b = track.getCapabilities) === null || _b === void 0 ? void 0 : _b.call(track)) !== null && _c !== void 0 ? _c : {});
                    if (capabilities.torch) {
                        this.track = track;
                        return true;
                    }
                    track.stop();
                    return false;
                }
                catch (_d) {
                    return false;
                }
            });
        }
        setTorch(on) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this.track)
                    return;
                try {
                    yield this.track.applyConstraints({ advanced: [{ torch: on }] });
                }
                catch (_a) {
                    // best effort — nothing sensible to do if the constraint is rejected mid-session
                }
            });
        }
        release() {
            var _a;
            (_a = this.track) === null || _a === void 0 ? void 0 : _a.stop();
            this.track = null;
        }
    }
    // Streams microphone audio to the .NET streaming decoder in fixed-size chunks. Chunk size is
    // arbitrary as far as MorseSharp's decoder is concerned; 4096 samples is just a reasonable
    // balance between interop call frequency and latency for a live demo.
    class MicCapture {
        constructor() {
            this.stream = null;
            this.audioContext = null;
            this.source = null;
            this.processor = null;
            this.silencer = null;
        }
        hasMicApi() {
            return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        }
        // Returns the actual sample rate the capture is running at (the device/browser decides
        // this, not us), or -1 if the user declined/it's unsupported.
        start(dotNetRef) {
            return __awaiter(this, void 0, void 0, function* () {
                this.stop();
                try {
                    this.stream = yield navigator.mediaDevices.getUserMedia({ audio: true });
                }
                catch (_a) {
                    return -1;
                }
                this.audioContext = new AudioContext();
                this.source = this.audioContext.createMediaStreamSource(this.stream);
                this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
                this.processor.onaudioprocess = (e) => {
                    const input = e.inputBuffer.getChannelData(0);
                    const bytes = new Uint8Array(input.length * 2);
                    const view = new DataView(bytes.buffer);
                    for (let i = 0; i < input.length; i++) {
                        const clamped = Math.max(-1, Math.min(1, input[i]));
                        const sample = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
                        view.setInt16(i * 2, sample, true);
                    }
                    dotNetRef.invokeMethodAsync("OnAudioChunk", bytes);
                };
                // ScriptProcessorNode only fires onaudioprocess once it's in a graph that reaches
                // the destination. Route it through a zero-gain node so the mic is never actually
                // played back out loud (which would risk audible feedback/echo).
                this.silencer = this.audioContext.createGain();
                this.silencer.gain.value = 0;
                this.source.connect(this.processor);
                this.processor.connect(this.silencer);
                this.silencer.connect(this.audioContext.destination);
                return this.audioContext.sampleRate;
            });
        }
        stop() {
            var _a, _b, _c, _d, _e;
            (_a = this.processor) === null || _a === void 0 ? void 0 : _a.disconnect();
            (_b = this.silencer) === null || _b === void 0 ? void 0 : _b.disconnect();
            (_c = this.source) === null || _c === void 0 ? void 0 : _c.disconnect();
            (_d = this.stream) === null || _d === void 0 ? void 0 : _d.getTracks().forEach(track => track.stop());
            void ((_e = this.audioContext) === null || _e === void 0 ? void 0 : _e.close());
            this.processor = null;
            this.silencer = null;
            this.source = null;
            this.stream = null;
            this.audioContext = null;
        }
    }
    // A continuously-running oscillator gated by gain, so key-down/key-up just ramps the gain
    // instead of starting/stopping a new tone each time — avoids audible clicks and lets Set()
    // be called as often as real key transitions demand.
    class Sidetone {
        constructor() {
            this.audioContext = null;
            this.oscillator = null;
            this.gainNode = null;
        }
        ensureStarted(frequency) {
            if (this.audioContext) {
                this.setFrequency(frequency);
                return;
            }
            this.audioContext = new AudioContext();
            this.oscillator = this.audioContext.createOscillator();
            this.oscillator.type = "sine";
            this.oscillator.frequency.value = frequency;
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = 0;
            this.oscillator.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);
            this.oscillator.start();
        }
        setFrequency(frequency) {
            if (this.oscillator)
                this.oscillator.frequency.value = frequency;
        }
        set(on) {
            if (!this.gainNode || !this.audioContext)
                return;
            const now = this.audioContext.currentTime;
            this.gainNode.gain.cancelScheduledValues(now);
            this.gainNode.gain.setTargetAtTime(on ? 0.2 : 0, now, 0.002);
        }
        stop() {
            var _a, _b;
            try {
                (_a = this.oscillator) === null || _a === void 0 ? void 0 : _a.stop();
            }
            catch (_c) {
                // already stopped
            }
            void ((_b = this.audioContext) === null || _b === void 0 ? void 0 : _b.close());
            this.oscillator = null;
            this.gainNode = null;
            this.audioContext = null;
        }
    }
    function Load() {
        window['araratMorse'] = new AudioManager();
        window['araratMorseTorch'] = new TorchManager();
        window['araratMorseMic'] = new MicCapture();
        window['araratMorseSidetone'] = new Sidetone();
        window['araratMorseMotion'] = {
            prefersReduced: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
        };
        window['araratMorseShare'] = {
            // The system share sheet where there is one (phones), otherwise the clipboard.
            // Resolves to what happened, so the button can say so.
            share: (url, title) => {
                const copy = () => navigator.clipboard.writeText(url).then(() => "copied", () => "failed");
                if (navigator.share) {
                    return navigator.share({ title, url }).then(() => "shared", e => (e === null || e === void 0 ? void 0 : e.name) === "AbortError" ? "cancelled" : copy());
                }
                return copy();
            }
        };
    }
    AraratMorse.Load = Load;
})(AraratMorse || (AraratMorse = {}));
AraratMorse.Load();
