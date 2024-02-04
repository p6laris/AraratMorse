namespace AraratMorse {

    interface ICanvas {
        canvas: HTMLCanvasElement | null;
        canvasContext: CanvasRenderingContext2D | null;

    }

    interface IPlayBackInfo {
        startedAt: number;
        pausedAt: number;
    }

    interface IAudioConfig {
        byteArray: Uint8Array | null;
        audioContext: AudioContext | null;
        source: AudioBufferSourceNode | null;
        analyzer: AnalyserNode | null;
        canvas: ICanvas | null;
        playbackInfo: IPlayBackInfo;

        initAudio(bytes: Uint8Array): void;

        play(): void;

        pause(): void;

        visualize(): void;

        stop(): void;

    }

    class AudioManager implements IAudioConfig {
        byteArray: Uint8Array | null;
        analyzer: AnalyserNode | null;
        audioContext: AudioContext | null;
        canvas: ICanvas;
        source: AudioBufferSourceNode | null;
        playbackInfo: IPlayBackInfo;

        constructor() {
            this.analyzer = null;
            this.audioContext = null;
            this.canvas = {canvas: null, canvasContext: null};
            this.source = null;
            this.playbackInfo = {startedAt: 0, pausedAt: 0};
        }

        initAudio(bytes: Uint8Array): void {
            try {
                this.audioContext = new ((<any>window).AudioContext || (<any>window).webkitAudioContext);

                this.canvas.canvas = document.getElementById('soundVisualizer') as HTMLCanvasElement;

                if (this.canvas) {
                    this.canvas.canvasContext = this.canvas.canvas!.getContext(('2d'));

                    this.analyzer = this.audioContext!.createAnalyser();
                    this.analyzer.fftSize = 256;
                    this.byteArray = bytes;
                    this.source = this.audioContext!.createBufferSource();
                    this.source.connect(this.analyzer);
                    this.analyzer.connect(this.audioContext!.destination);

                }
            } catch {
                console.error("Could not init the audio");
            }
        }

        pause(): void {
            const elapsed = this.audioContext!.currentTime - this.playbackInfo.startedAt;
            this.source!.stop();
            this.playbackInfo.pausedAt = elapsed;
        }

        play() {
            try {

                const offset = this.playbackInfo.pausedAt;
                const newBuffer = new Uint8Array(this.byteArray!);
                this.audioContext?.decodeAudioData(newBuffer!.buffer.slice(0), (buffer) => {
                    const newSource = this.audioContext!.createBufferSource();
                    newSource.buffer = buffer;

                    newSource.onended = () => {
                        // Handle the end of playback if needed
                    };

                    this.source = newSource;
                    this.source.connect(this.analyzer!);
                    this.analyzer!.connect(this.audioContext!.destination);

                    // Adjust the start time based on the offset
                    this.source.start(0, offset);

                    this.playbackInfo.startedAt = this.audioContext!.currentTime - offset;
                    this.playbackInfo.pausedAt = 0;

                    this.visualize();
                })
                    .catch((error) => {
                        console.error('Error during audio decoding:', error);
                    });
            } catch (error) {
                console.error('Error during audio decoding:', error);
            }

        }

        stop(): void {
            if (this.source) {
                this.source!.disconnect();
                this.source.stop();
                this.source = null;
            }
            this.playbackInfo.startedAt = 0;
            this.playbackInfo.pausedAt = 0;
        }

        visualize(): void {
            const bufferLength = this.analyzer?.frequencyBinCount || 0;

            const draw = () => {
                this.analyzer?.getByteFrequencyData(this.byteArray!);

                const barWidth = (this.canvas.canvas?.width || 0) / bufferLength * 1.5;
                let barHeight;
                let x = 0;

                this.canvas.canvasContext?.clearRect(0, 0, this.canvas.canvas?.width || 0, this.canvas.canvas?.height || 0);

                for (let i = 0; i < bufferLength; i++) {
                    barHeight = this.byteArray![i];

                    const grayscaleValue = barHeight / 2;

                    this.canvas.canvasContext!.fillStyle = `rgba(255, 255, 255, ${grayscaleValue / 255})`;
                    this.canvas.canvasContext!.fillRect(x, this.canvas.canvas?.height! - barHeight / 2, barWidth, barHeight / 2);

                    x += barWidth + 2;
                }

                requestAnimationFrame(draw);
            };

            draw();
        }


    }

    export function Load(): void {
        window['araratMorse'] = new AudioManager();

    }
}

AraratMorse.Load();
