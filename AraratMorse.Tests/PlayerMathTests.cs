using AraratMorse.Components.UI.Player;
using AraratMorse.State;
using MorseSharp;
using MorseSharp.Audio;

namespace AraratMorse.Tests;

public class PlayerMathTests
{
    static readonly MorseService Morse = new();

    [Fact]
    public void Sounding_duration_stops_at_the_last_tone()
    {
        // "M" at 20 wpm: dash 180, gap 60, dash 180 = 420 ms, then a 496 ms trailing letter gap.
        var sequence = Morse.GetElements("--", Language.English, 20, 12);

        Assert.Equal(420, ElementTimeline.SoundingDuration(sequence).TotalMilliseconds, precision: 0);
        Assert.True(sequence.Duration.TotalMilliseconds > 900);
    }

    [Fact]
    public void Frame_count_matches_the_audio_length()
    {
        var wav = Morse.GetWav("--", Language.English, 20, 12, 600, AudioFormat.Default);
        var sequence = Morse.GetElements("--", Language.English, 20, 12);

        var seconds = WavSamples.FrameCount(wav) / 11025.0;
        Assert.Equal(sequence.Duration.TotalSeconds, seconds, precision: 2);
    }

    [Fact]
    public void Peaks_show_the_keying_pattern()
    {
        // "..." then silence: over the sounding part, three loud runs separated by quiet ones.
        var wav = Morse.GetWav("...", Language.English, 20, 20, 600, AudioFormat.Default);
        var sequence = Morse.GetElements("...", Language.English, 20, 20);
        var fraction = ElementTimeline.SoundingDuration(sequence) / sequence.Duration;
        var frames = (int)(WavSamples.FrameCount(wav) * fraction);

        var peaks = WavSamples.Peaks(wav, frames, 100);
        var runs = string.Concat(peaks.Select(p => p > 0.25f ? '#' : '_'));
        var tones = runs.Split('_', StringSplitOptions.RemoveEmptyEntries);

        Assert.Equal(100, peaks.Length);
        Assert.Equal(3, tones.Length);
        Assert.All(peaks, p => Assert.InRange(p, 0f, 1f));
    }

    [Fact]
    public void Float_audio_is_read_as_well_as_16_bit()
    {
        var studio = new AudioFormat(44100, 1, AudioBitDepth.Float32, 5);
        var wav = Morse.GetWav(".", Language.English, 20, 20, 700, studio);

        var peaks = WavSamples.Peaks(wav, WavSamples.FrameCount(wav), 20);
        Assert.Contains(peaks, p => p > 0.5f);
    }

    [Fact]
    public void Garbage_bytes_give_no_peaks_instead_of_throwing()
    {
        Assert.Empty(WavSamples.Peaks([1, 2, 3], 10, 10));
        Assert.Equal(0, WavSamples.FrameCount([]));
    }

    [Fact]
    public void Pcm16_round_trips_through_the_decoder()
    {
        var wav = Morse.GetWav(".... ..", Language.English, 20, 20, 600, AudioFormat.Default);
        var samples = WavSamples.ReadPcm16(wav, out var rate);

        Assert.Equal(11025, rate);
        Assert.Equal("HI", Morse.FromAudio(samples, Language.English, rate, 600, 20).Trim());
    }
}
