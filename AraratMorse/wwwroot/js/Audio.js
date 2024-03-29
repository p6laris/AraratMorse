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
    let AudioAction;
    (function (AudioAction) {
        AudioAction[AudioAction["Initial"] = 0] = "Initial";
        AudioAction[AudioAction["Playing"] = 1] = "Playing";
        AudioAction[AudioAction["Pause"] = 2] = "Pause";
        AudioAction[AudioAction["Stop"] = 3] = "Stop";
    })(AudioAction || (AudioAction = {}));
    class AudioManager {
        constructor() {
            this.canvas = { canvas: null, canvasContext: null };
            this.playbackInfo = { startedAt: 0, pausedAt: 0 };
        }
        setBtnsStyles(action) {
            switch (action) {
                case AudioAction.Initial:
                    this.playBtn.classList.remove("text-green-300");
                    this.playBtn.classList.add("text-green-600");
                    this.pauseBtn.classList.remove("text-gray-600");
                    this.pauseBtn.classList.add("text-gray-300");
                    this.stopBtn.classList.remove("text-rose-600");
                    this.stopBtn.classList.add("text-rose-300");
                    break;
                case AudioAction.Playing:
                    this.playBtn.classList.remove("text-green-600");
                    this.playBtn.classList.add("text-green-300");
                    this.pauseBtn.classList.remove("text-gray-300");
                    this.pauseBtn.classList.add("text-gray-600");
                    this.stopBtn.classList.remove("text-rose-300");
                    this.stopBtn.classList.add("text-rose-600");
                    break;
                case AudioAction.Pause:
                    this.playBtn.classList.remove("text-green-300");
                    this.playBtn.classList.add("text-green-600");
                    this.pauseBtn.classList.remove("text-gray-600");
                    this.pauseBtn.classList.add("text-gray-300");
                    break;
                case AudioAction.Stop:
                    this.playBtn.classList.remove("text-green-300");
                    this.playBtn.classList.add("text-green-600");
                    this.pauseBtn.classList.remove("text-gray-600");
                    this.pauseBtn.classList.add("text-gray-300");
                    this.stopBtn.classList.remove("text-rose-600");
                    this.stopBtn.classList.add("text-rose-300");
                    break;
            }
        }
        download(name) {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield fetch(this.audioElement.src);
                const buffer = yield res.arrayBuffer();
                const blob = new Blob([buffer], { type: "audio/wav" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        }
        initAudio() {
            try {
                this.canvas.canvas = document.getElementById('soundVisualizer');
                this.audioElement = document.getElementById("audio");
                if (this.canvas) {
                    this.canvas.canvasContext = this.canvas.canvas.getContext(('2d'));
                    // Set initial canvas size
                    this.resizeCanvas();
                    // Handle window resize events
                    window.addEventListener('resize', () => this.resizeCanvas());
                    this.playBtn = document.getElementById("playBtn");
                    this.pauseBtn = document.getElementById("pauseBtn");
                    this.stopBtn = document.getElementById("stopBtn");
                    this.audioElement.onended = (e) => {
                        this.setBtnsStyles(AudioAction.Initial);
                    };
                    this.audioElement.onplaying = (e) => {
                        this.setBtnsStyles(AudioAction.Playing);
                    };
                    this.audioElement.onpause = (e) => {
                        this.setBtnsStyles(AudioAction.Pause);
                    };
                }
            }
            catch (_a) {
                console.error("Could not init the audio");
            }
        }
        resizeCanvas() {
            var _a;
            const parent = (_a = this.canvas.canvas) === null || _a === void 0 ? void 0 : _a.parentElement;
            if (parent) {
                this.canvas.canvas.width = parent.clientWidth;
                this.canvas.canvas.height = parent.clientHeight;
            }
        }
        pause() {
            this.audioElement.pause();
        }
        play() {
            this.audioElement.play();
            this.visualize();
        }
        stop() {
            this.audioElement.pause();
            this.setBtnsStyles(AudioAction.Stop);
            this.audioElement.currentTime = 0;
        }
        visualize() {
            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaElementSource(this.audioElement);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            analyser.fftSize = 256; // You can adjust this value based on your needs
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            const canvas = this.canvas.canvas;
            const canvasContext = this.canvas.canvasContext;
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
    function Load() {
        window['araratMorse'] = new AudioManager();
    }
    AraratMorse.Load = Load;
})(AraratMorse || (AraratMorse = {}));
AraratMorse.Load();
