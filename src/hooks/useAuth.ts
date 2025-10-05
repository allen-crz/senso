import { useState, useEffect } from 'react';
import { getCurrentUser, signOut as authSignOut } from '@/services/auth';
import { PreferencesService, type UserPreferences } from '@/lib/database';
import { clearAllCaches } from '@/utils/cacheInvalidation';
import { initSessionTracking, cleanupSessionTracking } from '@/utils/sessionManager';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user
    const getInitialUser = async () => {
      try {
        const { user: currentUser } = await getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
          await loadPreferences(currentUser.id);

          // Initialize session tracking when user is logged in
          // Only logout if both token expired AND user inactive for 24h
          initSessionTracking(async () => {
            console.log('[Auth] Auto-logout triggered due to token expiration and inactivity');
            await signOut();
            window.location.href = '/login';
          });
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialUser();

    // Listen for storage changes (user logout/login from another tab or after login)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token') {
        if (!e.newValue) {
          // Token removed - logout
          setUser(null);
          setPreferences(null);
          cleanupSessionTracking();
        } else {
          // Token added - login, refresh user data
          getInitialUser();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      cleanupSessionTracking();
    };
  }, []);

  const loadPreferences = async (userId: string) => {
    try {
      const data = await PreferencesService.get();
      setPreferences(data);
    } catch (error) {
      console.error('Preferences loading error:', error);
    }
  };

  const signOut = async () => {
    try {
      // Clear state first
      setUser(null);
      setPreferences(null);

      // Cleanup session tracking
      cleanupSessionTracking();

      // Clear all caches on logout
      await clearAllCaches();

      // Sign out from backend
      const result = await authSignOut();

      return result;
    } catch (error: any) {
      console.error('Sign out error:', error);
      return { error: { message: error.message } };
    }
  };

  const refreshPreferences = () => {
    if (user) {
      loadPreferences(user.id);
    }
  };

  return {
    user,
    preferences,
    loading,
    signOut,
    refreshPreferences,
    isAuthenticated: !!user,
    hasProfile: !!(user?.email)
  };
};