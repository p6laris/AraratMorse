using Fluxor;
using MorseSharp;

namespace AraratMorse.Stores.ConversionState
{
    public static class Reducers
    {
        [ReducerMethod]
        public static ConversionState ReduceConversionToggleAction(ConversionState state, ConversionAction action)
            => new ConversionState(action.IsEncoding);

        
    }
}
