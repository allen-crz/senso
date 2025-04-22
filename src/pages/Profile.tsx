
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Image } from 'image-js';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import ProfileForm from '@/components/profile/ProfileForm';

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/login');
          return;
        }

        setUserId(user.id);
        setFormData(prev => ({
          ...prev,
          fullName: user.user_metadata?.full_name || '',
          email: user.email || '',
        }));
      } catch (error) {
        console.error('Error in fetchUserData:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load profile data. Please try again.",
        });
      }
    };

    fetchUserData();
  }, [navigate, toast]);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      if (!userId) {
        throw new Error('User is not authenticated');
      }

      const file = event.target.files[0];
      
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          if (!e.target?.result) {
            throw new Error('Failed to read file');
          }
          
          const img = await Image.load(e.target.result as string);
          
          const size = Math.min(img.width, img.height);
          const croppedImg = img.crop({
            x: Math.floor((img.width - size) / 2),
            y: Math.floor((img.height - size) / 2),
            width: size,
            height: size
          });
          
          const resizedImg = croppedImg.resize({
            width: 300,
            height: 300
          });
          
          const dataUrl = resizedImg.toDataURL();
          
          setAvatarUrl(dataUrl);

          toast({
            title: "Success",
            description: "Profile photo uploaded successfully!",
          });
        } catch (error) {
          console.error('Error processing image:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to process profile photo. Please try again.",
          });
        } finally {
          setUploading(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error in uploadAvatar:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload profile photo. Please try again.",
      });
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      if (!userId) {
        throw new Error('User is not authenticated');
      }

      const profileData = {
        id: userId,
        full_name: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        avatar_url: avatarUrl,
      };

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileData);

      if (upsertError) {
        throw upsertError;
      }

      toast({
        title: "Profile Created",
        description: "Your profile has been created successfully.",
        duration: 2000,
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save profile. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const avatarFallback = formData.fullName.charAt(0).toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-white text-black relative pt-12">
      <div className="px-6 pb-32">
        <ProfileHeader 
          title="Complete Your Profile"
          subtitle="Let's set up your account"
        />
        
        <ProfileAvatar 
          avatarUrl={avatarUrl}
          avatarFallback={avatarFallback}
          uploading={uploading}
          onUpload={uploadAvatar}
        />

        <ProfileForm 
          formData={formData}
          isLoading={isLoading}
          uploading={uploading}
          onSubmit={handleSubmit}
          onFormDataChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
        />
      </div>
    </div>
  );
};

export default Profile;
