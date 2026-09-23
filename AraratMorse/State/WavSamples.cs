namespace AraratMorse.State;

/// <summary>
/// Reads PCM samples out of a WAV byte array — for drawing a waveform from the actual audio
/// rather than guessing at it through a Web Audio analyser, and for handing raw samples to
/// MorseSharp's audio decoder.
/// </summary>
public static class WavSamples
{
    ref struct Header
    {
        public int SampleRate;
        public short Channels;
        public short BitsPerSample;
        public ReadOnlySpan<byte> Data;
    }

    static bool TryParseHeader(ReadOnlySpan<byte> wav, out Header header)
    {
        header = default;

        if (wav.Length < 12)
            return false;

        var sampleRate = 0;
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
                sampleRate = BitConverter.ToInt32(body.Slice(4, 4));
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
            return false;

        header = new Header { SampleRate = sampleRate, Channels = channels, BitsPerSample = bitsPerSample, Data = data };
        return true;
    }

    /// <summary>Mono-downmixed samples normalized to [-1, 1], for visualization.</summary>
    public static float[] Read(ReadOnlySpan<byte> wav)
    {
        if (!TryParseHeader(wav, out var header))
            return [];

        var bytesPerSample = header.BitsPerSample / 8;
        var frameSize = bytesPerSample * header.Channels;
        if (frameSize <= 0)
            return [];

        var frameCount = header.Data.Length / frameSize;
        var samples = new float[frameCount];

        for (var i = 0; i < frameCount; i++)
        {
            var frame = header.Data.Slice(i * frameSize, bytesPerSample); // first channel only
            samples[i] = header.BitsPerSample switch
            {
                8 => (frame[0] - 128) / 128f,
                16 => BitConverter.ToInt16(frame) / 32768f,
                32 => BitConverter.ToSingle(frame),
                _ => 0f
            };
        }

        return samples;
    }

    /// <summary>
    /// Mono-downmixed 16-bit PCM samples plus the file's sample rate, for handing straight to
    /// MorseSharp's <c>FromAudio</c>/<c>CreateAudioDecoder</c>, which expect 16-bit PCM.
    /// </summary>
    public static short[] ReadPcm16(ReadOnlySpan<byte> wav, out int sampleRate)
    {
        if (!TryParseHeader(wav, out var header))
        {
            sampleRate = 0;
            return [];
        }

        sampleRate = header.SampleRate;

        var bytesPerSample = header.BitsPerSample / 8;
        var frameSize = bytesPerSample * header.Channels;
        if (frameSize <= 0)
            return [];

        var frameCount = header.Data.Length / frameSize;
        var samples = new short[frameCount];

        for (var i = 0; i < frameCount; i++)
        {
            var frame = header.Data.Slice(i * frameSize, bytesPerSample); // first channel only
            samples[i] = header.BitsPerSample switch
            {
                8 => (short)((frame[0] - 128) * 256),
                16 => BitConverter.ToInt16(frame),
                32 => (short)Math.Clamp(BitConverter.ToSingle(frame) * 32768f, short.MinValue, short.MaxValue),
                _ => (short)0
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
