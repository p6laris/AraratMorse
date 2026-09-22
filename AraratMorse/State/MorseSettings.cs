using MorseSharp.Audio;

namespace AraratMorse.State;

public class MorseSettings
{
    public int CharSpeed { get; private set; } = 25;
    public int WordSpeed { get; private set; } = 25;
    public double Frequency { get; private set; } = 700;
    public AudioFormat Format { get; private set; } = AudioFormat.Default;
    public string PresetName { get; private set; } = SoundPreset.CustomName;

    public event Action? Changed;

    public void ApplyCustom(int charSpeed, int wordSpeed, double frequency, AudioFormat format)
    {
        CharSpeed = charSpeed;
        WordSpeed = wordSpeed;
        Frequency = frequency;
        Format = format;
        PresetName = SoundPreset.CustomName;
        Changed?.Invoke();
    }

    public void ApplyPreset(SoundPreset preset)
    {
        CharSpeed = preset.CharSpeed;
        WordSpeed = preset.WordSpeed;
        Frequency = preset.Frequency;
        Format = preset.Format;
        PresetName = preset.Name;
        Changed?.Invoke();
    }
}
