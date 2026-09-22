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
    class AudioManager {
        constructor() {
            this.blobUrls = new Map();
            this.playheads = new Map();
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
        play(audioId) {
            var _a;
            (_a = this.getAudio(audioId)) === null || _a === void 0 ? void 0 : _a.play();
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
        attachPlayhead(audioId, playheadId, timelineContainerId) {
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
                } };
            const step = () => {
                const ratio = audio.duration > 0 ? audio.currentTime / audio.duration : 0;
                const clamped = Math.min(1, Math.max(0, ratio));
                playhead.style.left = `${clamped * 100}%`;
                for (const el of chars) {
                    const start = parseFloat(el.dataset.start || "0");
                    const end = parseFloat(el.dataset.end || "0");
                    el.classList.toggle("bg-yellow-400/30", clamped >= start && clamped < end);
                }
                state.rafId = (!audio.paused && !audio.ended) ? requestAnimationFrame(step) : null;
            };
            state.onPlay = () => {
                if (state.rafId === null)
                    state.rafId = requestAnimationFrame(step);
            };
            audio.addEventListener("play", state.onPlay);
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
            this.playheads.delete(playheadId);
        }
        disposePlayer(audioId, playheadIds) {
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
    function Load() {
        window['araratMorse'] = new AudioManager();
        window['araratMorseTorch'] = new TorchManager();
    }
    AraratMorse.Load = Load;
})(AraratMorse || (AraratMorse = {}));
AraratMorse.Load();
