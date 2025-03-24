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
            this.audioContext = null;
            this.sourceNode = null;
            this.analyser = null;
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
                    this.canvas.canvasContext = this.canvas.canvas.getContext('2d');
                    this.resizeCanvas();
                    window.addEventListener('resize', () => this.resizeCanvas());
                    this.playBtn = document.getElementById("playBtn");
                    this.pauseBtn = document.getElementById("pauseBtn");
                    this.stopBtn = document.getElementById("stopBtn");
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
            }
            catch (error) {
                console.error("Could not init the audio", error);
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
            if (!this.analyser || !this.canvas.canvas || !this.canvas.canvasContext)
                return;
            const bufferLength = this.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            const canvas = this.canvas.canvas;
            const canvasContext = this.canvas.canvasContext;
            const WIDTH = canvas.width;
            const HEIGHT = canvas.height;
            canvasContext.clearRect(0, 0, WIDTH, HEIGHT);
            const draw = () => {
                this.analyser.getByteFrequencyData(dataArray);
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
    function Load() {
        window['araratMorse'] = new AudioManager();
    }
    AraratMorse.Load = Load;
})(AraratMorse || (AraratMorse = {}));
AraratMorse.Load();
