using AraratMorse.Models;

namespace AraratMorse.Tests;

public class SettingsTests
{
    [Fact]
    public void Valid_settings_have_no_problems() =>
        Assert.Empty(new Settings { CharSpeed = 20, WordSpeed = 12, Frequency = 600 }.Validate());

    [Fact]
    public void Char_speed_equal_to_word_speed_is_fine() =>
        Assert.Empty(new Settings { CharSpeed = 20, WordSpeed = 20, Frequency = 600 }.Validate());

    [Fact]
    public void Char_speed_below_word_speed_is_reported_on_char_speed()
    {
        var problem = Assert.Single(new Settings { CharSpeed = 10, WordSpeed = 20, Frequency = 600 }.Validate());
        Assert.Equal(nameof(Settings.CharSpeed), problem.Field);
        Assert.Contains("greater than or equal to Word Speed", problem.Message);
    }

    [Fact]
    public void A_zero_char_speed_only_reports_that_it_is_zero()
    {
        // Not also "below word speed": one message per field.
        var problem = Assert.Single(new Settings { CharSpeed = 0, WordSpeed = 12, Frequency = 600 }.Validate());
        Assert.Equal("Char speed must be greater than zero.", problem.Message);
    }

    [Fact]
    public void Every_non_positive_value_is_reported()
    {
        var fields = new Settings { CharSpeed = 0, WordSpeed = -1, Frequency = 0 }.Validate().Select(p => p.Field);
        Assert.Equal([nameof(Settings.CharSpeed), nameof(Settings.WordSpeed), nameof(Settings.Frequency)], fields);
    }
}
