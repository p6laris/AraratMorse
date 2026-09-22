namespace AraratMorse.State;

public class MorseSettings
{
    public int CharSpeed { get; private set; } = 25;
    public int WordSpeed { get; private set; } = 25;
    public double Frequency { get; private set; } = 700;

    public event Action? Changed;

    public void Update(int charSpeed, int wordSpeed, double frequency)
    {
        CharSpeed = charSpeed;
        WordSpeed = wordSpeed;
        Frequency = frequency;
        Changed?.Invoke();
    }
}
