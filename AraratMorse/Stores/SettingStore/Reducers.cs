using Fluxor;

namespace AraratMorse.Stores.SettingStore
{

    public static class Reducers
    {
        [ReducerMethod]
        public static SettingState ReduceToggleSettingMenuAction(SettingState state, SettingAction action)
            => new SettingState(action.IsOpened, action.WordSpeed, action.CharSpeed, action.Frequency);

    }
}
