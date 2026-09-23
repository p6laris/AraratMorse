using AraratMorse.State;
using MorseSharp;

namespace AraratMorse.Tests;

public class FriendlyErrorsTests
{
    static readonly MorseService Morse = new();

    static FriendlyError DescribeFailure(Action action) => FriendlyErrors.Describe(Assert.ThrowsAny<Exception>(action));

    [Fact]
    public void Names_the_character_a_language_cannot_encode()
    {
        var error = DescribeFailure(() => Morse.Encode("hello", Language.Kurdish));
        Assert.Equal("Kurdish Morse has no code for “h”.", error.Message);
        Assert.Contains("Custom Alphabet", error.Hint);
        Assert.Contains("'h'", error.Detail);
    }

    [Fact]
    public void Does_not_quote_half_of_an_emoji()
    {
        var error = DescribeFailure(() => Morse.Encode("hi 😀", Language.English));
        Assert.Equal("English Morse has no code for one of those symbols.", error.Message);
    }

    [Fact]
    public void Explains_an_unknown_prosign()
    {
        var error = DescribeFailure(() => Morse.Encode("<ZZ>", Language.English));
        Assert.Equal("<ZZ> isn't a prosign in English.", error.Message);
    }

    [Fact]
    public void Letters_in_morse_input_get_the_dots_and_dashes_explanation()
    {
        var error = DescribeFailure(() => Morse.Decode(".- x -...", Language.English));
        Assert.StartsWith("Morse can only contain dots", error.Message);
    }

    [Fact]
    public void An_unknown_pattern_is_quoted()
    {
        var error = DescribeFailure(() => Morse.Decode(".........", Language.English));
        Assert.Equal("“.........” isn't a letter in English Morse.", error.Message);
    }

    [Fact]
    public void Anything_else_gets_a_generic_message_and_keeps_the_detail()
    {
        var error = FriendlyErrors.Describe(new InvalidOperationException("boom"));
        Assert.Equal("Something went wrong converting this.", error.Message);
        Assert.Null(error.Hint);
        Assert.Equal("boom", error.Detail);
    }
}
