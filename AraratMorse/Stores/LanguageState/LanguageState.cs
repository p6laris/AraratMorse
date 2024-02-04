using Fluxor;
using MorseSharp;

namespace AraratMorse.Stores.LanguageState
{
    [FeatureState]
    public class LanguageState
    {
        public Language Language { get; }

        public LanguageState()
        {
            
        }

        public LanguageState(Language language)
        {
            Language = language;
        }

    }
}
