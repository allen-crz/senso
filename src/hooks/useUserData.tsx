
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

export interface UserData {
  firstName: string;
  avatarUrl: string | null;
}

export const useUserData = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData>({ firstName: '', avatarUrl: null });
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
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (profile) {
          const firstName = profile.full_name?.split(' ')[0] || 'User';
          setUserData({
            firstName,
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
