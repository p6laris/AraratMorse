using Fluxor;
using Microsoft.AspNetCore.Components.Infrastructure;


namespace AraratMorse.Stores.SettingStore
{
    [FeatureState]
    public class SettingState
    {
        public bool IsSectionOpened { get; }
        public int CharSpeed { get; }
        public int WordSpeed { get; }
        public double frequency { get; }
        public SettingState()
        {
            
        }
        public SettingState(bool IsOpened)
        {
            IsSectionOpened = IsOpened;
        }
        public SettingState(bool IsOpened, int wpm, int cpm, double freq) 
        {
            IsSectionOpened = IsOpened;
            WordSpeed = wpm;
            CharSpeed = cpm;
            frequency = freq;
        }
    }
}
