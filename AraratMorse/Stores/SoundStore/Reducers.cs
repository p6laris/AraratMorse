

using AraratMorse.Components.UI;
using Fluxor;

namespace AraratMorse.Stores.SoundStore
{
    public static class Reducers
    {
        [ReducerMethod]
        public static SoundState ReduceSoundSectionToggle(SoundState state, SoundSectionAction action)
            => new SoundState(action.IsSectionOpened);
    }
}
