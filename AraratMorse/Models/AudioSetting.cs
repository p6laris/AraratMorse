using FluentValidation;

namespace AraratMorse.Models
{
    public class Settings
    {
        public int CharSpeed { get; set; }
        public int WordSpeed { get; set; }
        public double Frequency { get; set; }
    }

    public class SettingsValidator : AbstractValidator<Settings>
    {
        public SettingsValidator()
        {

            RuleFor(x => x.CharSpeed)
            .GreaterThan(0)
            .WithMessage("Char speed must be greater than zero.")
            .GreaterThanOrEqualTo((s) => s.WordSpeed)
            .WithMessage("Char speed must be greater than or equal to Word Speed.");

            RuleFor(x => x.WordSpeed)
                .GreaterThan(0)
                .WithMessage("Word speed must be greater than zero.");

            RuleFor(x => x.Frequency)
                .GreaterThan(0)
                .WithMessage("Frequency must be greater than zero.");


        }
    }
}
