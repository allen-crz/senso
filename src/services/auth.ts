import { apiClient } from './api';

export interface AuthError {
  message: string;
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const response = await apiClient.login(email, password);

    // Store auth tokens in localStorage
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('token_type', response.token_type);
    localStorage.setItem('expires_in', response.expires_in.toString());

    // Store refresh token if available (for automatic token refresh)
    if (response.refresh_token) {
      localStorage.setItem('refresh_token', response.refresh_token);
    }

    // Calculate and store token expiration timestamp
    const expiresAt = Date.now() + (response.expires_in * 1000);
    localStorage.setItem('token_expires_at', expiresAt.toString());

    // Dispatch storage event so other components/tabs know about the login
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'access_token',
      newValue: response.access_token,
      oldValue: null,
    }));

    return { user: response.user, error: null };
  } catch (error: any) {
    console.error("Login error:", error);
    return {
      user: null,
      error: {
        message: error.message || "An unexpected error occurred during login"
      } as AuthError
    };
  }
}

export async function signUpWithEmail(email: string, password: string, confirmPassword: string) {
  try {
    const response = await apiClient.register(email, password, confirmPassword);

    // Store auth tokens in localStorage
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('token_type', response.token_type);
    localStorage.setItem('expires_in', response.expires_in.toString());

    // Store refresh token if available (for automatic token refresh)
    if (response.refresh_token) {
      localStorage.setItem('refresh_token', response.refresh_token);
    }

    // Calculate and store token expiration timestamp
    const expiresAt = Date.now() + (response.expires_in * 1000);
    localStorage.setItem('token_expires_at', expiresAt.toString());

    // Dispatch storage event so other components/tabs know about the registration/login
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'access_token',
      newValue: response.access_token,
      oldValue: null,
    }));

    return { user: response.user, error: null };
  } catch (error: any) {
    console.error("Registration error:", error);
    return {
      user: null,
      error: {
        message: error.message || "An unexpected error occurred during registration"
      } as AuthError
    };
  }
}

export async function signOut() {
  try {
    await apiClient.logout();

    // Clear auth tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('expires_in');
    localStorage.removeItem('token_expires_at');
    localStorage.removeItem('user_data');

    // Dispatch storage event so other components/tabs know about the logout
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'access_token',
      newValue: null,
      oldValue: localStorage.getItem('access_token'),
    }));

    return { error: null };
  } catch (error: any) {
    console.error("Sign out error:", error);
    return {
      error: {
        message: error.message || "An unexpected error occurred during sign out"
      } as AuthError
    };
  }
}

export async function refreshAccessToken() {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.refreshToken(refreshToken);

    // Update tokens in localStorage
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('expires_in', response.expires_in.toString());

    if (response.refresh_token) {
      localStorage.setItem('refresh_token', response.refresh_token);
    }

    // Calculate and store new token expiration timestamp
    const expiresAt = Date.now() + (response.expires_in * 1000);
    localStorage.setItem('token_expires_at', expiresAt.toString());

    console.log('[Auth] Token refreshed successfully');
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Token refresh error:", error);
    return {
      success: false,
      error: {
        message: error.message || "Failed to refresh token"
      } as AuthError
    };
  }
}

export async function getCurrentUser() {
  try {
    // Check if token exists before making the request
    const token = localStorage.getItem('access_token');
    if (!token) {
      return { user: null, error: null };
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const expiresAt = localStorage.getItem('token_expires_at');
    if (expiresAt) {
      const expirationTime = parseInt(expiresAt, 10);
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      // If token expires within 5 minutes, try to refresh it
      if (now >= (expirationTime - fiveMinutes)) {
        console.log('[Auth] Token expiring soon, attempting refresh...');
        const refreshResult = await refreshAccessToken();

        if (!refreshResult.success) {
          console.log('[Auth] Token refresh failed, user needs to re-login');
          // Clear tokens if refresh fails
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('token_type');
          localStorage.removeItem('expires_in');
          localStorage.removeItem('token_expires_at');
          localStorage.removeItem('user_data');
          return { user: null, error: null };
        }
      }
    }

    const user = await apiClient.getCurrentUser();
    return { user, error: null };
  } catch (error: any) {
    console.error("Get current user error:", error);

    // If authentication fails, try to refresh token once
    if (error.message?.includes('401') || error.message?.includes('credentials')) {
      console.log('[Auth] 401 error, attempting token refresh...');
      const refreshResult = await refreshAccessToken();

      if (refreshResult.success) {
        // Retry getting user with new token
        try {
          const user = await apiClient.getCurrentUser();
          return { user, error: null };
        } catch (retryError) {
          console.error('Retry failed after token refresh:', retryError);
        }
      }

      // If refresh fails, clear tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_type');
      localStorage.removeItem('expires_in');
      localStorage.removeItem('token_expires_at');
      localStorage.removeItem('user_data');
    }

    return {
      user: null,
      error: null // Return null error to prevent showing error to user on initial load
    };
  }
}

export async function changePassword(newPassword: string) {
  try {
    await apiClient.changePassword(newPassword);
    return { error: null };
  } catch (error: any) {
    console.error("Change password error:", error);
    return {
      error: {
        message: error.message || "Failed to change password"
      } as AuthError
    };
  }
}
