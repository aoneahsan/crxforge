/**
 * Chrome Storage API Wrapper
 *
 * Provides type-safe access to chrome.storage.local and chrome.storage.sync
 *
 * @author Ahsan Mahmood <aoneahsan@gmail.com> (https://aoneahsan.com)
 */

export type StorageArea = 'local' | 'sync';

export interface StorageChangeEvent<T> {
  key: string;
  oldValue?: T;
  newValue?: T;
  areaName: StorageArea;
}

/**
 * Get a value from chrome storage
 */
export async function get<T>(
  key: string,
  defaultValue?: T,
  area: StorageArea = 'local'
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const storage = area === 'sync' ? chrome.storage.sync : chrome.storage.local;

    storage.get(key, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      // @types/chrome 0.1+ types the result bag loosely; the stored value is T.
      const stored = (result as Record<string, T | undefined>)[key];
      resolve(stored !== undefined ? stored : defaultValue);
    });
  });
}

/**
 * Get multiple values from chrome storage
 */
export async function getMultiple<T extends Record<string, unknown>>(
  keys: string[],
  area: StorageArea = 'local'
): Promise<Partial<T>> {
  return new Promise((resolve, reject) => {
    const storage = area === 'sync' ? chrome.storage.sync : chrome.storage.local;

    storage.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(result as Partial<T>);
    });
  });
}

/**
 * Set a value in chrome storage
 */
export async function set<T>(
  key: string,
  value: T,
  area: StorageArea = 'local'
): Promise<void> {
  return new Promise((resolve, reject) => {
    const storage = area === 'sync' ? chrome.storage.sync : chrome.storage.local;

    storage.set({ [key]: value }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve();
    });
  });
}

/**
 * Set multiple values in chrome storage
 */
export async function setMultiple(
  items: Record<string, unknown>,
  area: StorageArea = 'local'
): Promise<void> {
  return new Promise((resolve, reject) => {
    const storage = area === 'sync' ? chrome.storage.sync : chrome.storage.local;

    storage.set(items, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve();
    });
  });
}

/**
 * Remove a value from chrome storage
 */
export async function remove(
  key: string | string[],
  area: StorageArea = 'local'
): Promise<void> {
  return new Promise((resolve, reject) => {
    const storage = area === 'sync' ? chrome.storage.sync : chrome.storage.local;

    storage.remove(key, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve();
    });
  });
}

/**
 * Clear all values from chrome storage
 */
export async function clear(area: StorageArea = 'local'): Promise<void> {
  return new Promise((resolve, reject) => {
    const storage = area === 'sync' ? chrome.storage.sync : chrome.storage.local;

    storage.clear(() => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve();
    });
  });
}

/**
 * Listen for storage changes
 */
export function onStorageChange<T>(
  callback: (change: StorageChangeEvent<T>) => void,
  keys?: string[],
  area?: StorageArea
): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) => {
    if (area && areaName !== area) return;

    for (const [key, change] of Object.entries(changes)) {
      if (keys && !keys.includes(key)) continue;

      callback({
        key,
        oldValue: change.oldValue as T | undefined,
        newValue: change.newValue as T | undefined,
        areaName: areaName as StorageArea,
      });
    }
  };

  chrome.storage.onChanged.addListener(listener);

  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}

/**
 * Get storage usage info
 */
export async function getUsage(
  area: StorageArea = 'local'
): Promise<{ bytesUsed: number; quota: number }> {
  return new Promise((resolve, reject) => {
    const storage = area === 'sync' ? chrome.storage.sync : chrome.storage.local;

    storage.getBytesInUse(null, (bytesUsed) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      // Chrome storage quotas
      const quota =
        area === 'sync'
          ? chrome.storage.sync.QUOTA_BYTES // 102,400 bytes
          : chrome.storage.local.QUOTA_BYTES; // 5,242,880 bytes (5 MB)

      resolve({ bytesUsed, quota });
    });
  });
}

/**
 * Convenience object for storage operations
 */
export const storage = {
  get,
  getMultiple,
  set,
  setMultiple,
  remove,
  clear,
  onStorageChange,
  getUsage,

  // Specific storage area helpers
  local: {
    get: <T>(key: string, defaultValue?: T) => get<T>(key, defaultValue, 'local'),
    set: <T>(key: string, value: T) => set(key, value, 'local'),
    remove: (key: string | string[]) => remove(key, 'local'),
    clear: () => clear('local'),
  },

  sync: {
    get: <T>(key: string, defaultValue?: T) => get<T>(key, defaultValue, 'sync'),
    set: <T>(key: string, value: T) => set(key, value, 'sync'),
    remove: (key: string | string[]) => remove(key, 'sync'),
    clear: () => clear('sync'),
  },
};
