window.sound = null;

window.audio = {
    analyser: null,
    canvas: null,
    isPaused: false,
    isStopped:false,
    
    saveAudio: function (text, byteArray) {
        if (byteArray) {
            try {
                const byteArrayCopy = new Uint8Array(byteArray);

                // Create a Blob from the audio data
                const blob = new Blob([byteArrayCopy], { type: 'audio/wav' });

                // Create a download link
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = text + '.wav';

                // Append the link to the document
                document.body.appendChild(a);

                // Trigger a click on the link to start the download
                a.click();

                // Remove the link from the document
                document.body.removeChild(a);

                // Release the object URL
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Error during audio saving:', error);
            }
        }
    },

    updateCanvasSize: function () {
        // Set canvas dimensions based on parent size
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
    },

    initAudio: function () {
        // Check if the element exists before attempting to get its context
        this.canvas = document.getElementById('soundVisualizer');
        if (this.canvas) {
            this.canvasContext = this.canvas.getContext('2d');
            this.updateCanvasSize();

            window.addEventListener('resize', () => {
                // Update canvas size when the window is resized
                this.updateCanvasSize();
            });

            console.log(this.canvas);
        } else {
            console.error("Element with ID 'soundVisualizer' not found.");
        }
    },

visualize: function (wavData) {
        this.initAudio();
        var audioContext = new (window.AudioContext || window.webkitAudioContext)();
        var analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;  // You can adjust this value for more or less frequency data points

        audioContext.decodeAudioData(wavData.buffer, (buffer) => {
            var source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(analyser);
            analyser.connect(audioContext.destination);

            source.start(0);

            // Get frequency data
            var dataArray = new Uint8Array(analyser.frequencyBinCount);

            var draw = () => {
                analyser.getByteFrequencyData(dataArray);

                // Draw vertical bars on the canvas
                var barWidth = Math.ceil(this.canvas.width / dataArray.length);

                this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
                for (var i = 0; i < dataArray.length; i++) {
                    var x = i * barWidth;
                    var barHeight = dataArray[i] / 256 * this.canvas.height;
                    this.canvasContext.fillStyle = 'white'; // Set bar color to white
                    this.canvasContext.fillRect(x, this.canvas.height - barHeight, barWidth, barHeight);
                }

                requestAnimationFrame(draw);
            };

            draw();
        });
    },
    startVisualize : function (src) {
        
        this.isPaused = false;
        this.isStopped = false;
        src.Start(0);
        draw();
        
    }
};
