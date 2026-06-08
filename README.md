<div align="center">

<img src="assets/icons/icon.svg" width="112" height="112" alt="CrxForge logo" />

# CrxForge ⚡

**Forge production-ready, cross-browser extensions in minutes.**

CrxForge is an opinionated browser-extension starter built on **WXT**, **React 19**,
**Radix UI Themes**, **TypeScript**, and **Zustand** — with the patterns browser stores
actually require baked in, so you ship features instead of fighting boilerplate and rejections.

[![License: MIT](https://img.shields.io/badge/License-MIT-3b82f6.svg)](./LICENSE)
[![Built with WXT](https://img.shields.io/badge/Built%20with-WXT-635bff.svg)](https://wxt.dev)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-22c55e.svg)](#-contributing)

</div>

---

## ✨ Features

- 🧩 **Cross-browser from one codebase** — Chrome, Firefox, and Edge via [WXT](https://wxt.dev).
- ⚛️ **React 19 + Radix UI Themes** — accessible, theme-aware popup & options pages out of the box.
- 🔐 **Store-compliant auth** — Google sign-in through the **Chrome Identity API** (no Firebase Auth SDK, no remote scripts that get extensions rejected).
- 📊 **Bundled analytics** — Amplitude HTTP API, Firestore REST, and Sentry, all bundled (no CDN-loaded scripts).
- 🗄️ **Typed storage wrapper** — `chrome.storage.local` / `sync` with a reactive `useStorage` hook.
- 📣 **Typed messaging bus** — popup ↔ background ↔ content scripts with a tiny, type-safe message layer.
- 🛡️ **Manifest V3 + strict CSP** — `script-src 'self'; object-src 'self'` by default.
- 🌍 **i18n-ready** — localized strings via `_locales`.
- 🧰 **TypeScript + ESLint** — strict config tuned for React 19 and `@types/chrome` 0.1+.

## 🧱 Tech stack

| Layer | Choice |
|-------|--------|
| Framework | [WXT](https://wxt.dev) (Manifest V3, cross-browser) |
| UI | [React 19](https://react.dev) + [Radix UI Themes](https://www.radix-ui.com/themes) |
| State | [Zustand](https://zustand.docs.pmnd.rs/) |
| Language | TypeScript |
| Auth | Chrome Identity API |
| Tooling | ESLint, yarn 4 |

## 🚀 Quick start

```bash
# scaffold a new extension from this template
npx degit aoneahsan/crxforge my-extension
cd my-extension

# install dependencies (yarn is the supported package manager)
yarn

# develop with HMR (Chrome)
yarn dev

# develop for Firefox
yarn dev:firefox
```

Then load the unpacked build:

- **Chrome / Edge:** open `chrome://extensions`, enable *Developer mode*, click *Load unpacked*, and select `.output/chrome-mv3`.
- **Firefox:** open `about:debugging#/runtime/this-firefox`, click *Load Temporary Add-on*, and select `.output/firefox-mv2/manifest.json`.

> ℹ️ CrxForge ships a default icon set in `public/icon/`. Swap in your own — or edit `assets/icons/icon.svg` and re-render — before publishing to the stores.

## 📂 Project structure

```
crxforge/
├── entrypoints/           # WXT entrypoints (auto-detected)
│   ├── background.ts      # Service worker (lifecycle, messaging, analytics)
│   ├── content.ts         # Content script
│   ├── popup/             # Popup UI (React + Radix)
│   └── options/           # Options page (React + Radix)
├── lib/                   # Core libraries
│   ├── auth.ts            # Chrome Identity API auth
│   ├── storage.ts         # chrome.storage wrapper
│   ├── analytics.ts       # Bundled analytics (Amplitude / Firestore REST / Sentry)
│   └── messaging.ts       # Typed message passing
├── hooks/                 # React hooks (useAuth, useStorage)
├── components/            # Shared React components
├── public/icon/           # Shipped extension icons — 16/32/48/128 px PNG
├── assets/icons/          # Icon master — icon.svg (re-render the PNGs from this)
├── _locales/              # i18n messages
├── wxt.config.ts          # WXT + manifest configuration
└── package.json
```

## 🛡️ Store compliance (built in)

Browser stores reject extensions that load remote code. CrxForge is structured to pass review:

- **No remote scripts** — auth uses `chrome.identity`, analytics use bundled HTTP/REST calls, never `gtag.js`, Firebase Auth, or CDN scripts.
- **Strict CSP** — `script-src 'self'; object-src 'self'`.
- **Minimal permissions** — only `storage` by default; `activeTab` / `tabs` live in `optional_permissions` (request at runtime).

Run this before every submission — it must return **0 matches**:

```bash
grep -rE "googletagmanager\.com|apis\.google\.com/js|recaptcha|cdn\.amplitude|firebase/analytics|signInWithPopup|signInWithRedirect|eval\(|new Function\(" .output/
```

## 🎛️ Customize it

1. **`wxt.config.ts`** — set your manifest name, description, permissions, and OAuth2 `client_id`.
2. **`_locales/en/messages.json`** — set your extension's display name, description, and strings.
3. **`entrypoints/popup/App.tsx` & `entrypoints/options/App.tsx`** — replace the demo UI with yours, and point the Privacy / Terms / Support links at your own pages.
4. **`entrypoints/background.ts`** — register your message handlers and configure analytics keys.
5. **`entrypoints/content.ts`** — set your `matches` patterns and content-script logic.
6. **Icons** — the default CrxForge mark ships in `public/icon/` (`16/32/48/128` px); the editable master is `assets/icons/icon.svg`. After editing the SVG, re-render with: `for s in 16 32 48 128; do rsvg-convert -w $s -h $s assets/icons/icon.svg -o public/icon/$s.png; done`

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Dev mode with HMR (Chrome) |
| `yarn dev:firefox` | Dev mode (Firefox) |
| `yarn build` | Production build (Chrome) |
| `yarn build:firefox` | Production build (Firefox) |
| `yarn build:all` | Build for all browsers |
| `yarn zip` / `yarn zip:all` | Create store-submission ZIP(s) |
| `yarn lint` / `yarn lint:fix` | Run / fix ESLint |
| `yarn typecheck` | TypeScript type check |

## 👤 Author & credits

**Ahsan Mahmood** — Full-Stack Engineer.

| | |
|---|---|
| 🌐 Portfolio | [aoneahsan.com](https://aoneahsan.com) |
| 💼 LinkedIn | [linkedin.com/in/aoneahsan](https://linkedin.com/in/aoneahsan) |
| 🐙 GitHub | [github.com/aoneahsan](https://github.com/aoneahsan) |
| 📦 npm | [npmjs.com/~aoneahsan](https://npmjs.com/~aoneahsan) |
| ✉️ Email | [aoneahsan@gmail.com](mailto:aoneahsan@gmail.com) |
| 💬 WhatsApp | [+92 304 6619706](https://wa.me/923046619706) |
| 📍 Location | [Map](https://aoneahsan.com/address) |

If CrxForge saves you time, you can support its development here:
**[aoneahsan.com/payment](https://aoneahsan.com/payment?project-id=crxforge&project-identifier=crxforge)** 💛

## 🤝 Contributing

Issues and pull requests are welcome. Please run `yarn typecheck` and `yarn lint` before opening a PR.

## 📄 License

[MIT](./LICENSE) © 2026 Ahsan Mahmood
