"use strict";
var AraratMorse;
(function (AraratMorse) {
    // Keyboard access for the bottom sheets and the settings drawer. A sheet is marked
    // data-sheet="name" and is inert while closed; its backdrop is data-sheet-overlay="name".
    // Watching the inert attribute keeps this free of .NET interop, and Escape clicks the
    // backdrop so each sheet's own close logic (stop audio, save settings, stop the mic) runs.
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    let trigger = null;
    function openSheet() {
        return document.querySelector('[data-sheet]:not([inert])');
    }
    function focusables(sheet) {
        return Array.from(sheet.querySelectorAll(focusableSelector))
            .filter(e => !e.disabled && e.getClientRects().length > 0);
    }
    // The browser only moves focus off an element that became inert on its next rendering
    // update, so right after closing, focus can still be reported inside the sheet.
    function lostFocus(sheet) {
        const active = document.activeElement;
        return active === null || active === document.body || sheet.contains(active);
    }
    new MutationObserver(records => {
        var _a;
        for (const record of records) {
            const sheet = record.target;
            if (!sheet.hasAttribute('inert')) {
                trigger = document.activeElement;
                ((_a = focusables(sheet)[0]) !== null && _a !== void 0 ? _a : sheet).focus();
            }
            else if (trigger && lostFocus(sheet)) {
                trigger.focus();
                trigger = null;
            }
        }
    }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['inert'] });
    document.addEventListener('keydown', e => {
        var _a;
        const sheet = openSheet();
        if (!sheet)
            return;
        if (e.key === 'Escape') {
            e.preventDefault();
            (_a = document.querySelector(`[data-sheet-overlay="${sheet.dataset.sheet}"]`)) === null || _a === void 0 ? void 0 : _a.click();
            return;
        }
        if (e.key !== 'Tab')
            return;
        const items = focusables(sheet);
        if (items.length === 0) {
            e.preventDefault();
            sheet.focus();
            return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (!active || !sheet.contains(active)) {
            e.preventDefault();
            first.focus();
        }
        else if (e.shiftKey && active === first) {
            e.preventDefault();
            last.focus();
        }
        else if (!e.shiftKey && active === last) {
            e.preventDefault();
            first.focus();
        }
    });
})(AraratMorse || (AraratMorse = {}));
