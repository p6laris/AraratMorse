using MorseSharp.Audio;

namespace AraratMorse.State;

public record SoundPreset(string Name, int CharSpeed, int WordSpeed, double Frequency, AudioFormat Format)
{
    public const string CustomName = "Custom";

    public static readonly SoundPreset Classic = new("Classic", 20, 20, 700, AudioFormat.Default);

    public static readonly SoundPreset Practice = new("Practice", 20, 12, 600, AudioFormat.Default);

    public static readonly SoundPreset Contest = new("Contest", 30, 30, 650, AudioFormat.Default);

    public static readonly SoundPreset Soft =
        new("Soft", 18, 18, 550, AudioFormat.Default with { EdgeMilliseconds = 10 });

    public static readonly SoundPreset Studio =
        new("Studio", 25, 25, 700, new AudioFormat(44100, 1, AudioBitDepth.Float32, 5));

    public static readonly IReadOnlyList<SoundPreset> All = [Classic, Practice, Contest, Soft, Studio];
}
