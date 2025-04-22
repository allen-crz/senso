import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Image } from 'image-js';
import PhoneInput from '@/components/PhoneInput';
import AddressInput from '@/components/AddressInput';

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
  const [hasChanges, setHasChanges] = useState(false);

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

        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url, phone, address')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        if (data) {
          setFormData(prev => ({
            ...prev,
            phone: data.phone || '',
            address: data.address || '',
          }));
          
          if (data.avatar_url) {
            setAvatarUrl(data.avatar_url);
          }
        }
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
          
          const { error: updateError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              avatar_url: dataUrl,
            });

          if (updateError) {
            throw updateError;
          }

          setAvatarUrl(dataUrl);
          setHasChanges(true);

          toast({
            title: "Success",
            description: "Profile photo updated successfully!",
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
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
        duration: 2000,
      });
      
      setHasChanges(false);
      navigate('/settings');
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
    <div className="min-h-screen bg-[#f5f6f7] relative">
      <div className="px-6 pb-32">
        <div className="mb-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/settings')} className="text-[#212529]">
              <i className="fa-solid fa-arrow-left text-xl"></i>
            </button>
            <h1 className="text-2xl font-bold text-[#212529]">Edit Profile</h1>
          </div>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-3">
            <Avatar className="w-24 h-24">
              <AvatarImage src={avatarUrl || ''} alt="Profile" className="object-cover" />
              <AvatarFallback>{avatarFallback}</AvatarFallback>
            </Avatar>
            <label 
              className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer"
              htmlFor="avatar-upload"
            >
              <Camera className="h-4 w-4 text-white" />
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
          <label 
            htmlFor="avatar-upload"
            className="text-blue-500 text-sm font-medium cursor-pointer"
          >
            Change Photo
          </label>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm text-gray-500 font-medium">Full Name</label>
              <Input
                type="text"
                value={formData.fullName}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, fullName: e.target.value }));
                  setHasChanges(true);
                }}
                className="px-4 py-3 rounded-xl bg-[#f5f6f7] text-[#212529]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-500 font-medium">Email Address</label>
              <Input
                type="email"
                value={formData.email}
                className="px-4 py-3 rounded-xl bg-[#f5f6f7] text-[#212529] opacity-75 cursor-not-allowed"
                readOnly
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-500 font-medium">Phone Number</label>
              <PhoneInput
                value={formData.phone}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, phone: value }));
                  setHasChanges(true);
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-500 font-medium">Address</label>
              <AddressInput
                value={formData.address}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, address: value }));
                  setHasChanges(true);
                }}
              />
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSubmit}
          className="w-full py-4 bg-blue-500 text-white rounded-full font-semibold mb-6 hover:bg-blue-600 transition-colors"
          disabled={!hasChanges || isLoading || uploading}
        >
          {isLoading ? 'Saving Changes...' : 'Save Changes'}
        </Button>

        <p className="text-center text-xs text-gray-400 mb-20">
          Your profile info is used to personalize your experience.
        </p>
      </div>

      <div id="bottom-nav" className="fixed bottom-6 left-6 right-6 z-50">
        <div className="flex justify-between items-center">
          <button onClick={() => navigate('/settings')} className="text-[#212529]">
            <i className="fa-solid fa-arrow-left text-xl"></i>
          </button>
          <button 
            onClick={handleSubmit}
            className="text-blue-500 font-semibold" 
            disabled={!hasChanges || isLoading}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
