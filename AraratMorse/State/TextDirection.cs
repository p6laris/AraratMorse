namespace AraratMorse.State;

public static class TextDirection
{
    // Same rule as dir="auto": the first strong character decides. Morse (dots, dashes, slashes)
    // has none, so it stays left-to-right.
    public static string Of(string? text)
    {
        if (string.IsNullOrEmpty(text))
            return "ltr";

        foreach (var c in text)
        {
            if (IsRtl(c))
                return "rtl";
            if (char.IsLetter(c))
                return "ltr";
        }

        return "ltr";
    }

    static bool IsRtl(char c) =>
        c is >= '֐' and <= 'ࣿ'
            or >= 'יִ' and <= '﷿'
            or >= 'ﹰ' and <= '﻿';
}
