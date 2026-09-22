using MorseSharp;
using MorseSharp.Audio;

namespace AraratMorse.State;

public class MorseService
{
    public string Encode(string text, Language language) =>
        Morse.GetConverter().ForLanguage(language).ToMorse(text).Encode();

    public string Decode(string morse, Language language) =>
        Morse.GetConverter().ForLanguage(language).Decode(morse);

    public byte[] GetWav(string morse, Language language, int charSpeed, int wordSpeed, double frequency,
        AudioFormat format) =>
        Morse.GetConverter().ForLanguage(language).ToAudio(morse)
            .SetAudioOptions(charSpeed, wordSpeed, frequency, format).GetBytes();

    public MorseElementSequence GetElements(string morse, Language language, int charSpeed, int wordSpeed) =>
        Morse.GetConverter().ForLanguage(language).ToLight(morse)
            .SetBlinkerOptions(charSpeed, wordSpeed).GetElements();

    public Task PlayLightAsync(string morse, Language language, int charSpeed, int wordSpeed,
        Action<bool> onBlink, CancellationToken token) =>
        Morse.GetConverter().ForLanguage(language).ToLight(morse)
            .SetBlinkerOptions(charSpeed, wordSpeed).DoBlinks(onBlink, token);
}
