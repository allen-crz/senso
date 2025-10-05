import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, ArrowLeft } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserData } from "@/hooks/useUserData";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Image } from 'image-js';
import PhoneInput from '@/components/forms/PhoneInput';
import AddressInput from '@/components/forms/AddressInput';
import { api } from '@/services/api';

const EditProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const { refreshUserData } = useUserData();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }

    // Load existing profile data from API
    const loadProfile = async () => {
      try {
        const profile = await api.getProfile();
        setFormData({
          fullName: profile.full_name || user.email?.split('@')[0] || '',
          email: user.email || '',
          phone: profile.phone || '',
          address: profile.address || '',
        });
        setAvatarUrl(profile.avatar_url);
      } catch (error) {
        console.error('Error loading profile:', error);
        // Fallback to basic user data
        setFormData({
          fullName: user.email?.split('@')[0] || '',
          email: user.email || '',
          phone: '',
          address: '',
        });
      }
    };

    loadProfile();
  }, [user, loading, navigate]);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      if (!user) {
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
          
          // Upload avatar to backend
          try {
            await api.updateAvatar(dataUrl);
            setAvatarUrl(dataUrl);
            setHasChanges(true);

            toast({
              title: "Success",
              description: "Profile photo updated successfully!",
            });
          } catch (error) {
            console.error('Error uploading avatar:', error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to save profile photo. Please try again.",
            });
          }
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
      if (!user) {
        throw new Error('User is not authenticated');
      }

      // Update profile via API
      await api.updateProfile({
        full_name: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        avatar_url: avatarUrl || undefined,
      });
      
      toast({
        title: "Profile Updated",
        description: "Your profile changes have been saved successfully.",
        duration: 2000,
      });
      
      // Refresh user data cache
      await refreshUserData();

      setHasChanges(false);

      // Check if this is a new user (coming from registration) or existing user
      const isNewUser = location.pathname === '/profile' && !location.state?.fromSettings;

      if (isNewUser) {
        // New user flow: go to consumption input
        navigate('/consumption-input');
      } else {
        // Existing user editing profile: go back to settings
        navigate('/settings');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
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
    <div className="min-h-screen bg-[#f5f6f7] relative pt-6">
      <div className="px-6 pb-6">
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/settings')}
            className="mr-auto"
          >
            <ArrowLeft className="h-6 w-6 text-[#212529]" />
          </Button>
          <h1 className="text-2xl font-bold text-[#212529] mr-auto">Edit Profile</h1>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-3">
            <Avatar className="w-24 h-24">
              <AvatarImage src={avatarUrl || ''} alt="Profile" className="object-cover" />
              <AvatarFallback>{avatarFallback}</AvatarFallback>
            </Avatar>
            <label 
              className="absolute bottom-0 right-0 w-8 h-8 bg-[#212529] rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors"
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
            className="text-[#212529] text-sm font-medium cursor-pointer"
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

        <button 
          onClick={handleSubmit}
          className="w-full py-4 px-6 bg-[#212529] text-white rounded-xl font-semibold mb-4 hover:bg-[#303338] active:bg-[#1a1d21] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!hasChanges || isLoading || uploading}
        >
          {isLoading ? 'Saving Changes...' : 'Save Changes'}
        </button>

        <p className="text-center text-xs text-gray-400">
          Your profile info is used to personalize your experience.
        </p>
      </div>
    </div>
  );
};

export default EditProfile;
