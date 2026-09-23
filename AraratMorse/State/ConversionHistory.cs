using System.Text.Json;
using Microsoft.JSInterop;
using MorseSharp;

namespace AraratMorse.State;

public record HistoryEntry(string Input, string Output, bool IsEncoding, Language Language, DateTimeOffset At);

/// <summary>The last few conversions, kept in localStorage so they survive a reload.</summary>
public class ConversionHistory(IJSRuntime js)
{
    const string StorageKey = "araratmorse.history";
    const int MaxEntries = 20;

    List<HistoryEntry> _entries = [];
    bool _loaded;

    public IReadOnlyList<HistoryEntry> Entries => _entries;

    public event Action? Changed;

    public async Task EnsureLoadedAsync()
    {
        if (_loaded)
            return;

        _loaded = true;
        try
        {
            var json = await js.InvokeAsync<string?>("localStorage.getItem", StorageKey);
            if (!string.IsNullOrEmpty(json))
                _entries = JsonSerializer.Deserialize<List<HistoryEntry>>(json) ?? [];
        }
        catch (JsonException)
        {
            // corrupt/old value — start over
        }

        Changed?.Invoke();
    }

    public async Task RecordAsync(string input, string output, bool isEncoding, Language language)
    {
        await EnsureLoadedAsync();

        // Typing produces a run of growing (or, when deleting, shrinking) inputs: keep only the
        // latest of a run instead of one entry per pause.
        if (_entries.Count > 0 && _entries[0] is var latest
            && latest.IsEncoding == isEncoding && latest.Language == language
            && (input.StartsWith(latest.Input, StringComparison.Ordinal) || latest.Input.StartsWith(input, StringComparison.Ordinal)))
        {
            _entries.RemoveAt(0);
        }

        _entries.RemoveAll(e => e.Input == input && e.IsEncoding == isEncoding && e.Language == language);
        _entries.Insert(0, new HistoryEntry(input, output, isEncoding, language, DateTimeOffset.Now));

        if (_entries.Count > MaxEntries)
            _entries.RemoveRange(MaxEntries, _entries.Count - MaxEntries);

        await SaveAsync();
    }

    public async Task ClearAsync()
    {
        _entries.Clear();
        await SaveAsync();
    }

    async Task SaveAsync()
    {
        await js.InvokeVoidAsync("localStorage.setItem", StorageKey, JsonSerializer.Serialize(_entries));
        Changed?.Invoke();
    }
}
