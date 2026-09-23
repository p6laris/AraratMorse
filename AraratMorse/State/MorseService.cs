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

    public IAsyncEnumerable<MorseElement> PlayLightElements(string morse, Language language, int charSpeed,
        int wordSpeed, CancellationToken token) =>
        Morse.GetConverter().ForLanguage(language).ToLight(morse)
            .SetBlinkerOptions(charSpeed, wordSpeed).PlayAsync(token);

    public string FromAudio(ReadOnlySpan<short> samples, Language language, int sampleRate, double frequency,
        int wordsPerMinute) =>
        Morse.GetConverter().ForLanguage(language).FromAudio(samples, sampleRate, frequency, wordsPerMinute);

    public StreamingMorseDecoder CreateAudioDecoder(Language language, int sampleRate, double frequency,
        int wordsPerMinute) =>
        Morse.GetConverter().ForLanguage(language).CreateAudioDecoder(sampleRate, frequency, wordsPerMinute);

    public MorseAlphabet BuildAlphabet(Language? baseLanguage, IEnumerable<(char Character, string Pattern)> entries)
    {
        var builder = baseLanguage is { } lang ? MorseAlphabetBuilder.From(lang) : new MorseAlphabetBuilder("Custom");

        foreach (var (character, pattern) in entries)
            builder.Add(character, pattern);

        return builder.Build();
    }

    public string EncodeWithAlphabet(string text, MorseAlphabet alphabet) =>
        Morse.GetConverter().ForAlphabet(alphabet).ToMorse(text).Encode();

    public string DecodeWithAlphabet(string morse, MorseAlphabet alphabet) =>
        Morse.GetConverter().ForAlphabet(alphabet).Decode(morse);
}
