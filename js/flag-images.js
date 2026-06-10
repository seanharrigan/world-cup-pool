// flag-images.js — render country-flag emoji as images so they show on every OS.
//
// WHY: flag emoji depend on the OS emoji font. Windows' Segoe UI Emoji omits country
// flags, so Windows shows the two regional-indicator letters (FR, BR) instead of a flag.
// Rendering flags as <img> (via Twemoji) makes them look the same on every device.
//
// SCOPE: country FLAGS ONLY. Every other emoji (⚽ 🏆 🔒 ✅ …) is left untouched — the
// Twemoji callback returns false for anything that isn't a flag, so Twemoji skips it.
//
// This file is fully self-contained and additive. It does NOT modify any app logic and
// never touches the database. If Twemoji fails to load, it no-ops (app behaves as today).

(function () {
    'use strict';

    var TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/';

    // True only for a country flag:
    //  - a 2-codepoint regional-indicator pair (0x1F1E6–0x1F1FF), e.g. 🇫🇷
    //  - a black-flag tag sequence (0x1F3F4 + tag chars E0060–E007F), e.g. England/Scotland
    function isFlagEmoji(str) {
        var cps = Array.from(str).map(function (c) { return c.codePointAt(0); });
        var isRegional = cps.length === 2 &&
            cps.every(function (c) { return c >= 0x1F1E6 && c <= 0x1F1FF; });
        var isTagFlag = cps[0] === 0x1F3F4 &&
            cps.some(function (c) { return c >= 0xE0060 && c <= 0xE007F; });
        return isRegional || isTagFlag;
    }

    // Convert flag emoji within `root` to <img>. Non-flags are skipped (callback false).
    function parseFlags(root) {
        if (typeof twemoji === 'undefined') return;          // CDN blocked → do nothing
        if (!root) root = document.body;
        try {
            twemoji.parse(root, {
                className: 'twe-flag',
                folder: 'svg',
                ext: '.svg',
                base: TWEMOJI_BASE,
                callback: function (icon, options) {
                    // icon = hyphen-joined codepoints, e.g. "1f1eb-1f1f7" for 🇫🇷
                    var str = icon.split('-').map(function (h) {
                        return String.fromCodePoint(parseInt(h, 16));
                    }).join('');
                    if (!isFlagEmoji(str)) return false;     // not a flag → leave untouched
                    return ''.concat(options.base, options.folder, '/', icon, options.ext);
                }
            });
        } catch (e) {
            // Never let flag rendering break the app.
            if (window.console && console.warn) console.warn('flag-images: parse failed', e);
        }
    }

    // Debounce re-parses so bursts of DOM mutations coalesce into one pass.
    var pending = false;
    function scheduleParse() {
        if (pending) return;
        pending = true;
        (window.requestAnimationFrame || window.setTimeout)(function () {
            pending = false;
            parseFlags(document.body);
        }, 50);
    }

    function start() {
        parseFlags(document.body);  // initial pass over whatever is already rendered

        if (typeof MutationObserver === 'undefined') return;
        var observer = new MutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var m = mutations[i];
                // Re-parse on any added nodes or text changes (flags set via .textContent).
                if (m.addedNodes.length || m.type === 'characterData') {
                    scheduleParse();
                    return;
                }
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

    // Expose for optional manual use (e.g. after a render), though the observer handles it.
    window.parseFlags = parseFlags;
})();
