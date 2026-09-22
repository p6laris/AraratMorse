namespace AraratMorse.State;

/// <summary>
/// Reads mono-downmixed PCM samples out of a WAV byte array, for drawing a waveform from the
/// actual audio rather than guessing at it through a Web Audio analyser.
/// </summary>
public static class WavSamples
{
    public static float[] Read(ReadOnlySpan<byte> wav)
    {
        if (wav.Length < 12)
            return [];

        short channels = 1;
        short bitsPerSample = 16;
        ReadOnlySpan<byte> data = default;

        var pos = 12; // past the 12-byte RIFF/WAVE header
        while (pos + 8 <= wav.Length)
        {
            var chunkId = wav.Slice(pos, 4);
            var chunkSize = BitConverter.ToInt32(wav.Slice(pos + 4, 4));
            var bodyStart = pos + 8;
            var bodyLength = Math.Clamp(chunkSize, 0, wav.Length - bodyStart);
            var body = wav.Slice(bodyStart, bodyLength);

            if (chunkId.SequenceEqual("fmt "u8) && body.Length >= 16)
            {
                channels = BitConverter.ToInt16(body.Slice(2, 2));
                bitsPerSample = BitConverter.ToInt16(body.Slice(14, 2));
            }
            else if (chunkId.SequenceEqual("data"u8))
            {
                data = body;
                break;
            }

            pos = bodyStart + bodyLength + (bodyLength % 2);
        }

        if (data.IsEmpty || channels < 1 || bitsPerSample <= 0)
            return [];

        var bytesPerSample = bitsPerSample / 8;
        var frameSize = bytesPerSample * channels;
        if (frameSize <= 0)
            return [];

        var frameCount = data.Length / frameSize;
        var samples = new float[frameCount];

        for (var i = 0; i < frameCount; i++)
        {
            var frame = data.Slice(i * frameSize, bytesPerSample); // first channel only
            samples[i] = bitsPerSample switch
            {
                8 => (frame[0] - 128) / 128f,
                16 => BitConverter.ToInt16(frame) / 32768f,
                32 => BitConverter.ToSingle(frame),
                _ => 0f
            };
        }

        return samples;
    }

    /// <summary>One (min, max) amplitude pair per pixel column, for a peak-envelope waveform.</summary>
    public static (float Min, float Max)[] Downsample(ReadOnlySpan<float> samples, int columns)
    {
        if (samples.Length == 0 || columns <= 0)
            return [];

        var result = new (float Min, float Max)[columns];
        var samplesPerColumn = (double)samples.Length / columns;

        for (var c = 0; c < columns; c++)
        {
            var start = (int)(c * samplesPerColumn);
            var end = Math.Max(start + 1, (int)Math.Min(samples.Length, (c + 1) * samplesPerColumn));

            var min = float.MaxValue;
            var max = float.MinValue;
            for (var i = start; i < end; i++)
            {
                if (samples[i] < min) min = samples[i];
                if (samples[i] > max) max = samples[i];
            }

            result[c] = (min, max);
        }

        return result;
    }
}
