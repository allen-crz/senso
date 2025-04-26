
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

export interface UserData {
  firstName: string;
  email: string;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
}

// Create a cache to store user data across component instances
let userDataCache: UserData | null = null;
let cachedUserId: string | null = null;
let isFetchingUserData = false;

export const useUserData = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData>(() => 
    userDataCache || { 
      firstName: '', 
      email: '',
      phone: null,
      address: null,
      avatarUrl: null 
    }
  );
  const [isLoading, setIsLoading] = useState(!userDataCache);
  const fetchAttemptedRef = useRef(false);

  useEffect(() => {
    // Reset fetch attempt tracking on each effect run
    fetchAttemptedRef.current = false;
    
    const fetchUserData = async () => {
      if (isFetchingUserData) return;
      
      isFetchingUserData = true;
      setIsLoading(true);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/login');
          return;
        }

        // Clear cache if user ID changed (different user logged in)
        if (cachedUserId !== user.id) {
          userDataCache = null;
          cachedUserId = user.id;
        }

        // If we already have cached data for this user, use it
        if (userDataCache && cachedUserId === user.id) {
          setUserData(userDataCache);
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, phone, address')
          .eq('id', user.id)
          .single();

        if (profile) {
          const firstName = profile.full_name?.split(' ')[0] || 'User';
          const newUserData = {
            firstName,
            email: user.email || '',
            phone: profile.phone,
            address: profile.address,
            avatarUrl: profile.avatar_url,
          };
          
          // Update the cache and state
          cachedUserId = user.id;
          userDataCache = newUserData;
          setUserData(newUserData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Clear cache on error
        userDataCache = null;
        cachedUserId = null;
      } finally {
        isFetchingUserData = false;
        setIsLoading(false);
      }
    };

    fetchUserData();
    
    // Listen for auth state changes to update user data
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        // Clear cache when user signs out
        userDataCache = null;
        cachedUserId = null;
        setUserData({ 
          firstName: '', 
          email: '',
          phone: null,
          address: null,
          avatarUrl: null 
        });
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // Refetch user data when user signs in or is updated
        fetchUserData();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return { ...userData, isLoading };
};
