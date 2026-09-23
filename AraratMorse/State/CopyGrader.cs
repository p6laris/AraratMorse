namespace AraratMorse.State;

/// <summary>Grades what was copied against what was sent, for the callsign and QSO drills.</summary>
public static class CopyGrader
{
    /// <summary>Per character, ignoring spaces and case: for callsigns.</summary>
    public static List<(string Token, bool Matched)> GradeCharacters(string sent, string typed) =>
        Grade(Characters(sent), Characters(typed));

    /// <summary>Per word, case-insensitive: for QSO transmissions.</summary>
    public static List<(string Token, bool Matched)> GradeWords(string sent, string typed) =>
        Grade(Words(sent), Words(typed));

    /// <summary>
    /// Marks which sent tokens appear, in order, in what was typed (longest common subsequence),
    /// so one dropped or extra token doesn't mark everything after it wrong the way a positional
    /// comparison like <c>Koch.Score</c> would.
    /// </summary>
    public static List<(string Token, bool Matched)> Grade(string[] sent, string[] typed)
    {
        var lcs = new int[sent.Length + 1, typed.Length + 1];
        for (var i = sent.Length - 1; i >= 0; i--)
        for (var j = typed.Length - 1; j >= 0; j--)
            lcs[i, j] = Normalize(sent[i]) == Normalize(typed[j])
                ? lcs[i + 1, j + 1] + 1
                : Math.Max(lcs[i + 1, j], lcs[i, j + 1]);

        var result = new List<(string, bool)>(sent.Length);
        int s = 0, t = 0;
        while (s < sent.Length)
        {
            if (t < typed.Length && Normalize(sent[s]) == Normalize(typed[t]))
            {
                result.Add((sent[s], true));
                s++;
                t++;
            }
            else if (t < typed.Length && lcs[s, t + 1] > lcs[s + 1, t])
            {
                t++;
            }
            else
            {
                result.Add((sent[s], false));
                s++;
            }
        }

        return result;
    }

    static string[] Words(string text) =>
        text.ToUpperInvariant().Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);

    static string[] Characters(string text) =>
        text.Where(c => !char.IsWhiteSpace(c)).Select(c => char.ToUpperInvariant(c).ToString()).ToArray();

    // Brackets are optional when typing a prosign: "SK" counts for "<SK>".
    static string Normalize(string token) => token.Trim('<', '>');
}
