using MorseSharp;

namespace AraratMorse.Stores
{
    public class TranslationAction
    {
        public string Input { get; set; }
        public Language Language { get; set; }
        public bool IsEncoding { get; set; }    
    }
}
