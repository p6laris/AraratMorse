using AraratMorse.State;
using Microsoft.AspNetCore.Components;
using MorseSharp;

namespace AraratMorse.Components.UI;

public partial class LanguageDropdown : IDisposable
{
    private void OpenMenu() => State.ShowPanel(Panel.LanguageDropdown);

    private bool IsMenuOpened => State.ActivePanel == Panel.LanguageDropdown;

    protected override void OnInitialized()
    {
        State.Changed += HandleStateChanged;
    }

    void HandleStateChanged() => StateHasChanged();

    private void ChangeLanguage(Language language)
    {
        State.SetLanguage(language);
    }

    private void CloseMenu() => State.ClosePanel();

    public void Dispose() => State.Changed -= HandleStateChanged;

    #region States

    [Inject] private AppState State { get; set; } = default!;

    #endregion
}
