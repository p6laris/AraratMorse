namespace AraratMorse.Models
{
    public class Settings
    {
        public int CharSpeed { get; set; }
        public int WordSpeed { get; set; }
        public double Frequency { get; set; }

        /// <summary>Problems with the current values, keyed by the property they belong to.</summary>
        public IEnumerable<(string Field, string Message)> Validate()
        {
            if (CharSpeed <= 0)
                yield return (nameof(CharSpeed), "Char speed must be greater than zero.");
            else if (CharSpeed < WordSpeed)
                yield return (nameof(CharSpeed), "Char speed must be greater than or equal to Word Speed.");

            if (WordSpeed <= 0)
                yield return (nameof(WordSpeed), "Word speed must be greater than zero.");

            if (Frequency <= 0)
                yield return (nameof(Frequency), "Frequency must be greater than zero.");
        }
    }
}
