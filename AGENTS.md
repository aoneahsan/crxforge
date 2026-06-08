# AGENTS.md — CrxForge

AI agent guidance for browser extension development using the WXT framework.

## Project Overview

| Property | Value |
|----------|-------|
| Name | `crxforge` |
| Version | `1.0.0` |
| Type | Browser extension template package |
| Framework | WXT |
| UI | React 19 + Radix UI Themes |
| Package Manager | yarn (MANDATORY) |
| Node | `>=20.0.0` |

## Agent Responsibilities

| Agent Type | Responsibilities |
|------------|------------------|
| Code Agent | Implement entrypoints, components, hooks, lib modules |
| Review Agent | Verify no remote code, check manifest permissions, validate store compliance |
| Test Agent | Run typecheck, lint, verify build outputs |
| Doc Agent | Update CLAUDE.md, maintain inline documentation |

## Setup Instructions

```bash
# Clone and install
cd crxforge
yarn

# Verify setup
yarn typecheck
yarn build
```

## Build & Test Commands

| Command | Purpose |
|---------|---------|
| `yarn dev` | Dev mode with HMR (Chrome) |
| `yarn dev:firefox` | Dev mode (Firefox) |
| `yarn build` | Production build (Chrome) |
| `yarn build:firefox` | Production build (Firefox) |
| `yarn build:all` | Build for all browsers |
| `yarn zip` | Create submission ZIP (Chrome) |
| `yarn zip:firefox` | Create submission ZIP (Firefox) |
| `yarn zip:all` | Create ZIPs for all browsers |
| `yarn lint` | Run ESLint |
| `yarn lint:fix` | Fix ESLint issues |
| `yarn typecheck` | TypeScript type check |

## Code Style & Conventions

### UI Components

Use Radix UI Themes exclusively. Never use native HTML elements with custom CSS.

```tsx
// CORRECT
import { Box, Flex, Button, Card, Text } from '@radix-ui/themes';

<Card>
  <Flex direction="column" gap="2">
    <Text>Content</Text>
    <Button>Action</Button>
  </Flex>
</Card>

// WRONG
<div className="card">
  <button>Action</button>
</div>
```

### Storage Access

Use the typed storage wrapper.

```typescript
import { storage } from '@lib/storage';
import { useStorage } from '@hooks/useStorage';

// Direct API
await storage.local.set('key', value);
const value = await storage.local.get<Type>('key');

// React hook
const { value, setValue, loading } = useStorage<Type>('key', {
  defaultValue: initialValue,
  area: 'local',
});
```

### Messaging Between Scripts

```typescript
import { sendToBackground, onMessage, MessageTypes } from '@lib/messaging';

// From popup/content script
const response = await sendToBackground(MessageTypes.GET_AUTH_STATUS);

// In background service worker
onMessage(MessageTypes.GET_AUTH_STATUS, async () => {
  return checkAuthStatus();
});
```

## Critical Working Rules

### 1. Authentication - Chrome Identity API ONLY

NEVER use Firebase Auth SDK in browser extensions. It loads remote scripts which violates Chrome Web Store policies.

```typescript
// CORRECT - Chrome Identity API
import { signIn, signOut, checkAuthStatus } from '@lib/auth';

const { user, token } = await signIn();

// WRONG - Firebase Auth SDK (WILL BE REJECTED)
import { signInWithPopup } from 'firebase/auth';
await signInWithPopup(auth, provider);
```

### 2. Analytics - Bundled Only

NEVER use CDN-loaded analytics. Use bundled npm packages only.

**Forbidden:**
- Firebase Analytics SDK (loads gtag.js)
- Google Analytics CDN scripts
- Microsoft Clarity CDN scripts
- Any CDN-loaded JavaScript

**Allowed:**
- Amplitude HTTP API (bundled)
- Firestore REST API for custom analytics
- Sentry npm package (bundled)

### 3. Remote Code Verification

Run before EVERY Chrome Web Store submission:

```bash
grep -rE "googletagmanager\.com|apis\.google\.com/js|recaptcha|cdn\.amplitude|firebase/analytics|signInWithPopup|signInWithRedirect|eval\(|new Function\(" .output/
```

MUST return 0 matches.

### 4. Manifest V3 Requirements

- Service worker (NOT background page)
- No remote code execution
- Strict CSP: `script-src 'self'; object-src 'self'`
- Minimal permissions (request at runtime when possible)

## Package Manager Hierarchy: nvm → npm (global) → yarn (local) (IRON-SOLID)

