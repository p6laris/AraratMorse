using Fluxor;

namespace AraratMorse.Stores.TranslationState
{
    [FeatureState]
    public class TranslationState
    {
        public string Input { get; }
        public string Output { get; } 

        public string Error { get; }
        public TranslationState()
        {
            
        }
        public TranslationState(string error)
        {
            Error = error;
        }
        public TranslationState(string input, string outPut)
        {
            Input = input;
            Output = outPut;
        }
        public TranslationState(string input, string outPut, string error)
        {
            Input = input;
            Output = outPut;
            Error = error;
        }
    }
}
