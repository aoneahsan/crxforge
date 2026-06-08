/// <reference types="chrome" />

/**
 * @types/chrome 0.1+ no longer auto-registers the global `chrome` namespace
 * ambiently. This triple-slash reference re-exposes the `chrome.*` globals to
 * every file in the project (background, content scripts, popup, options, lib).
 *
 * @author Ahsan Mahmood <aoneahsan@gmail.com> (https://aoneahsan.com)
 */
