using Fluxor;

namespace AraratMorse.Stores.ConversionState
{
    [FeatureState]
    public class ConversionState
    {
        public bool IsEncoding { get; }
        

        public ConversionState()
        {
            
        }
        public ConversionState(bool isEncoding)
        {
            IsEncoding = isEncoding;
        }
    }
}
