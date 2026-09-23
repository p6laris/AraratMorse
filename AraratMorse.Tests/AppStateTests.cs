using AraratMorse.State;
using MorseSharp;

namespace AraratMorse.Tests;

public class AppStateTests
{
    readonly AppState _state = new(new MorseService());

    [Fact]
    public void Starts_in_kurdish_encoding() =>
        Assert.Equal((Language.Kurdish, true), (_state.Language, _state.IsEncoding));

    [Fact]
    public void Translate_encodes_with_prosigns()
    {
        _state.SetLanguage(Language.English);
        _state.Translate("CQ <SK>");

        Assert.Equal("-.-. --.- / ...-.-", _state.Output);
        Assert.Null(_state.ErrorInfo);
    }

    [Fact]
    public void A_failed_translation_clears_the_output_and_explains()
    {
        _state.Translate("hello");

        Assert.Null(_state.Output);
        Assert.Equal("Kurdish Morse has no code for “h”.", _state.Error);
    }

    [Fact]
    public void Restore_sets_language_direction_and_input_in_one_step()
    {
        _state.ShowPanel(Panel.Sound);
        _state.Restore("-.-. --.-", isEncoding: false, Language.English);

        Assert.Equal((Language.English, false, "CQ"), (_state.Language, _state.IsEncoding, _state.Output));
        Assert.Equal(Panel.None, _state.ActivePanel);
    }

    [Fact]
    public void Changing_language_resets_the_conversion()
    {
        _state.Translate("سڵاو");
        _state.SetLanguage(Language.English);

        Assert.Null(_state.Input);
        Assert.Null(_state.Output);
    }

    [Fact]
    public void Every_change_is_announced()
    {
        var changes = 0;
        _state.Changed += () => changes++;

        _state.Translate("سڵاو");
        _state.Restore("CQ", true, Language.English);
        _state.ClosePanel();

        Assert.Equal(3, changes);
    }
}
