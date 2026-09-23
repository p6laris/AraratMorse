namespace AraratMorse {

    // Keyboard access for the bottom sheets and the settings drawer. A sheet is marked
    // data-sheet="name" and is inert while closed; its backdrop is data-sheet-overlay="name".
    // Watching the inert attribute keeps this free of .NET interop, and Escape clicks the
    // backdrop so each sheet's own close logic (stop audio, save settings, stop the mic) runs.

    const focusableSelector =
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    let trigger: HTMLElement | null = null;

    function openSheet(): HTMLElement | null {
        return document.querySelector<HTMLElement>('[data-sheet]:not([inert])');
    }

    function focusables(sheet: HTMLElement): HTMLElement[] {
        return Array.from(sheet.querySelectorAll<HTMLElement>(focusableSelector))
            .filter(e => !(e as HTMLButtonElement).disabled && e.getClientRects().length > 0);
    }

    // The browser only moves focus off an element that became inert on its next rendering
    // update, so right after closing, focus can still be reported inside the sheet.
    function lostFocus(sheet: HTMLElement): boolean {
        const active = document.activeElement;
        return active === null || active === document.body || sheet.contains(active);
    }

    new MutationObserver(records => {
        for (const record of records) {
            const sheet = record.target as HTMLElement;
            if (!sheet.hasAttribute('inert')) {
                trigger = document.activeElement as HTMLElement | null;
                // Start on the player's play button when there is one, so Space plays straight away.
                const play = sheet.querySelector<HTMLElement>('button[aria-label="Play"]');
                (play ?? focusables(sheet)[0] ?? sheet).focus();
            } else if (trigger && lostFocus(sheet)) {
                trigger.focus();
                trigger = null;
            }
        }
    }).observe(document.body, {subtree: true, attributes: true, attributeFilter: ['inert']});

    // Space and "/" only act when the key isn't already meaningful where focus is: typing into a
    // field, pressing a focused button, or the keyer's own key pad.
    function focusOwnsKey(target: EventTarget | null): boolean {
        const el = target as HTMLElement | null;
        if (!el || el === document.body)
            return false;
        return el.isContentEditable || !!el.closest('input, textarea, select, button, a[href], [tabindex]:not([data-sheet])');
    }

    document.addEventListener('keydown', e => {
        if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented || focusOwnsKey(e.target))
            return;

        if (e.key === ' ') {
            // The open sheet's player, or the page's only player; nothing if it's ambiguous.
            const scope = openSheet() ?? document.querySelector('main');
            const toggles = scope?.querySelectorAll<HTMLElement>('button[aria-label="Play"], button[aria-label="Pause"]') ?? [];
            if (toggles.length === 1) {
                e.preventDefault();
                toggles[0].click();
            }
        } else if (e.key === '/' && !openSheet()) {
            const input = document.querySelector<HTMLElement>('main textarea:not([readonly])');
            if (input) {
                e.preventDefault();
                input.focus();
            }
        }
    });

    document.addEventListener('keydown', e => {
        const sheet = openSheet();
        if (!sheet)
            return;

        if (e.key === 'Escape') {
            e.preventDefault();
            document.querySelector<HTMLElement>(`[data-sheet-overlay="${sheet.dataset.sheet}"]`)?.click();
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
        const active = document.activeElement as HTMLElement | null;

        if (!active || !sheet.contains(active)) {
            e.preventDefault();
            first.focus();
        } else if (e.shiftKey && active === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && active === last) {
            e.preventDefault();
            first.focus();
        }
    });
}
