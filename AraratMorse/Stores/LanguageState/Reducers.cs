using Fluxor;

namespace AraratMorse.Stores.LanguageState
{
    public static class Reducers
    {
        [ReducerMethod]
        public static LanguageState ReduceLanguageAction(LanguageState state, LanguageAction action)
            => new LanguageState(action.Language);

        
           
    }
}
