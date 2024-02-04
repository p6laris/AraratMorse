"use strict";
var AraratMorse;
(function (AraratMorse) {
    class AudioManager {
        constructor() {
            this.analyzer = null;
            this.audioContext = null;
            this.canvas = { canvas: null, canvasContext: null };
            this.source = null;
            this.playbackInfo = { startedAt: 0, pausedAt: 0 };
        }
        initAudio(bytes) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext);
                this.canvas.canvas = document.getElementById('soundVisualizer');
                if (this.canvas) {
                    this.canvas.canvasContext = this.canvas.canvas.getContext(('2d'));
                    this.analyzer = this.audioContext.createAnalyser();
                    this.analyzer.fftSize = 256;
                    this.byteArray = bytes;
                    this.source = this.audioContext.createBufferSource();
                    this.source.connect(this.analyzer);
                    this.analyzer.connect(this.audioContext.destination);
                }
            }
            catch (_a) {
                console.error("Could not init the audio");
            }
        }
        pause() {
            const elapsed = this.audioContext.currentTime - this.playbackInfo.startedAt;
            this.source.stop();
            this.playbackInfo.pausedAt = elapsed;
        }
        play() {
            var _a;
            try {
                const offset = this.playbackInfo.pausedAt;
                const newBuffer = new Uint8Array(this.byteArray);
                (_a = this.audioContext) === null || _a === void 0 ? void 0 : _a.decodeAudioData(newBuffer.buffer.slice(0), (buffer) => {
                    const newSource = this.audioContext.createBufferSource();
                    newSource.buffer = buffer;
                    newSource.onended = () => {
                        // Handle the end of playback if needed
                    };
                    this.source = newSource;
                    this.source.connect(this.analyzer);
                    this.analyzer.connect(this.audioContext.destination);
                    // Adjust the start time based on the offset
                    this.source.start(0, offset);
                    this.playbackInfo.startedAt = this.audioContext.currentTime - offset;
                    this.playbackInfo.pausedAt = 0;
                    this.visualize();
                }).catch((error) => {
                    console.error('Error during audio decoding:', error);
                });
            }
            catch (error) {
                console.error('Error during audio decoding:', error);
            }
        }
        stop() {
            if (this.source) {
                this.source.disconnect();
                this.source.stop();
                this.source = null;
            }
            this.playbackInfo.startedAt = 0;
            this.playbackInfo.pausedAt = 0;
        }
        visualize() {
            var _a;
            const bufferLength = ((_a = this.analyzer) === null || _a === void 0 ? void 0 : _a.frequencyBinCount) || 0;
            const draw = () => {
                var _a, _b, _c, _d, _e, _f;
                (_a = this.analyzer) === null || _a === void 0 ? void 0 : _a.getByteFrequencyData(this.byteArray);
                const barWidth = (((_b = this.canvas.canvas) === null || _b === void 0 ? void 0 : _b.width) || 0) / bufferLength * 1.5;
                let barHeight;
                let x = 0;
                (_c = this.canvas.canvasContext) === null || _c === void 0 ? void 0 : _c.clearRect(0, 0, ((_d = this.canvas.canvas) === null || _d === void 0 ? void 0 : _d.width) || 0, ((_e = this.canvas.canvas) === null || _e === void 0 ? void 0 : _e.height) || 0);
                for (let i = 0; i < bufferLength; i++) {
                    barHeight = this.byteArray[i];
                    const grayscaleValue = barHeight / 2;
                    this.canvas.canvasContext.fillStyle = `rgba(255, 255, 255, ${grayscaleValue / 255})`;
                    this.canvas.canvasContext.fillRect(x, ((_f = this.canvas.canvas) === null || _f === void 0 ? void 0 : _f.height) - barHeight / 2, barWidth, barHeight / 2);
                    x += barWidth + 2;
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
