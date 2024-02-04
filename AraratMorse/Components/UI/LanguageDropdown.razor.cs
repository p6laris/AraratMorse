using AraratMorse.Stores;
using AraratMorse.Stores.LangDropDownState;
using AraratMorse.Stores.LanguageState;
using AraratMorse.Stores.TranslationState;
using Fluxor;
using Microsoft.AspNetCore.Components;
using MorseSharp;

namespace AraratMorse.Components.UI;

public partial class LanguageDropdown
{
    private void OpenMenu()
    {
        var action = new LanguageDropdownAction {IsMenuOpened = true};
        Dispatcher.Dispatch(action);
    }

    protected override void OnInitialized()
    {
        base.OnInitialized();

        //Set initial state for the dropdown
        if (LanguageState.Value.Language == 0)
            Dispatcher.Dispatch(new LanguageAction {Language = Language.Kurdish});

        Dispatcher.Dispatch(new LanguageDropdownAction {IsMenuOpened = false});
    }

    private void ChangeLanguage(Language language)
    {
        var lanAction = new LanguageAction {Language = language};
        Dispatcher.Dispatch(lanAction);

        // Every time the user change the language the textarea inputs should reset
        var translationActoin = new ResetTranslationAction
            {Input = string.Empty, Output = string.Empty, Error = string.Empty};

        Dispatcher.Dispatch(translationActoin);
        //After the language changed close the menu
        CloseMenu();
    }

    private void CloseMenu()
    {
        var action = new LanguageDropdownAction {IsMenuOpened = false};
        Dispatcher.Dispatch(action);
    }

    #region States

    [Inject] private IState<LanguageDropdownState> DropdownState { get; set; }

    [Inject] private IState<LanguageState> LanguageState { get; set; }

    [Inject] private IDispatcher Dispatcher { get; set; }
    [Inject] private IState<TranslationState> translationState { get; set; }

    #endregion
}