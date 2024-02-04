using AraratMorse.Stores.LangDropDownState;
using Fluxor;

namespace AraratMorse.Stores.LangDropdownState
{
    public static class Reducers
    {
        [ReducerMethod]
        public static LanguageDropdownState ReduceLanguageDropdownAction(LanguageDropdownState state, LanguageDropdownAction action) =>
            new LanguageDropdownState(action.IsMenuOpened);

        

    }
}
