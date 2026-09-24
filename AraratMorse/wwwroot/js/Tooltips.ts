namespace AraratMorse {

    // Replaces the browser's title tooltips with the app's own (.app-tooltip in style.css), for every
    // element with a title: after a short hover, or straight away when reached by keyboard. While
    // one shows, the title is parked in data-tooltip-title so the native tooltip can't appear on
    // top, and it goes back afterwards so Blazor's record of the attribute stays accurate.

    const showDelayMs = 350;
    const gap = 8;
    const margin = 8;

    let tip: HTMLDivElement | null = null;
    let anchor: HTMLElement | null = null;
    let timer = 0;
    let watcher: MutationObserver | null = null;

    // While a tooltip shows, anything can remove or hide its element without a pointer or key event
    // (a sheet closing, a drill moving to its next stage), which would leave the tooltip floating.
    const pageWatcher = new MutationObserver(() => {
        if (anchor && (!anchor.isConnected || anchor.closest('[inert]') || anchor.getClientRects().length === 0))
            hide();
    });

    function tooltip(): HTMLDivElement {
        if (!tip) {
            tip = document.createElement('div');
            tip.id = 'app-tooltip';
            tip.className = 'app-tooltip';
            tip.setAttribute('role', 'tooltip');
            document.body.appendChild(tip);
        }
        return tip;
    }

    function park(el: HTMLElement): void {
        const title = el.getAttribute('title');
        if (title !== null) {
            el.dataset.tooltipTitle = title;
            el.removeAttribute('title');
        }
    }

    function unpark(el: HTMLElement): void {
        if (el.dataset.tooltipTitle === undefined)
            return;
        if (!el.hasAttribute('title'))
            el.setAttribute('title', el.dataset.tooltipTitle);
        delete el.dataset.tooltipTitle;
    }

    function render(): void {
        if (!anchor || !anchor.isConnected) {
            hide();
            return;
        }

        const text = anchor.dataset.tooltipTitle;
        if (!text)
            return;

        const t = tooltip();
        t.textContent = text;
        t.removeAttribute('data-show');

        const a = anchor.getBoundingClientRect();
        const r = t.getBoundingClientRect();
        const side = a.top - gap - r.height >= margin ? 'top' : 'bottom';
        const top = side === 'top' ? a.top - gap - r.height : a.bottom + gap;
        const center = a.left + a.width / 2;
        const left = Math.min(Math.max(center - r.width / 2, margin), window.innerWidth - r.width - margin);

        t.style.top = `${top}px`;
        t.style.left = `${left}px`;
        t.dataset.side = side;
        t.style.setProperty('--arrow-x', `${center - left}px`);
        t.setAttribute('data-show', '');

        // Screen readers already hear an aria-label; only describe when the tooltip adds something.
        if (!anchor.hasAttribute('aria-describedby') && anchor.getAttribute('aria-label') !== text)
            anchor.setAttribute('aria-describedby', t.id);
    }

    function show(el: HTMLElement, immediate: boolean): void {
        hide();
        anchor = el;
        park(el);
        timer = window.setTimeout(render, immediate ? 0 : showDelayMs);

        // Blazor can re-render the title while it's showing (Play becomes Pause): park it again
        // and refresh the text.
        watcher = new MutationObserver(() => {
            if (anchor && anchor.hasAttribute('title')) {
                park(anchor);
                if (tip && tip.hasAttribute('data-show'))
                    render();
            }
        });
        watcher.observe(el, {attributes: true, attributeFilter: ['title']});
        pageWatcher.observe(document.body, {subtree: true, childList: true, attributes: true, attributeFilter: ['inert', 'class', 'hidden']});
    }

    function hide(): void {
        window.clearTimeout(timer);
        pageWatcher.disconnect();
        if (watcher) {
            watcher.disconnect();
            watcher = null;
        }
        if (anchor) {
            unpark(anchor);
            if (anchor.getAttribute('aria-describedby') === 'app-tooltip')
                anchor.removeAttribute('aria-describedby');
            anchor = null;
        }
        if (tip)
            tip.removeAttribute('data-show');
    }

    function titled(target: EventTarget | null): HTMLElement | null {
        const el = target as Element | null;
        const found = el && el.closest ? el.closest('[title], [data-tooltip-title]') : null;
        return found && (found.getAttribute('title') || (found as HTMLElement).dataset.tooltipTitle)
            ? found as HTMLElement
            : null;
    }

    document.addEventListener('pointerover', e => {
        if (e.pointerType === 'touch')
            return;
        const el = titled(e.target);
        if (el === anchor)
            return;
        if (el)
            show(el, false);
        else
            hide();
    });

    document.addEventListener('pointerout', e => {
        if (anchor && !anchor.contains(e.relatedTarget as Node | null))
            hide();
    });

    // Keyboard only: a mouse click focuses buttons too, and shouldn't bring the tooltip back.
    document.addEventListener('focusin', e => {
        const el = titled(e.target);
        if (el && el === e.target && el.matches(':focus-visible'))
            show(el, true);
    });

    document.addEventListener('focusout', e => {
        if (anchor && e.target === anchor)
            hide();
    });

    document.addEventListener('pointerdown', hide);
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape')
            hide();
    });
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
}
