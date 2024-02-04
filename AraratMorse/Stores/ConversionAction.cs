using MorseSharp;

namespace AraratMorse.Stores
{
    public class ConversionAction
    {
        public bool IsEncoding { get; set; }
        public string Input {  get; set; }
        public string Output { get; set; }

        public Language Language { get; set; }
    }
}
