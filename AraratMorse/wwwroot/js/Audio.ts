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

    // Streams microphone audio to the .NET streaming decoder in fixed-size chunks. Chunk size is
    // arbitrary as far as MorseSharp's decoder is concerned; 4096 samples is just a reasonable
    // balance between interop call frequency and latency for a live demo.
    class MicCapture {
        stream: MediaStream | null = null;
        audioContext: AudioContext | null = null;
        source: MediaStreamAudioSourceNode | null = null;
        processor: ScriptProcessorNode | null = null;
        silencer: GainNode | null = null;

        hasMicApi(): boolean {
            return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        }

        // Returns the actual sample rate the capture is running at (the device/browser decides
        // this, not us), or -1 if the user declined/it's unsupported.
        async start(dotNetRef: any): Promise<number> {
            this.stop();

            try {
                this.stream = await navigator.mediaDevices.getUserMedia({audio: true});
            } catch {
                return -1;
            }

            this.audioContext = new AudioContext();
            this.source = this.audioContext.createMediaStreamSource(this.stream);
            this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

            this.processor.onaudioprocess = (e: AudioProcessingEvent) => {
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
        }

        stop(): void {
            this.processor?.disconnect();
            this.silencer?.disconnect();
            this.source?.disconnect();
            this.stream?.getTracks().forEach(track => track.stop());
            void this.audioContext?.close();

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
        audioContext: AudioContext | null = null;
        oscillator: OscillatorNode | null = null;
        gainNode: GainNode | null = null;

        ensureStarted(frequency: number): void {
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

        setFrequency(frequency: number): void {
            if (this.oscillator) this.oscillator.frequency.value = frequency;
        }

        set(on: boolean): void {
            if (!this.gainNode || !this.audioContext) return;

            const now = this.audioContext.currentTime;
            this.gainNode.gain.cancelScheduledValues(now);
            this.gainNode.gain.setTargetAtTime(on ? 0.2 : 0, now, 0.002);
        }

        stop(): void {
            try {
                this.oscillator?.stop();
            } catch {
                // already stopped
            }
            void this.audioContext?.close();

            this.oscillator = null;
            this.gainNode = null;
            this.audioContext = null;
        }
    }

    export function Load(): void {
        window['araratMorse'] = new AudioManager();
        window['araratMorseTorch'] = new TorchManager();
        window['araratMorseMic'] = new MicCapture();
        window['araratMorseSidetone'] = new Sidetone();
    }
}

AraratMorse.Load();
