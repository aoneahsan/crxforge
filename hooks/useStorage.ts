/**
 * React Hook for Chrome Storage API
 *
 * Provides reactive state management with chrome.storage
 *
 * @author Ahsan Mahmood <aoneahsan@gmail.com> (https://aoneahsan.com)
 */

import { useState, useEffect, useCallback } from 'react';
import { storage, type StorageArea } from '@lib/storage';

export interface UseStorageOptions<T> {
  defaultValue?: T;
  area?: StorageArea;
}

export interface UseStorageReturn<T> {
  value: T | undefined;
  setValue: (newValue: T) => Promise<void>;
  removeValue: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for reading and writing to chrome.storage
 *
 * @example
 * ```tsx
 * const { value: settings, setValue: setSettings, loading } = useStorage<Settings>('settings', {
 *   defaultValue: { theme: 'dark', notifications: true },
 *   area: 'sync'
 * });
 *
 * // Update settings
 * await setSettings({ ...settings, theme: 'light' });
 * ```
 */
export function useStorage<T>(
  key: string,
  options: UseStorageOptions<T> = {}
): UseStorageReturn<T> {
  const { defaultValue, area = 'local' } = options;

  const [value, setValueState] = useState<T | undefined>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial value
  useEffect(() => {
    let mounted = true;

    const loadValue = async () => {
      try {
        setLoading(true);
        setError(null);

        const storedValue = await storage.get<T>(key, defaultValue, area);

        if (mounted) {
          setValueState(storedValue);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load value');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadValue();

    return () => {
      mounted = false;
    };
  }, [key, defaultValue, area]);

  // Listen for storage changes
  useEffect(() => {
    const unsubscribe = storage.onStorageChange<T>(
      (change) => {
        if (change.key === key) {
          setValueState(change.newValue ?? defaultValue);
        }
      },
      [key],
      area
    );

    return unsubscribe;
  }, [key, defaultValue, area]);

  // Set value function
  const setValue = useCallback(
    async (newValue: T) => {
      try {
        setError(null);
        await storage.set(key, newValue, area);
        setValueState(newValue);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save value');
        throw err;
      }
    },
    [key, area]
  );

  // Remove value function
  const removeValue = useCallback(async () => {
    try {
      setError(null);
      await storage.remove(key, area);
      setValueState(defaultValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove value');
      throw err;
    }
  }, [key, area, defaultValue]);

  return {
    value,
    setValue,
    removeValue,
    loading,
    error,
  };
}

/**
 * Hook for reading and writing multiple storage keys at once
 *
 * @example
 * ```tsx
 * const { values, setValues, loading } = useMultiStorage(['key1', 'key2'], {
 *   defaults: { key1: 'default1', key2: 'default2' }
 * });
 * ```
 */
export function useMultiStorage<T extends Record<string, unknown>>(
  keys: string[],
  options: { defaults?: Partial<T>; area?: StorageArea } = {}
): {
  values: Partial<T>;
  setValues: (newValues: Partial<T>) => Promise<void>;
  loading: boolean;
  error: string | null;
} {
  const { defaults = {}, area = 'local' } = options;
  const defaultsByKey = defaults as Partial<Record<string, unknown>>;

  const [values, setValuesState] = useState<Partial<T>>(defaults);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial values
  useEffect(() => {
    let mounted = true;

    const loadValues = async () => {
      try {
        setLoading(true);
        setError(null);

        const storedValues = await storage.getMultiple<T>(keys, area);

        if (mounted) {
          setValuesState({ ...defaults, ...storedValues });
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load values');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadValues();

    return () => {
      mounted = false;
    };
  }, [keys.join(','), area]);

  // Listen for storage changes
  useEffect(() => {
    const unsubscribe = storage.onStorageChange<unknown>(
      (change) => {
        if (keys.includes(change.key)) {
          setValuesState((prev) => ({
            ...prev,
            [change.key]: change.newValue ?? defaultsByKey[change.key],
          }));
        }
      },
      keys,
      area
    );

    return unsubscribe;
  }, [keys.join(','), area, defaultsByKey]);

  // Set values function
  const setValues = useCallback(
    async (newValues: Partial<T>) => {
      try {
        setError(null);
        await storage.setMultiple(newValues as Record<string, unknown>, area);
        setValuesState((prev) => ({ ...prev, ...newValues }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save values');
        throw err;
      }
    },
    [area]
  );

  return {
    values,
    setValues,
    loading,
    error,
  };
}

export default useStorage;
