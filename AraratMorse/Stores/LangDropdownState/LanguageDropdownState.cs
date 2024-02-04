using Fluxor;

namespace AraratMorse.Stores.LangDropDownState
{

    [FeatureState]
    public class LanguageDropdownState
    {
        public bool IsMenuOpened { get; } = false;
        public LanguageDropdownState()
        {
            
        }
        public LanguageDropdownState(bool IsOpened)
        {
            IsMenuOpened = IsOpened;
        }
    }
}
