/**
 * Chrome Identity API Authentication
 *
 * CRITICAL: This uses Chrome Identity API, NOT Firebase Auth SDK.
 * Firebase Auth SDK loads remote scripts and will cause Chrome Web Store rejection.
 *
 * @author Ahsan Mahmood <aoneahsan@gmail.com> (https://aoneahsan.com)
 */

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Get OAuth2 token using Chrome Identity API
 * This is the ONLY approved method for Chrome extensions
 */
export async function getAuthToken(interactive = true): Promise<string | null> {
  return new Promise((resolve, reject) => {
    // @types/chrome 0.1+: the callback yields a GetAuthTokenResult object
    // (with a `token` field), not a bare string.
    chrome.identity.getAuthToken({ interactive }, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(result?.token ?? null);
    });
  });
}

/**
 * Remove cached auth token (for sign out or token refresh)
 */
export async function removeCachedAuthToken(token: string): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.identity.removeCachedAuthToken({ token }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
}

/**
 * Get user info from Google's userinfo endpoint
 * Uses the access token from Chrome Identity API
 */
export async function getUserInfo(token: string): Promise<UserInfo> {
  const response = await fetch(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get user info: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    picture: data.picture,
  };
}

/**
 * Sign in with Google using Chrome Identity API
 *
 * NEVER use signInWithPopup or signInWithRedirect from Firebase Auth SDK
 * They load remote scripts and will be rejected by Chrome Web Store
 */
export async function signIn(): Promise<{ user: UserInfo; token: string }> {
  const token = await getAuthToken(true);

  if (!token) {
    throw new Error('Failed to get auth token');
  }

  const user = await getUserInfo(token);

  return { user, token };
}

/**
 * Sign out - removes cached token
 */
export async function signOut(): Promise<void> {
  const token = await getAuthToken(false);

  if (token) {
    await removeCachedAuthToken(token);
  }
}

/**
 * Check if user is currently signed in
 */
export async function checkAuthStatus(): Promise<{
  isAuthenticated: boolean;
  user: UserInfo | null;
  token: string | null;
}> {
  try {
    const token = await getAuthToken(false);

    if (!token) {
      return { isAuthenticated: false, user: null, token: null };
    }

    const user = await getUserInfo(token);
    return { isAuthenticated: true, user, token };
  } catch {
    return { isAuthenticated: false, user: null, token: null };
  }
}

/**
 * Refresh the auth token
 */
export async function refreshToken(): Promise<string | null> {
  const currentToken = await getAuthToken(false);

  if (currentToken) {
    await removeCachedAuthToken(currentToken);
  }

  return getAuthToken(true);
}
