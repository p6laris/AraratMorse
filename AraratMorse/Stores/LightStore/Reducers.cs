using Fluxor;

namespace AraratMorse.Stores.LightStore
{
    public static class Reducers
    {
        [ReducerMethod]
        public static LightState ReduceLightSectionMenuAction(LightState lightState, LightSectionAction action)
        {
            return new LightState(action.IsOpened);
        }
    }
}
