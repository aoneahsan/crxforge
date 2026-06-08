/**
 * Chrome Extension Messaging
 *
 * Handles communication between:
 * - Content scripts <-> Background service worker
 * - Popup <-> Background service worker
 * - Options page <-> Background service worker
 *
 * @author Ahsan Mahmood <aoneahsan@gmail.com> (https://aoneahsan.com)
 */

export interface Message<T = unknown> {
  type: string;
  payload?: T;
}

export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export type MessageHandler<T = unknown, R = unknown> = (
  payload: T,
  sender: chrome.runtime.MessageSender
) => Promise<R> | R;

const handlers = new Map<string, MessageHandler>();

/**
 * Send a message to the background service worker
 */
export async function sendToBackground<T, R>(
  type: string,
  payload?: T
): Promise<MessageResponse<R>> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, payload }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({
          success: false,
          error: chrome.runtime.lastError.message,
        });
        return;
      }

      resolve(response || { success: true });
    });
  });
}

/**
 * Send a message to a specific tab's content script
 */
export async function sendToTab<T, R>(
  tabId: number,
  type: string,
  payload?: T
): Promise<MessageResponse<R>> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type, payload }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({
          success: false,
          error: chrome.runtime.lastError.message,
        });
        return;
      }

      resolve(response || { success: true });
    });
  });
}

/**
 * Send a message to all tabs
 */
export async function sendToAllTabs<T>(
  type: string,
  payload?: T
): Promise<void> {
  const tabs = await chrome.tabs.query({});

  for (const tab of tabs) {
    if (tab.id) {
      // Don't await - fire and forget
      sendToTab(tab.id, type, payload).catch(() => {
        // Ignore errors for tabs that don't have content script
      });
    }
  }
}

/**
 * Send a message to the active tab's content script
 */
export async function sendToActiveTab<T, R>(
  type: string,
  payload?: T
): Promise<MessageResponse<R>> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    return { success: false, error: 'No active tab found' };
  }

  return sendToTab<T, R>(tab.id, type, payload);
}

/**
 * Register a message handler (use in background service worker)
 */
export function onMessage<T, R>(
  type: string,
  handler: MessageHandler<T, R>
): void {
  handlers.set(type, handler as MessageHandler);
}

/**
 * Remove a message handler
 */
export function offMessage(type: string): void {
  handlers.delete(type);
}

/**
 * Initialize the message listener
 * Call this once in the background service worker
 */
export function initMessageListener(): void {
  chrome.runtime.onMessage.addListener(
    (message: Message, sender, sendResponse) => {
      const handler = handlers.get(message.type);

      if (!handler) {
        sendResponse({ success: false, error: `Unknown message type: ${message.type}` });
        return false;
      }

      // Handle async handlers
      Promise.resolve(handler(message.payload, sender))
        .then((data) => {
          sendResponse({ success: true, data });
        })
        .catch((error) => {
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        });

      // Return true to indicate async response
      return true;
    }
  );
}

/**
 * Create a typed message sender for a specific message type
 */
export function createMessageSender<T, R>(type: string) {
  return {
    toBackground: (payload?: T) => sendToBackground<T, R>(type, payload),
    toTab: (tabId: number, payload?: T) => sendToTab<T, R>(tabId, type, payload),
    toActiveTab: (payload?: T) => sendToActiveTab<T, R>(type, payload),
    toAllTabs: (payload?: T) => sendToAllTabs(type, payload),
  };
}

/**
 * Message types enum - extend in your extension
 */
export const MessageTypes = {
  // Auth
  GET_AUTH_STATUS: 'GET_AUTH_STATUS',
  SIGN_IN: 'SIGN_IN',
  SIGN_OUT: 'SIGN_OUT',

  // Storage
  GET_STORAGE: 'GET_STORAGE',
  SET_STORAGE: 'SET_STORAGE',

  // Content script
  GET_PAGE_INFO: 'GET_PAGE_INFO',
  INJECT_CONTENT: 'INJECT_CONTENT',

  // Sync
  SYNC_DATA: 'SYNC_DATA',
  SYNC_STATUS: 'SYNC_STATUS',
} as const;

export type MessageType = (typeof MessageTypes)[keyof typeof MessageTypes];

export const messaging = {
  sendToBackground,
  sendToTab,
  sendToAllTabs,
  sendToActiveTab,
  onMessage,
  offMessage,
  initMessageListener,
  createMessageSender,
  MessageTypes,
};
