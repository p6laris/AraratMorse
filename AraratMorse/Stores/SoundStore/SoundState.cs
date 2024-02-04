using Fluxor;

namespace AraratMorse.Stores.SoundStore
{
    [FeatureState]
    public class SoundState
    {
        public bool IsSectionOpened { get; }

        public SoundState()
        {
            
        }
        public SoundState(bool IsOpened)
        {
            IsSectionOpened = IsOpened;
        }
    }
}
