using Fluxor;

namespace AraratMorse.Stores.LightStore
{
    [FeatureState]
    public class LightState
    {
        public bool IsLightSectionOpened { get; }

        public LightState()
        {
            
        }
        public LightState(bool IsOpened)
        {
            IsLightSectionOpened = IsOpened;
        }
    }
}
