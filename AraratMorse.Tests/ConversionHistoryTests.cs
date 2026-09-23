using AraratMorse.State;
using MorseSharp;

namespace AraratMorse.Tests;

public class ConversionHistoryTests
{
    readonly FakeLocalStorage _storage = new();

    ConversionHistory NewHistory() => new(_storage);

    [Fact]
    public async Task Typing_a_word_keeps_only_its_latest_form()
    {
        var history = NewHistory();
        foreach (var input in new[] { "C", "CQ", "CQ D", "CQ DE" })
            await history.RecordAsync(input, "...", isEncoding: true, Language.English);

        Assert.Equal(["CQ DE"], history.Entries.Select(e => e.Input));
    }

    [Fact]
    public async Task Deleting_back_also_replaces_the_latest_entry()
    {
        var history = NewHistory();
        await history.RecordAsync("CQ DE", "...", true, Language.English);
        await history.RecordAsync("CQ", "...", true, Language.English);

        Assert.Equal(["CQ"], history.Entries.Select(e => e.Input));
    }

    [Fact]
    public async Task Unrelated_conversions_stack_up_newest_first()
    {
        var history = NewHistory();
        await history.RecordAsync("SOS", "...", true, Language.English);
        await history.RecordAsync("73", "...", true, Language.English);

        Assert.Equal(["73", "SOS"], history.Entries.Select(e => e.Input));
    }

    [Fact]
    public async Task A_different_language_or_direction_is_a_separate_entry()
    {
        var history = NewHistory();
        await history.RecordAsync("SO", "...", true, Language.English);
        await history.RecordAsync("SOS", "...", true, Language.Deutsch);
        await history.RecordAsync("SOS", "...", false, Language.Deutsch);

        Assert.Equal(3, history.Entries.Count);
    }

    [Fact]
    public async Task Repeating_an_older_conversion_moves_it_to_the_top_instead_of_duplicating()
    {
        var history = NewHistory();
        await history.RecordAsync("SOS", "...", true, Language.English);
        await history.RecordAsync("73", "...", true, Language.English);
        await history.RecordAsync("SOS", "...", true, Language.English);

        Assert.Equal(["SOS", "73"], history.Entries.Select(e => e.Input));
    }

    [Fact]
    public async Task Keeps_at_most_twenty()
    {
        var history = NewHistory();
        for (var i = 0; i < 25; i++)
            await history.RecordAsync($"MSG{i:00}X", "...", true, Language.English);

        Assert.Equal(20, history.Entries.Count);
        Assert.Equal("MSG24X", history.Entries[0].Input);
    }

    [Fact]
    public async Task Survives_a_reload_through_local_storage()
    {
        await NewHistory().RecordAsync("CQ DE W1AW", "-.-. --.-", false, Language.KurdishLatin);

        var reloaded = NewHistory();
        await reloaded.EnsureLoadedAsync();

        var entry = Assert.Single(reloaded.Entries);
        Assert.Equal(("CQ DE W1AW", "-.-. --.-", false, Language.KurdishLatin),
            (entry.Input, entry.Output, entry.IsEncoding, entry.Language));
    }

    [Fact]
    public async Task Corrupt_storage_starts_empty_instead_of_throwing()
    {
        _storage.Items["araratmorse.history"] = "{not json";
        var history = NewHistory();
        await history.EnsureLoadedAsync();
        Assert.Empty(history.Entries);
    }

    [Fact]
    public async Task Clear_empties_storage_too()
    {
        var history = NewHistory();
        await history.RecordAsync("SOS", "...", true, Language.English);
        await history.ClearAsync();

        var reloaded = NewHistory();
        await reloaded.EnsureLoadedAsync();
        Assert.Empty(reloaded.Entries);
    }
}
