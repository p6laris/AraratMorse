using Microsoft.JSInterop;

namespace AraratMorse.Tests;

/// <summary>An <see cref="IJSRuntime"/> that answers only <c>localStorage.getItem/setItem</c>, from memory.</summary>
sealed class FakeLocalStorage : IJSRuntime
{
    public Dictionary<string, string> Items { get; } = [];

    public ValueTask<TValue> InvokeAsync<TValue>(string identifier, object?[]? args) =>
        InvokeAsync<TValue>(identifier, CancellationToken.None, args);

    public ValueTask<TValue> InvokeAsync<TValue>(string identifier, CancellationToken cancellationToken, object?[]? args)
    {
        switch (identifier)
        {
            case "localStorage.getItem":
                Items.TryGetValue((string)args![0]!, out var value);
                return ValueTask.FromResult((TValue)(object?)value!);
            case "localStorage.setItem":
                Items[(string)args![0]!] = (string)args[1]!;
                return ValueTask.FromResult(default(TValue)!);
            default:
                throw new NotSupportedException(identifier);
        }
    }
}
