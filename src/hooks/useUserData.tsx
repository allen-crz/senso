
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/hooks/useAuthContext';
import { api } from "@/services/api";

export interface UserData {
  firstName: string;
  email: string;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
}

// Use sessionStorage for cache instead of module-level variables
const getUserDataCache = (): { data: UserData | null; userId: string | null } => {
  try {
    const cache = sessionStorage.getItem('userData');
    return cache ? JSON.parse(cache) : { data: null, userId: null };
  } catch {
    return { data: null, userId: null };
  }
};

const setUserDataCache = (data: UserData | null, userId: string | null) => {
  try {
    sessionStorage.setItem('userData', JSON.stringify({ data, userId }));
  } catch {
    // Silently fail if sessionStorage is not available
  }
};

const clearUserDataCache = () => {
  try {
    sessionStorage.removeItem('userData');
  } catch {
    // Silently fail if sessionStorage is not available
  }
};

export const useUserData = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthContext(); // Use auth from context - NO API CALL!
  const { data: cachedData } = getUserDataCache();
  const [userData, setUserData] = useState<UserData>(() =>
    cachedData || {
      firstName: '',
      email: '',
      phone: null,
      address: null,
      avatarUrl: null
    }
  );
  const [isLoading, setIsLoading] = useState(!cachedData);
  const fetchAttemptedRef = useRef(false);

  useEffect(() => {
    // Reset fetch attempt tracking on each effect run
    fetchAttemptedRef.current = false;

    const fetchUserData = async () => {
      if (fetchAttemptedRef.current) return;
      fetchAttemptedRef.current = true;

      setIsLoading(true);

      try {
        // Use user from context instead of calling getCurrentUser again!
        if (!user || !isAuthenticated) {
          navigate('/login');
          return;
        }

        const cache = getUserDataCache();

        // Clear cache if user ID changed (different user logged in)
        if (cache.userId !== user.id) {
          clearUserDataCache();
        }

        // If we already have cached data for this user, use it
        if (cache.data && cache.userId === user.id) {
          setUserData(cache.data);
          setIsLoading(false);

          // Refresh cache in background without blocking UI
          setTimeout(() => refreshUserData(user.id), 0);
          return;
        }

        // Try to load full profile data from API
        let profileData = null;
        try {
          profileData = await api.getProfile();
        } catch (profileError) {
          console.warn('Could not load profile data:', profileError);
        }

        // Use profile data if available, otherwise fall back to user data
        const firstName = profileData?.full_name || user.email?.split('@')[0] || 'User';
        const newUserData = {
          firstName,
          email: user.email || '',
          phone: profileData?.phone || null,
          address: profileData?.address || null,
          avatarUrl: profileData?.avatar_url || null,
        };

        // Update the cache and state
        setUserDataCache(newUserData, user.id);
        setUserData(newUserData);
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Clear cache on error
        clearUserDataCache();
      } finally {
        setIsLoading(false);
      }
    };
    
    // Helper function to refresh user data in background
    const refreshUserData = async (userId: string) => {
      try {
        // Use user from context instead of fetching again
        if (!user || user.id !== userId) return;
        
        // Try to load full profile data from API
        let profileData = null;
        try {
          profileData = await api.getProfile();
        } catch (profileError) {
          console.warn('Could not load profile data in refresh:', profileError);
        }

        // Use profile data if available, otherwise fall back to user data
        const firstName = profileData?.full_name || user.email?.split('@')[0] || 'User';
        const newUserData = {
          firstName,
          email: user.email || '',
          phone: profileData?.phone || null,
          address: profileData?.address || null,
          avatarUrl: profileData?.avatar_url || null,
        };

        setUserDataCache(newUserData, user.id);
        setUserData(newUserData);
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    };

    fetchUserData();

    // Listen for storage changes (when user logs out from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' && !e.newValue) {
        // Token was removed (user logged out)
        clearUserDataCache();
        setUserData({
          firstName: '',
          email: '',
          phone: null,
          address: null,
          avatarUrl: null
        });
        navigate('/login');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate, user, isAuthenticated]);

  // Function to refresh user data after profile updates
  const refreshUserData = async () => {
    const cache = getUserDataCache();
    if (!cache.userId) return;

    try {
      // Use user from context instead of fetching again
      if (!user || user.id !== cache.userId) return;

      // Try to load full profile data from API
      let profileData = null;
      try {
        profileData = await api.getProfile();
      } catch (profileError) {
        console.warn('Could not load profile data in manual refresh:', profileError);
      }

      // Use profile data if available, otherwise fall back to user data
      const firstName = profileData?.full_name || user.email?.split('@')[0] || 'User';
      const newUserData = {
        firstName,
        email: user.email || '',
        phone: profileData?.phone || null,
        address: profileData?.address || null,
        avatarUrl: profileData?.avatar_url || null,
      };

      setUserDataCache(newUserData, user.id);
      setUserData(newUserData);
    } catch (error) {
      console.error('Error in manual refresh user data:', error);
    }
  };

  return { ...userData, isLoading, refreshUserData };
};
