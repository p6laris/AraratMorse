"use strict";
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
    function Load() {
        window['araratMorse'] = new AudioManager();
    }
    AraratMorse.Load = Load;
})(AraratMorse || (AraratMorse = {}));
AraratMorse.Load();
