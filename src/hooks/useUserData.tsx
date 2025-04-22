
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
    // If we already have cached data and aren't currently fetching, return early
    if (userDataCache && !isFetchingUserData) {
      setUserData(userDataCache);
      setIsLoading(false);
      return;
    }

    // Prevent multiple simultaneous fetches and re-fetches on the same component
    if (isFetchingUserData || fetchAttemptedRef.current) return;
    fetchAttemptedRef.current = true;

    const fetchUserData = async () => {
      isFetchingUserData = true;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/login');
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
          userDataCache = newUserData;
          setUserData(newUserData);
        }
      } finally {
        isFetchingUserData = false;
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  return { ...userData, isLoading };
};
