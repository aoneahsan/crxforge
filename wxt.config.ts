/**
 * CrxForge — WXT configuration.
 *
 * Customize the manifest (name, description, permissions, OAuth client id) per extension.
 *
 * @see https://wxt.dev/api/config.html
 * @author Ahsan Mahmood <aoneahsan@gmail.com> (https://aoneahsan.com)
 */
import { defineConfig } from 'wxt';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  srcDir: '.',

  // React module support
  modules: ['@wxt-dev/module-react'],

  // Manifest configuration
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',

    // Permissions - customize per extension
    permissions: ['storage'],

    // Optional permissions - request at runtime
    optional_permissions: ['activeTab', 'tabs'],

    // OAuth2 for Chrome Identity API
    oauth2: {
      client_id: 'YOUR_CHROME_CLIENT_ID.apps.googleusercontent.com',
      scopes: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
    },

    // Content Security Policy - NO remote scripts
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },

    // Icons — PNGs ship from public/icon/ (generated from assets/icons/icon.svg).
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      128: 'icon/128.png',
    },
  },

  // Browser targets
  browser: 'chrome',

  // Build configuration
  vite: () => ({
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('.', import.meta.url)),
        '@lib': fileURLToPath(new URL('./lib', import.meta.url)),
        '@hooks': fileURLToPath(new URL('./hooks', import.meta.url)),
        '@components': fileURLToPath(new URL('./components', import.meta.url)),
      },
    },
    build: {
      // Minify for production
      minify: true,
    },
  }),
});