Three tiers, each tool ONLY for its tier — for the best, most reproducible dev results:
- **`nvm`** → install/update Node.js (which bundles `npm`): `nvm install --lts`. Use nvm to get/update `npm` itself.
- **`npm`** → ALL global packages: `npm install -g yarn` (install yarn globally if missing) + `npm install -g <pkg>` (every other global CLI).
- **`yarn`** → ALL local project work: `yarn`, `yarn add <pkg>`, `yarn add -D <pkg>` inside the project.

❌ NEVER use `npm`/`pnpm` for LOCAL installs. NEVER use `pnpm` at all. ✅ Only `yarn.lock` in the project — delete `package-lock.json` and `pnpm-lock.yaml`.

## DO NOTs

| Rule | Reason |
|------|--------|
| DO NOT use Firebase Auth SDK | Loads remote scripts, causes store rejection |
| DO NOT use CDN-loaded analytics | Violates MV3 remote code policy |
| DO NOT use native HTML elements | Use Radix UI Themes components |
| DO NOT use npm/pnpm for LOCAL installs | yarn is for local work; npm only for global CLIs (`npm install -g`) |
| DO NOT use eval() or new Function() | Violates CSP, causes store rejection |
| DO NOT request unnecessary permissions | Causes "insufficient justification" rejection |
| DO NOT stuff keywords in description | Store policy violation |

## DOs

| Rule | Purpose |
|------|---------|
| DO use Chrome Identity API for auth | Store-compliant authentication |
| DO use bundled npm packages for analytics | No remote code violations |
| DO use Radix UI Themes components | Consistent UI, theme support |
| DO run remote code verification before submission | Catch violations early |
| DO use optional_permissions for non-essential features | Minimal permission footprint |
| DO provide icons in all sizes (16, 32, 48, 128) | Store requirement |
| DO verify privacy policy URL is accessible | Store requirement |

## Project Structure

```
crxforge/
├── entrypoints/           # WXT entrypoints (auto-detected)
│   ├── background.ts      # Service worker
│   ├── content.ts         # Content script
│   ├── popup/             # Popup UI (React)
│   └── options/           # Options page (React)
├── lib/                   # Core libraries
│   ├── auth.ts            # Chrome Identity API auth
│   ├── storage.ts         # chrome.storage wrapper
│   ├── analytics.ts       # Bundled analytics
│   └── messaging.ts       # Message passing
├── hooks/                 # React hooks
│   ├── useAuth.ts         # Auth hook
│   └── useStorage.ts      # Storage hook
├── components/            # Shared React components
├── assets/               # Static assets
│   └── icons/            # Extension icons (16, 32, 48, 128)
├── _locales/             # i18n messages
│   └── en/messages.json  # English strings
├── docs/                 # Documentation
├── wxt.config.ts         # WXT configuration
├── tsconfig.json         # TypeScript config
├── eslint.config.js      # ESLint config
├── package.json          # Dependencies and scripts
└── CLAUDE.md             # AI guidance
```

## Testing Requirements

### Pre-Commit Checks

```bash
yarn typecheck  # Must pass
yarn lint       # Must pass
yarn build      # Must succeed
```

### Pre-Submission Checks

- [ ] Remote code verification passes (grep command)
- [ ] No Firebase Auth SDK usage
- [ ] No CDN-loaded scripts
- [ ] Manifest permissions are minimal
- [ ] Privacy policy URL is accessible
- [ ] Description is natural prose (no keyword stuffing)
- [ ] Screenshots match current functionality
- [ ] Icons provided in all sizes (16, 32, 48, 128)

## Customization Guide

When using this template for a new extension:

1. **Update wxt.config.ts:**
   - Change manifest name and description
   - Add required permissions
   - Update OAuth2 client ID

2. **Update _locales/en/messages.json:**
   - Change extension name and description
   - Add your extension's strings

3. **Update popup/App.tsx and options/App.tsx:**
   - Replace with your UI

4. **Update background.ts:**
   - Add your message handlers
   - Configure analytics with your keys

5. **Update content.ts:**
   - Customize match patterns
   - Implement your content script logic

## Rule Sync Note

This AGENTS.md is derived from the project CLAUDE.md. When CLAUDE.md is updated:

1. Review changes for agent-relevant content
2. Update corresponding sections in this file
3. Keep critical rules in sync (auth, analytics, remote code)

**Source of truth:** `./CLAUDE.md`

---

**Last Updated**: 2026-06-08
**Maintainer**: Ahsan Mahmood &lt;aoneahsan@gmail.com&gt; · https://aoneahsan.com · github.com/aoneahsan
