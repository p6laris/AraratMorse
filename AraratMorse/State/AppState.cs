using MorseSharp;

namespace AraratMorse.State;

public enum Panel
{
    None,
    Sound,
    Light,
    Settings,
    LanguageDropdown,
    DecodeFile,
    DecodeMic
}

public class AppState(MorseService morse)
{
    public string? Input { get; private set; }
    public string? Output { get; private set; }
    public string? Error => ErrorInfo?.Message;
    public FriendlyError? ErrorInfo { get; private set; }
    public bool IsEncoding { get; private set; } = true;
    public Language Language { get; private set; } = Language.Kurdish;
    public Panel ActivePanel { get; private set; } = Panel.None;

    public event Action? Changed;

    public void SetDirection(bool isEncoding)
    {
        IsEncoding = isEncoding;
        ResetTranslation();
    }

    public void SetLanguage(Language language)
    {
        Language = language;
        ActivePanel = Panel.None;
        ResetTranslation();
    }

    public void Translate(string? input)
    {
        Input = input;

        if (string.IsNullOrEmpty(input))
        {
            Output = null;
            ErrorInfo = null;
            Changed?.Invoke();
            return;
        }

        try
        {
            Output = IsEncoding ? morse.Encode(input, Language) : morse.Decode(input, Language);
            ErrorInfo = null;
        }
        catch (Exception ex)
        {
            Output = null;
            ErrorInfo = FriendlyErrors.Describe(ex);
        }

        Changed?.Invoke();
    }

    /// <summary>Used by "decode from file"/microphone, which produce text directly rather than
    /// going through the usual Input-morse-string -> Output-text translate path.</summary>
    public void SetDecodedText(string text)
    {
        Input = null;
        Output = text;
        ErrorInfo = null;
        IsEncoding = false;
        Changed?.Invoke();
    }

    /// <summary>Puts a whole conversion back: language, direction and input, as a history entry
    /// or a shared link describes it.</summary>
    public void Restore(string input, bool isEncoding, Language language)
    {
        Language = language;
        IsEncoding = isEncoding;
        ActivePanel = Panel.None;
        Translate(input);
    }

    public void ShowPanel(Panel panel)
    {
        ActivePanel = panel;
        Changed?.Invoke();
    }

    public void ClosePanel()
    {
        ActivePanel = Panel.None;
        Changed?.Invoke();
    }

    void ResetTranslation()
    {
        Input = null;
        Output = null;
        ErrorInfo = null;
        Changed?.Invoke();
    }
}
