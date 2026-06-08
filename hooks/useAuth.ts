/**
 * React Hook for Chrome Identity API Authentication
 *
 * CRITICAL: Uses Chrome Identity API, NOT Firebase Auth SDK.
 * Firebase Auth SDK loads remote scripts = Chrome Web Store rejection.
 *
 * @author Ahsan Mahmood <aoneahsan@gmail.com> (https://aoneahsan.com)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  signIn as authSignIn,
  signOut as authSignOut,
  checkAuthStatus,
  type UserInfo,
  type AuthState,
} from '@lib/auth';
import { storage } from '@lib/storage';

const AUTH_STORAGE_KEY = 'extension_auth';

export interface UseAuthReturn extends AuthState {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

/**
 * Hook for managing authentication state
 *
 * @example
 * ```tsx
 * function App() {
 *   const { isAuthenticated, user, loading, signIn, signOut } = useAuth();
 *
 *   if (loading) return <LoadingSpinner />;
 *
 *   if (!isAuthenticated) {
 *     return <Button onClick={signIn}>Sign in with Google</Button>;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Welcome, {user?.name}</p>
 *       <Button onClick={signOut}>Sign out</Button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
    error: null,
  });

  // Check auth status on mount
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        // First check cached auth
        const cachedAuth = await storage.local.get<{
          user: UserInfo;
          token: string;
        }>(AUTH_STORAGE_KEY);

        if (cachedAuth && mounted) {
          setState({
            isAuthenticated: true,
            user: cachedAuth.user,
            token: cachedAuth.token,
            loading: true, // Still loading while we verify
            error: null,
          });
        }

        // Verify with Chrome Identity API
        const { isAuthenticated, user, token } = await checkAuthStatus();

        if (mounted) {
          if (isAuthenticated && user && token) {
            // Cache the auth state
            await storage.local.set(AUTH_STORAGE_KEY, { user, token });

            setState({
              isAuthenticated: true,
              user,
              token,
              loading: false,
              error: null,
            });
          } else {
            // Clear cached auth if invalid
            await storage.local.remove(AUTH_STORAGE_KEY);

            setState({
              isAuthenticated: false,
              user: null,
              token: null,
              loading: false,
              error: null,
            });
          }
        }
      } catch (err) {
        if (mounted) {
          setState({
            isAuthenticated: false,
            user: null,
            token: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Auth check failed',
          });
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // Sign in function
  const signIn = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { user, token } = await authSignIn();

      // Cache the auth state
      await storage.local.set(AUTH_STORAGE_KEY, { user, token });

      setState({
        isAuthenticated: true,
        user,
        token,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Sign in failed',
      }));
      throw err;
    }
  }, []);

  // Sign out function
  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await authSignOut();

      // Clear cached auth
      await storage.local.remove(AUTH_STORAGE_KEY);

      setState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Sign out failed',
      }));
      throw err;
    }
  }, []);

  // Refresh auth function
  const refreshAuth = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { isAuthenticated, user, token } = await checkAuthStatus();

      if (isAuthenticated && user && token) {
        await storage.local.set(AUTH_STORAGE_KEY, { user, token });

        setState({
          isAuthenticated: true,
          user,
          token,
          loading: false,
          error: null,
        });
      } else {
        await storage.local.remove(AUTH_STORAGE_KEY);

        setState({
          isAuthenticated: false,
          user: null,
          token: null,
          loading: false,
          error: null,
        });
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Auth refresh failed',
      }));
      throw err;
    }
  }, []);

  return {
    ...state,
    signIn,
    signOut,
    refreshAuth,
  };
}

export default useAuth;
