/**
 * Background Service Worker
 *
 * Handles:
 * - Extension lifecycle events (install, update)
 * - Message routing between popup, options, and content scripts
 * - Auth state management
 * - Periodic tasks (alarms)
 *
 * @author Ahsan Mahmood <aoneahsan@gmail.com> (https://aoneahsan.com)
 */

import { initMessageListener, onMessage, MessageTypes } from '@lib/messaging';
import { checkAuthStatus, signIn, signOut } from '@lib/auth';
import { analytics } from '@lib/analytics';
import { storage } from '@lib/storage';

export default defineBackground(() => {
  console.log('[Background] Service worker started');

  // Initialize message listener
  initMessageListener();

  // Initialize analytics (configure your keys)
  analytics.init({
    // firestoreProjectId: 'your-project-id',
    // amplitudeApiKey: 'your-amplitude-key',
    // sentryDsn: 'your-sentry-dsn',
    debug: process.env.NODE_ENV === 'development',
  });

  // Register message handlers
  registerMessageHandlers();

  // Handle extension installation/update
  chrome.runtime.onInstalled.addListener(handleInstall);

  // Handle extension startup
  chrome.runtime.onStartup.addListener(handleStartup);

  // Handle suspend (for cleanup before service worker stops)
  chrome.runtime.onSuspend?.addListener(handleSuspend);
});

/**
 * Register all message handlers
 */
function registerMessageHandlers() {
  // Auth handlers
  onMessage(MessageTypes.GET_AUTH_STATUS, async () => {
    return checkAuthStatus();
  });

  onMessage(MessageTypes.SIGN_IN, async () => {
    const result = await signIn();
    analytics.setUserId(result.user.id);
    analytics.track('user_signed_in');
    return result;
  });

  onMessage(MessageTypes.SIGN_OUT, async () => {
    await signOut();
    analytics.setUserId(undefined);
    analytics.track('user_signed_out');
    return { success: true };
  });

  // Storage handlers (for content scripts that can't access storage directly)
  onMessage<{ key: string; area?: 'local' | 'sync' }, unknown>(
    MessageTypes.GET_STORAGE,
    async ({ key, area = 'local' }) => {
      return storage.get(key, undefined, area);
    }
  );

  onMessage<{ key: string; value: unknown; area?: 'local' | 'sync' }, void>(
    MessageTypes.SET_STORAGE,
    async ({ key, value, area = 'local' }) => {
      await storage.set(key, value, area);
    }
  );

  // Sync handler
  onMessage(MessageTypes.SYNC_DATA, async () => {
    // Implement parent app data sync here
    analytics.track('data_synced');
    return { synced: true, timestamp: Date.now() };
  });

  onMessage(MessageTypes.SYNC_STATUS, async () => {
    const lastSync = await storage.local.get<number>('lastSyncTime');
    return {
      lastSync,
      status: lastSync ? 'synced' : 'never',
    };
  });
}

/**
 * Handle extension installation or update
 */
async function handleInstall(details: chrome.runtime.InstalledDetails) {
  console.log('[Background] Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    // First install
    analytics.track('extension_installed');

    // Initialize default settings
    await storage.local.set('settings', {
      notifications: true,
      syncEnabled: true,
      theme: 'system',
    });

    // Open welcome page
    chrome.tabs.create({
      url: chrome.runtime.getURL('options.html#welcome'),
    });
  } else if (details.reason === 'update') {
    // Extension updated
    analytics.track('extension_updated', {
      previousVersion: details.previousVersion,
    });

    // Show update notification if enabled
    const settings = await storage.local.get<{ notifications: boolean }>('settings');
    if (settings?.notifications) {
      chrome.notifications?.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icon/128.png'),
        title: 'Extension Updated',
        message: 'Click to see what\'s new!',
      });
    }
  }
}

/**
 * Handle browser startup (extension already installed)
 */
async function handleStartup() {
  console.log('[Background] Browser started');

  // Check auth status
  const auth = await checkAuthStatus();
  if (auth.isAuthenticated && auth.user) {
    analytics.setUserId(auth.user.id);
  }

  // Track session start
  analytics.track('session_started');
}

/**
 * Handle service worker suspension
 */
async function handleSuspend() {
  console.log('[Background] Service worker suspending');

  // Flush analytics queue before suspend
  await analytics.flushQueue();
}

/**
 * Create context menu items
 */
function createContextMenus() {
  // Remove existing menus first
  chrome.contextMenus.removeAll(() => {
    // Add your context menu items
    chrome.contextMenus.create({
      id: 'extension-action',
      title: 'Extension Action',
      contexts: ['all'],
    });
  });
}

function safeRegisterContextMenus() {
  try {
    chrome.contextMenus.onClicked?.addListener((info, tab) => {
      console.log('[Background] Context menu clicked:', info.menuItemId);
      analytics.track('context_menu_clicked', { menuId: info.menuItemId });

      // Handle context menu action
      if (info.menuItemId === 'extension-action' && tab?.id) {
        // Send message to content script
        chrome.tabs.sendMessage(tab.id, {
          type: 'CONTEXT_MENU_ACTION',
          payload: { url: info.pageUrl, selection: info.selectionText },
        });
      }
    });

    // Create context menus when extension loads
    createContextMenus();
  } catch (error) {
    console.warn('[Background] Skipping context menu registration:', error);
  }
}

safeRegisterContextMenus();
