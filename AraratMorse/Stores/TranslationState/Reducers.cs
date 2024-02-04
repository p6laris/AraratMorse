using Fluxor;
using MorseSharp;

namespace AraratMorse.Stores.TranslationState;

public class Reducers
{
    [ReducerMethod]
    public static TranslationState ReduceTranslationAction(TranslationState state, TranslationAction action)
    {
        if (string.IsNullOrEmpty(action.Input))
            return new TranslationState(null, null, null);

        var output = string.Empty;
        var converter = Morse.GetConverter();
        try
        {
            if (action.IsEncoding)
                output = converter
                    .ForLanguage(action.Language)
                    .ToMorse(action.Input)
                    .Encode();
            else
                output = converter.ForLanguage(action.Language)
                    .Decode(action.Input);

            return new TranslationState(action.Input, output);
        }
        catch (Exception ex)
        {
            return new TranslationState(action.Input, " ", ex.Message);
        }
    }

    [ReducerMethod]
    public static TranslationState ReduceTranslationResetAction(TranslationState translationState,
        ResetTranslationAction action)
    {
        return new TranslationState(action.Input, action.Output, action.Error);
    }
}