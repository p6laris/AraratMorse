namespace AraratMorse {

    interface PlayheadState {
        rafId: number | null;
        audio: HTMLAudioElement;
        onPlay: () => void;
    }

    class AudioManager {
        blobUrls: Map<string, string> = new Map();
        playheads: Map<string, PlayheadState> = new Map();

        getAudio(audioId: string): HTMLAudioElement | null {
            return document.getElementById(audioId) as HTMLAudioElement | null;
        }

        setSource(audioId: string, bytes: Uint8Array): void {
            this.revokeSource(audioId);

            const blob = new Blob([bytes], {type: "audio/wav"});
            const url = URL.createObjectURL(blob);
            this.blobUrls.set(audioId, url);

            const audio = this.getAudio(audioId);
            if (audio) audio.src = url;
        }

        revokeSource(audioId: string): void {
            const url = this.blobUrls.get(audioId);
            if (url) {
                URL.revokeObjectURL(url);
                this.blobUrls.delete(audioId);
            }
        }

        play(audioId: string): void {
            this.getAudio(audioId)?.play();
        }

        pause(audioId: string): void {
            this.getAudio(audioId)?.pause();
        }

        stop(audioId: string): void {
            const audio = this.getAudio(audioId);
            if (!audio) return;
            audio.pause();
            audio.currentTime = 0;
        }

        download(audioId: string, name: string): void {
            const url = this.blobUrls.get(audioId);
            if (!url) return;

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
        attachPlayhead(audioId: string, playheadId: string, timelineContainerId: string | null): void {
            this.detachPlayhead(playheadId);

            const audio = this.getAudio(audioId);
            const playhead = document.getElementById(playheadId);
            if (!audio || !playhead) return;

            const container = timelineContainerId ? document.getElementById(timelineContainerId) : null;
            const chars = container
                ? Array.from(container.querySelectorAll<HTMLElement>(".timeline-char"))
                : [];

            const state: PlayheadState = {rafId: null, audio, onPlay: () => {
            }};

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
                if (state.rafId === null) state.rafId = requestAnimationFrame(step);
            };

            audio.addEventListener("play", state.onPlay);
            this.playheads.set(playheadId, state);

            step();
        }

        detachPlayhead(playheadId: string): void {
            const state = this.playheads.get(playheadId);
            if (!state) return;

            if (state.rafId !== null) cancelAnimationFrame(state.rafId);
            state.audio.removeEventListener("play", state.onPlay);
            this.playheads.delete(playheadId);
        }

        disposePlayer(audioId: string, playheadIds: string[]): void {
            for (const id of playheadIds) this.detachPlayhead(id);
            this.revokeSource(audioId);
        }
    }

    // Best-effort camera-flash torch control for the light player on phones that allow it.
    // Timing rides on whatever the MediaStream constraint API delivers, which is looser than the
    // screen — callers should say so in a tooltip.
    class TorchManager {
        track: MediaStreamTrack | null = null;

        // A coarse, permission-free check: does the browser even expose the API. The real torch
        // capability (and the camera-permission prompt that comes with it) is only probed by
        // isSupported(), which callers should only invoke behind a user gesture.
        hasCameraApi(): boolean {
            return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        }

        async isSupported(): Promise<boolean> {
            try {
                if (!navigator.mediaDevices?.getUserMedia) return false;

                const stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: "environment"}});
                const track = stream.getVideoTracks()[0];
                const capabilities = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };

                if (capabilities.torch) {
                    this.track = track;
                    return true;
                }

                track.stop();
                return false;
            } catch {
                return false;
            }
        }

        async setTorch(on: boolean): Promise<void> {
            if (!this.track) return;

            try {
                await this.track.applyConstraints({advanced: [{torch: on} as MediaTrackConstraintSet]});
            } catch {
                // best effort — nothing sensible to do if the constraint is rejected mid-session
            }
        }

        release(): void {
            this.track?.stop();
            this.track = null;
        }
    }

    export function Load(): void {
        window['araratMorse'] = new AudioManager();
        window['araratMorseTorch'] = new TorchManager();
    }
}

AraratMorse.Load();
