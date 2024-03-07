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
                    this.canvas.canvasContext = this.canvas.canvas!.getContext(('2d'));

                    // Set initial canvas size
                    this.resizeCanvas();

                    // Handle window resize events
                    window.addEventListener('resize', () => this.resizeCanvas());

                    this.playBtn = document.getElementById("playBtn") as HTMLButtonElement;
                    this.pauseBtn = document.getElementById("pauseBtn") as HTMLButtonElement;
                    this.stopBtn = document.getElementById("stopBtn") as HTMLButtonElement;

                    this.audioElement.onended = (e) => {
                        this.setBtnsStyles(AudioAction.Initial);
                    }

                    this.audioElement.onplaying = (e) => {
                        this.setBtnsStyles(AudioAction.Playing);
                    }

                    this.audioElement.onpause = (e) => {
                        this.setBtnsStyles(AudioAction.Pause);
                    }
                }
            } catch {
                console.error("Could not init the audio");
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
            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaElementSource(this.audioElement);
            source.connect(analyser);
            analyser.connect(audioContext.destination);

            analyser.fftSize = 256; // You can adjust this value based on your needs
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const canvas = this.canvas.canvas!;
            const canvasContext = this.canvas.canvasContext!;
            const WIDTH = canvas.width;
            const HEIGHT = canvas.height;

            canvasContext.clearRect(0, 0, WIDTH, HEIGHT);

            const draw = () => {
                analyser.getByteFrequencyData(dataArray);

                canvasContext.fillStyle = 'black';
                canvasContext.fillRect(0, 0, WIDTH, HEIGHT);

                const barWidth = (WIDTH / bufferLength) * 2.5;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    const frequency = i / bufferLength; // Map frequency to [0, 1]

                    const barHeight = dataArray[i] * 2; // Adjusted scaling for barHeight

                    // Set white-shaded bars with a little dark shade
                    const darkShade = Math.floor(5 * frequency); // Adjusted for a little dark shade

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




