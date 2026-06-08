/**
 * Content Script
 *
 * Runs in the context of web pages.
 * Use for DOM manipulation, page scraping, UI injection.
 *
 * IMPORTANT: Content scripts have limited access:
 * - Cannot access chrome.identity
 * - Cannot access chrome.storage.sync directly (use messaging)
 * - Can access chrome.storage.local
 * - Can access chrome.runtime.sendMessage
 *
 * @author Ahsan Mahmood <aoneahsan@gmail.com> (https://aoneahsan.com)
 */

import { sendToBackground } from '@lib/messaging';

export default defineContentScript({
  // Match patterns - customize for your extension
  matches: ['<all_urls>'],

  // When to inject - document_start, document_end, document_idle
  runAt: 'document_end',

  // Main function
  main() {
    console.log('[Content Script] Loaded on:', window.location.href);

    // Initialize content script
    init();
  },
});

/**
 * Initialize the content script
 */
async function init() {
  // Listen for messages from background/popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender, sendResponse);
    return true; // Keep channel open for async response
  });

  // Example helpers intentionally disabled by default.
  // Use these calls when a project needs runtime page UI/DOM observers.
  // void injectUI;
  // void observeDOM;
}

/**
 * Handle messages from background/popup
 */
async function handleMessage(
  message: { type: string; payload?: unknown },
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void
) {
  switch (message.type) {
    case 'GET_PAGE_INFO':
      sendResponse({
        success: true,
        data: {
          url: window.location.href,
          title: document.title,
          description: getMetaDescription(),
          favicon: getFavicon(),
        },
      });
      break;

    case 'INJECT_CONTENT':
      // Handle content injection
      sendResponse({ success: true });
      break;

    case 'CONTEXT_MENU_ACTION':
      // Handle context menu action from background
      handleContextMenuAction(message.payload as { url: string; selection?: string });
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
}

/**
 * Get meta description from page
 */
function getMetaDescription(): string {
  const meta = document.querySelector('meta[name="description"]');
  return meta?.getAttribute('content') || '';
}

/**
 * Get favicon URL
 */
function getFavicon(): string {
  const link = document.querySelector<HTMLLinkElement>(
    'link[rel="icon"], link[rel="shortcut icon"]'
  );
  return link?.href || `${window.location.origin}/favicon.ico`;
}

/**
 * Handle context menu action
 */
function handleContextMenuAction(payload: { url: string; selection?: string }) {
  console.log('[Content Script] Context menu action:', payload);

  // Implement your context menu action here
  // Example: Show a modal, process selected text, etc.
}

/**
 * Example: Inject UI element into page
 */
function injectUI() {
  // Create container
  const container = document.createElement('div');
  container.id = 'extension-ui-container';
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  // Create button
  const button = document.createElement('button');
  button.textContent = 'Extension';
  button.style.cssText = `
    padding: 12px 24px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;
  `;

  button.addEventListener('mouseenter', () => {
    button.style.background = '#2563eb';
    button.style.transform = 'translateY(-2px)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.background = '#3b82f6';
    button.style.transform = 'translateY(0)';
  });

  button.addEventListener('click', async () => {
    // Send message to background
    const response = await sendToBackground('GET_AUTH_STATUS');
    console.log('[Content Script] Auth status:', response);
  });

  container.appendChild(button);
  document.body.appendChild(container);
}

/**
 * Example: Observe DOM changes
 */
function observeDOM() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        // Handle added nodes
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            // Process new elements
            console.log('[Content Script] New element:', node.tagName);
          }
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

void injectUI;
void observeDOM;
