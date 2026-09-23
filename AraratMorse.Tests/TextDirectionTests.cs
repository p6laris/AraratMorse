using AraratMorse.State;

namespace AraratMorse.Tests;

public class TextDirectionTests
{
    [Theory]
    [InlineData("سڵاو", "rtl")]           // Kurdish (Sorani)
    [InlineData("مرحبا", "rtl")]          // Arabic
    [InlineData("שלום", "rtl")]           // Hebrew
    [InlineData("Silav", "ltr")]          // Kurdish (Latin)
    [InlineData("... --- ...", "ltr")]    // Morse has no strong characters
    [InlineData("", "ltr")]
    [InlineData(null, "ltr")]
    public void Follows_the_first_strong_character(string? text, string expected) =>
        Assert.Equal(expected, TextDirection.Of(text));

    [Fact]
    public void Leading_digits_and_punctuation_do_not_decide() =>
        Assert.Equal("rtl", TextDirection.Of("73! سڵاو"));

    [Fact]
    public void Latin_first_wins_over_later_arabic() =>
        Assert.Equal("ltr", TextDirection.Of("CQ سڵاو"));
}
