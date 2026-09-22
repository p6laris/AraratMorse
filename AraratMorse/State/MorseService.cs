using MorseSharp;

namespace AraratMorse.State;

public class MorseService
{
    public string Encode(string text, Language language) =>
        Morse.GetConverter().ForLanguage(language).ToMorse(text).Encode();

    public string Decode(string morse, Language language) =>
        Morse.GetConverter().ForLanguage(language).Decode(morse);

    public byte[] GetWav(string morse, Language language, int charSpeed, int wordSpeed, double frequency) =>
        Morse.GetConverter().ForLanguage(language).ToAudio(morse)
            .SetAudioOptions(charSpeed, wordSpeed, frequency).GetBytes();

    public Task PlayLightAsync(string morse, Language language, int charSpeed, int wordSpeed,
        Action<bool> onBlink, CancellationToken token) =>
        Morse.GetConverter().ForLanguage(language).ToLight(morse)
            .SetBlinkerOptions(charSpeed, wordSpeed).DoBlinks(onBlink, token);
}
