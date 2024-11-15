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
        canvas: ICanvas | null;
        playbackInfo: IPlayBackInfo;
        audioElement: HTMLAudioElement;

        initAudio(): void;
        play(): void;
        pause(): void;
        visualize(): void;
        stop(): void;

    }

    enum AudioAction {
        Initial,
        Playing,
        Pause,
        Stop
    }

    class AudioManager implements IAudioConfig {
        canvas: ICanvas;
        audioElement: HTMLAudioElement;
        playbackInfo: IPlayBackInfo;
        playBtn: HTMLButtonElement;
        pauseBtn: HTMLButtonElement;
        stopBtn: HTMLButtonElement;

        audioContext: AudioContext | null = null;
        sourceNode: MediaElementAudioSourceNode | null = null;
        analyser: AnalyserNode | null = null;

        constructor() {
            this.canvas = {canvas: null, canvasContext: null};
            this.playbackInfo = {startedAt: 0, pausedAt: 0};
        }

        setBtnsStyles(action: AudioAction): void {
            switch (action) {
                case AudioAction.Initial:
                    this.playBtn.classList.remove("text-green-300");
                    this.playBtn.classList.add("text-green-600");

                    this.pauseBtn.classList.remove("text-gray-600");
                    this.pauseBtn.classList.add("text-gray-300");

                    this.stopBtn.classList.remove("text-rose-600");
                    this.stopBtn.classList.add("text-rose-300");

                    this.playBtn.disabled = false;
                    this.pauseBtn.disabled = true;
                    this.stopBtn.disabled = true;

                    break;
                case AudioAction.Playing:
                    this.playBtn.classList.remove("text-green-600");
                    this.playBtn.classList.add("text-green-300");

                    this.pauseBtn.classList.remove("text-gray-300");
                    this.pauseBtn.classList.add("text-gray-600");

                    this.stopBtn.classList.remove("text-rose-300");
                    this.stopBtn.classList.add("text-rose-600");

                    this.playBtn.disabled = true;
                    this.pauseBtn.disabled = false;
                    this.stopBtn.disabled = false;

                    break;
                case AudioAction.Pause:
                    this.playBtn.classList.remove("text-green-300");
                    this.playBtn.classList.add("text-green-600");

                    this.pauseBtn.classList.remove("text-gray-600");
                    this.pauseBtn.classList.add("text-gray-300");

                    this.playBtn.disabled = false;
                    this.pauseBtn.disabled = true;
                    this.stopBtn.disabled = false;

                    break;

                case AudioAction.Stop:
                    this.playBtn.classList.remove("text-green-300");
                    this.playBtn.classList.add("text-green-600");

                    this.pauseBtn.classList.remove("text-gray-600");
                    this.pauseBtn.classList.add("text-gray-300");

                    this.stopBtn.classList.remove("text-rose-600");
                    this.stopBtn.classList.add("text-rose-300");

                    this.playBtn.disabled = false;
                    this.pauseBtn.disabled = true;
                    this.stopBtn.disabled = true;

                    break;

                default:
                    console.log("Unsupported action.");
            }
        }

        async download(name: string): Promise<void> {
            const res = await fetch(this.audioElement.src);
            const buffer = await res.arrayBuffer();

            const blob = new Blob([buffer], {type: "audio/wav"});
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = name;

            document.body.appendChild(a);

            a.click();

            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        initAudio(): void {
            try {
                this.canvas.canvas = document.getElementById('soundVisualizer') as HTMLCanvasElement;
                this.audioElement = document.getElementById("audio") as HTMLAudioElement;

                if (this.canvas) {
                    this.canvas.canvasContext = this.canvas.canvas.getContext('2d');
                    this.resizeCanvas();
                    window.addEventListener('resize', () => this.resizeCanvas());

                    this.playBtn = document.getElementById("playBtn") as HTMLButtonElement;
                    this.pauseBtn = document.getElementById("pauseBtn") as HTMLButtonElement;
                    this.stopBtn = document.getElementById("stopBtn") as HTMLButtonElement;

                    this.audioElement.onended = () => this.setBtnsStyles(AudioAction.Initial);
                    this.audioElement.onplaying = () => this.setBtnsStyles(AudioAction.Playing);
                    this.audioElement.onpause = () => this.setBtnsStyles(AudioAction.Pause);

                    if (!this.audioContext) {
                        this.audioContext = new AudioContext();
                        this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
                        this.analyser = this.audioContext.createAnalyser();

                        this.sourceNode.connect(this.analyser);
                        this.analyser.connect(this.audioContext.destination);

                        this.analyser.fftSize = 256;
                    }
                }
            } catch (error) {
                console.error("Could not init the audio", error);
            }
        }

        resizeCanvas(): void {
            const parent = this.canvas.canvas?.parentElement;
            if (parent) {
                this.canvas.canvas!.width = parent.clientWidth;
                this.canvas.canvas!.height = parent.clientHeight;
            }
        }

        pause(): void {
            this.audioElement.pause();
        }

        play() {
            this.audioElement.play();
            this.visualize();
        }

        stop(): void {
            this.audioElement.pause();
            this.setBtnsStyles(AudioAction.Stop);
            this.audioElement.currentTime = 0;
        }

        visualize(): void {
            if (!this.analyser || !this.canvas.canvas || !this.canvas.canvasContext) return;

            const bufferLength = this.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            const canvas = this.canvas.canvas;
            const canvasContext = this.canvas.canvasContext;
            const WIDTH = canvas.width;
            const HEIGHT = canvas.height;

            canvasContext.clearRect(0, 0, WIDTH, HEIGHT);

            const draw = () => {
                this.analyser!.getByteFrequencyData(dataArray);
                canvasContext.fillStyle = 'black';
                canvasContext.fillRect(0, 0, WIDTH, HEIGHT);

                const barWidth = (WIDTH / bufferLength) * 2.5;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    const frequency = i / bufferLength;
                    const barHeight = dataArray[i] * 2;
                    const darkShade = Math.floor(5 * frequency);
                    canvasContext.fillStyle = `rgb(${255 - darkShade}, ${255 - darkShade}, ${255 - darkShade})`;
                    canvasContext.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
                    x += barWidth + 1;
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




