
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

export interface UserData {
  firstName: string;
  email: string;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
}

export const useUserData = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData>({ 
    firstName: '', 
    email: '',
    phone: null,
    address: null,
    avatarUrl: null 
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
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
          setUserData({
            firstName,
            email: user.email || '',
            phone: profile.phone,
            address: profile.address,
            avatarUrl: profile.avatar_url,
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  return { ...userData, isLoading };
};
