namespace AraratMorse.State;

/// <summary>
/// Per-character accuracy and confusion tracking for the Koch trainer, plus the unlocked level
/// and a daily practice streak. Held in memory here; a page (Koch.razor) is responsible for
/// loading/saving a <see cref="Snapshot"/> to localStorage.
/// </summary>
public class KochStats
{
    public int Level { get; private set; } = 2;
    public int StreakDays { get; private set; }
    public DateOnly? LastPracticeDate { get; private set; }

    readonly Dictionary<char, (int Correct, int Total)> _perCharacter = new();
    readonly Dictionary<string, int> _confusions = new(); // "K>R" (sent > typed) -> count

    public event Action? Changed;

    public IReadOnlyDictionary<char, (int Correct, int Total)> PerCharacter => _perCharacter;
    public IReadOnlyDictionary<string, int> Confusions => _confusions;

    public double AccuracyFor(char c) =>
        _perCharacter.TryGetValue(c, out var s) && s.Total > 0 ? (double)s.Correct / s.Total : 1.0;

    public void SetLevel(int level)
    {
        Level = level;
        Changed?.Invoke();
    }

    /// <summary>Records one character having been sent and what the learner typed for it.</summary>
    public void RecordAttempt(char sent, char typed)
    {
        var (correct, total) = _perCharacter.GetValueOrDefault(sent);
        total++;
        if (sent == typed)
        {
            correct++;
        }
        else
        {
            var key = $"{sent}>{typed}";
            _confusions[key] = _confusions.GetValueOrDefault(key) + 1;
        }

        _perCharacter[sent] = (correct, total);
        Changed?.Invoke();
    }

    /// <summary>Call once when a practice session ends, to advance the daily streak.</summary>
    public void RecordPracticeSession()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (LastPracticeDate != today)
        {
            StreakDays = LastPracticeDate == today.AddDays(-1) ? StreakDays + 1 : 1;
            LastPracticeDate = today;
        }

        Changed?.Invoke();
    }

    public char? WeakestCharacter(ReadOnlySpan<char> pool)
    {
        char? weakest = null;
        var weakestAccuracy = double.MaxValue;

        foreach (var c in pool)
        {
            var accuracy = AccuracyFor(c);
            if (accuracy < weakestAccuracy)
            {
                weakestAccuracy = accuracy;
                weakest = c;
            }
        }

        return weakest;
    }

    public record Snapshot(int Level, int StreakDays, DateOnly? LastPracticeDate,
        Dictionary<string, int[]> PerCharacter, Dictionary<string, int> Confusions);

    public Snapshot ToSnapshot() => new(
        Level,
        StreakDays,
        LastPracticeDate,
        _perCharacter.ToDictionary(kv => kv.Key.ToString(), kv => new[] { kv.Value.Correct, kv.Value.Total }),
        new Dictionary<string, int>(_confusions));

    public void LoadFrom(Snapshot snapshot)
    {
        Level = snapshot.Level;
        StreakDays = snapshot.StreakDays;
        LastPracticeDate = snapshot.LastPracticeDate;

        _perCharacter.Clear();
        foreach (var (key, value) in snapshot.PerCharacter)
            if (key.Length == 1 && value.Length == 2)
                _perCharacter[key[0]] = (value[0], value[1]);

        _confusions.Clear();
        foreach (var (key, value) in snapshot.Confusions)
            _confusions[key] = value;

        Changed?.Invoke();
    }
}
