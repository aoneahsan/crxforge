/**
 * Bundled Analytics for Browser Extensions
 *
 * CRITICAL: This uses bundled npm packages and REST APIs only.
 * NEVER use Firebase Analytics SDK, Google Analytics, or any CDN-loaded scripts.
 * They will cause Chrome Web Store rejection.
 *
 * Safe analytics methods:
 * 1. Firestore REST API for custom analytics
 * 2. Amplitude HTTP API (bundled)
 * 3. Sentry npm package (bundled)
 *
 * @author Ahsan Mahmood <aoneahsan@gmail.com> (https://aoneahsan.com)
 */

import { storage } from './storage';

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

export interface AnalyticsConfig {
  firestoreProjectId?: string;
  amplitudeApiKey?: string;
  sentryDsn?: string;
  debug?: boolean;
}

let config: AnalyticsConfig = {};
const sessionId: string = generateSessionId();
let userId: string | undefined;

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Initialize analytics with configuration
 */
export function initAnalytics(analyticsConfig: AnalyticsConfig): void {
  config = analyticsConfig;

  if (config.debug) {
    console.log('[Analytics] Initialized with config:', {
      hasFirestore: !!config.firestoreProjectId,
      hasAmplitude: !!config.amplitudeApiKey,
      hasSentry: !!config.sentryDsn,
    });
  }
}

/**
 * Set the user ID for analytics
 */
export function setUserId(id: string | undefined): void {
  userId = id;
}

/**
 * Track an analytics event
 */
export async function track(
  eventName: string,
  properties?: Record<string, unknown>
): Promise<void> {
  const event: AnalyticsEvent = {
    name: eventName,
    properties,
    timestamp: Date.now(),
    sessionId,
    userId,
  };

  if (config.debug) {
    console.log('[Analytics] Track:', event);
  }

  // Queue event for batch sending
  await queueEvent(event);

  // Send to configured services
  const promises: Promise<void>[] = [];

  if (config.amplitudeApiKey) {
    promises.push(sendToAmplitude(event));
  }

  if (config.firestoreProjectId && userId) {
    promises.push(sendToFirestore(event));
  }

  await Promise.allSettled(promises);
}

/**
 * Track a page view
 */
export async function trackPageView(pageName: string): Promise<void> {
  await track('page_view', { page: pageName });
}

/**
 * Track an error
 */
export async function trackError(
  error: Error,
  context?: Record<string, unknown>
): Promise<void> {
  await track('error', {
    message: error.message,
    stack: error.stack,
    ...context,
  });

  // Also send to Sentry if configured
  if (config.sentryDsn) {
    await sendToSentry(error, context);
  }
}

/**
 * Queue event for batch sending (stored locally)
 */
async function queueEvent(event: AnalyticsEvent): Promise<void> {
  const queue = (await storage.local.get<AnalyticsEvent[]>('analytics_queue')) || [];
  queue.push(event);

  // Keep only last 100 events
  if (queue.length > 100) {
    queue.splice(0, queue.length - 100);
  }

  await storage.local.set('analytics_queue', queue);
}

/**
 * Send event to Amplitude HTTP API
 *
 * Uses bundled HTTP calls, not CDN scripts
 */
async function sendToAmplitude(event: AnalyticsEvent): Promise<void> {
  if (!config.amplitudeApiKey) return;

  try {
    const amplitudeEvent = {
      api_key: config.amplitudeApiKey,
      events: [
        {
          event_type: event.name,
          user_id: event.userId || 'anonymous',
          device_id: sessionId,
          time: event.timestamp,
          event_properties: event.properties,
        },
      ],
    };

    await fetch('https://api2.amplitude.com/2/httpapi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(amplitudeEvent),
    });
  } catch (error) {
    if (config.debug) {
      console.error('[Analytics] Amplitude error:', error);
    }
  }
}

/**
 * Send event to Firestore REST API
 *
 * Uses REST API, not Firebase SDK (which loads remote scripts)
 */
async function sendToFirestore(event: AnalyticsEvent): Promise<void> {
  if (!config.firestoreProjectId || !userId) return;

  try {
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${config.firestoreProjectId}/databases/(default)/documents/extension_analytics`;

    const firestoreDoc = {
      fields: {
        eventName: { stringValue: event.name },
        userId: { stringValue: userId },
        sessionId: { stringValue: event.sessionId },
        timestamp: { integerValue: event.timestamp.toString() },
        properties: {
          mapValue: {
            fields: Object.fromEntries(
              Object.entries(event.properties || {}).map(([key, value]) => [
                key,
                { stringValue: String(value) },
              ])
            ),
          },
        },
      },
    };

    await fetch(firestoreUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(firestoreDoc),
    });
  } catch (error) {
    if (config.debug) {
      console.error('[Analytics] Firestore error:', error);
    }
  }
}

/**
 * Send error to Sentry
 *
 * Uses bundled Sentry SDK or HTTP API
 */
async function sendToSentry(
  error: Error,
  context?: Record<string, unknown>
): Promise<void> {
  if (!config.sentryDsn) return;

  try {
    // Parse Sentry DSN
    const dsnMatch = config.sentryDsn.match(
      /https:\/\/([^@]+)@([^/]+)\/(\d+)/
    );

    if (!dsnMatch) {
      console.error('[Analytics] Invalid Sentry DSN');
      return;
    }

    const [, publicKey, host, projectId] = dsnMatch;

    const sentryPayload = {
      event_id: crypto.randomUUID().replace(/-/g, ''),
      timestamp: new Date().toISOString(),
      platform: 'javascript',
      level: 'error',
      logger: 'browser-extension',
      exception: {
        values: [
          {
            type: error.name,
            value: error.message,
            stacktrace: {
              frames: parseStackTrace(error.stack),
            },
          },
        ],
      },
      user: userId ? { id: userId } : undefined,
      extra: context,
    };

    await fetch(`https://${host}/api/${projectId}/store/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=extension/1.0, sentry_key=${publicKey}`,
      },
      body: JSON.stringify(sentryPayload),
    });
  } catch (err) {
    if (config.debug) {
      console.error('[Analytics] Sentry error:', err);
    }
  }
}

/**
 * Parse stack trace into Sentry-compatible format
 */
function parseStackTrace(
  stack?: string
): Array<{ filename: string; lineno: number; function: string }> {
  if (!stack) return [];

  const lines = stack.split('\n').slice(1);
  return lines
    .map((line) => {
      const match = line.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):\d+\)?/);
      if (!match) return null;

      return {
        function: match[1] || '<anonymous>',
        filename: match[2],
        lineno: parseInt(match[3], 10),
      };
    })
    .filter(Boolean) as Array<{ filename: string; lineno: number; function: string }>;
}

/**
 * Flush queued events (call periodically or on extension suspend)
 */
export async function flushQueue(): Promise<void> {
  const queue = await storage.local.get<AnalyticsEvent[]>('analytics_queue');

  if (!queue || queue.length === 0) return;

  // Clear queue first to prevent duplicate sending
  await storage.local.set('analytics_queue', []);

  // Send all queued events
  for (const event of queue) {
    const promises: Promise<void>[] = [];

    if (config.amplitudeApiKey) {
      promises.push(sendToAmplitude(event));
    }

    if (config.firestoreProjectId && event.userId) {
      promises.push(sendToFirestore(event));
    }

    await Promise.allSettled(promises);
  }
}

export const analytics = {
  init: initAnalytics,
  setUserId,
  track,
  trackPageView,
  trackError,
  flushQueue,
};
