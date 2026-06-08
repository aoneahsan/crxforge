# CrxForge - CLAUDE.md

AI guidance for working with browser extension development using the WXT framework.

## Project Overview

**Type**: Browser extension template package
**Framework**: WXT (recommended over custom Node.js build scripts)
**UI Library**: React + Radix UI Themes
**Package Manager**: yarn (MANDATORY)

## Quick Start

```bash
# Install dependencies
yarn

# Development (Chrome)
yarn dev

# Development (Firefox)
yarn dev:firefox

# Production build
yarn build

# Build for all browsers
yarn build:all

# Create ZIP for store submission
yarn zip
yarn zip:all
```

## Directory Structure

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
│   └── icons/            # Extension icons
├── _locales/             # i18n messages
├── wxt.config.ts         # WXT configuration
├── package.json
└── CLAUDE.md
```

## Critical Rules

### Authentication - Chrome Identity API ONLY

**NEVER use Firebase Auth SDK in browser extensions.**

Firebase Auth SDK loads remote scripts (gtag.js, etc.) which violates Chrome Web Store policies and will cause rejection.

```typescript
// CORRECT - Chrome Identity API
import { signIn, signOut, checkAuthStatus } from '@lib/auth';

const { user, token } = await signIn();
const status = await checkAuthStatus();
await signOut();

// WRONG - Firebase Auth SDK (WILL BE REJECTED)
import { signInWithPopup } from 'firebase/auth';
await signInWithPopup(auth, provider); // Loads remote scripts!
```

### Analytics - Bundled Only

**NEVER use:**
- Firebase Analytics SDK (loads gtag.js)
- Google Analytics CDN scripts
- Microsoft Clarity CDN scripts
- Any CDN-loaded analytics

**SAFE alternatives:**
- Amplitude HTTP API (bundled)
- Firestore REST API for custom analytics
- Sentry npm package (bundled)

### Remote Code Verification

**Run before EVERY Chrome Web Store submission:**

```bash
grep -rE "googletagmanager\.com|apis\.google\.com/js|recaptcha|cdn\.amplitude|firebase/analytics|signInWithPopup|signInWithRedirect|eval\(|new Function\(" .output/
```

**MUST return 0 matches.**

### Manifest V3 Requirements

- Service worker (NOT background page)
- No remote code execution
- Strict CSP: `script-src 'self'; object-src 'self'`
- Minimal permissions (request at runtime when possible)

## UI Components

**ALWAYS use Radix UI Themes components:**

```tsx
import { Box, Flex, Button, Card, Text } from '@radix-ui/themes';

// CORRECT
<Card>
  <Flex direction="column" gap="2">
    <Text>Content</Text>
    <Button>Action</Button>
  </Flex>
</Card>

// WRONG - Native HTML
<div className="card">
  <button>Action</button>
</div>
```

## Storage

Use the storage wrapper for type-safe chrome.storage access:

```typescript
import { storage } from '@lib/storage';
import { useStorage } from '@hooks/useStorage';

// Direct API
await storage.local.set('key', value);
const value = await storage.local.get<Type>('key');

// React hook
const { value, setValue, loading } = useStorage<Type>('key', {
  defaultValue: initialValue,
  area: 'local', // or 'sync'
});
```

## Messaging

For communication between popup/options/background/content scripts:

```typescript
import { sendToBackground, onMessage, MessageTypes } from '@lib/messaging';

// From popup/content script
const response = await sendToBackground(MessageTypes.GET_AUTH_STATUS);

// In background service worker
onMessage(MessageTypes.GET_AUTH_STATUS, async () => {
  return checkAuthStatus();
});
```

## Customizing for Your Extension

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

## Build Commands

| Command | Description |
|---------|-------------|
| `yarn dev` | Dev mode with HMR (Chrome) |
| `yarn dev:firefox` | Dev mode (Firefox) |
| `yarn build` | Production build (Chrome) |
| `yarn build:firefox` | Production build (Firefox) |
| `yarn build:all` | Build for all browsers |
| `yarn zip` | Create submission ZIP (Chrome) |
| `yarn zip:firefox` | Create submission ZIP (Firefox) |
| `yarn zip:all` | Create ZIPs for all browsers |
| `yarn lint` | Run ESLint |
| `yarn typecheck` | TypeScript type check |

## Pre-Submission Checklist

Before submitting to Chrome Web Store:

- [ ] Remote code verification passes (grep command above)
- [ ] No Firebase Auth SDK usage
- [ ] No CDN-loaded scripts
- [ ] Manifest permissions are minimal
- [ ] Privacy policy URL is accessible
- [ ] Description is natural prose (no keyword stuffing)
- [ ] Screenshots match current functionality
- [ ] Icons are provided in all sizes (16, 32, 48, 128)

## Reference Files

- Chrome Web Store program policies: https://developer.chrome.com/docs/webstore/program-policies/
- WXT Documentation: https://wxt.dev
- Radix UI Themes: https://www.radix-ui.com/themes

## Troubleshooting

### "Remote code detected" rejection

Run the grep command above and remove any CDN scripts or Firebase SDKs.

### "Insufficient permissions justification"

Only request permissions you actually use. Use optional_permissions for features that aren't always needed.

### Content script not loading

Check the matches pattern in content.ts matches the sites you want to run on.

---

**Last Updated**: 2026-06-08
**Author**: Ahsan Mahmood &lt;aoneahsan@gmail.com&gt; · https://aoneahsan.com · github.com/aoneahsan
