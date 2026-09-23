using MorseSharp.Exceptions;

namespace AraratMorse.State;

public record FriendlyError(string Message, string? Hint, string Detail);

public static class FriendlyErrors
{
    public static FriendlyError Describe(Exception ex) => ex switch
    {
        CharacterNotPresentedException e => new(
            char.IsSurrogate(e.Character) || char.IsControl(e.Character)
                ? $"{e.AlphabetName} Morse has no code for one of those symbols."
                : $"{e.AlphabetName} Morse has no code for “{e.Character}”.",
            "Try another language, or add the character on the Custom Alphabet page.",
            ex.Message),

        ProsignNotPresentedException e => new(
            $"{e.Prosign} isn't a prosign in {e.AlphabetName}.",
            "Open Prosigns to see the ones you can use.",
            ex.Message),

        SequenceNotFoundException e when e.Sequence.Any(c => c is not ('.' or '-' or '/' or ' ')) => new(
            "Morse can only contain dots (.), dashes (-), spaces and slashes.",
            "Switch the direction to convert text into Morse instead.",
            ex.Message),

        SequenceNotFoundException e => new(
            $"“{e.Sequence}” isn't a letter in {e.AlphabetName} Morse.",
            "Check for a missing space between letters, or try another language.",
            ex.Message),

        SmallerCharSpeedException => new(
            "Character speed can't be slower than word speed.",
            "Raise the character speed or lower the word speed in Settings.",
            ex.Message),

        _ => new("Something went wrong converting this.", null, ex.Message)
    };
}
