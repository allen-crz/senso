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
            console.error('Profile update error:', updateError);
            throw updateError;
          }

          setAvatarUrl(dataUrl);

          toast({
            title: "Success",
            description: "Avatar uploaded and resized successfully!",
          });
        } catch (error) {
          console.error('Error processing image:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to process avatar. Please try again.",
          });
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = () => {
        console.error('Error reading file');
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to read the selected image. Please try again.",
        });
        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error in uploadAvatar:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload avatar. Please try again.",
      });
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (!userId) {
        throw new Error('User is not authenticated');
      }

      const profileData = {
        id: userId,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        avatar_url: avatarUrl,
      };

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileData);

      if (upsertError) {
        console.error('Profile update error:', upsertError);
        throw upsertError;
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
        duration: 2000,
      });
      
      navigate('/success');
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

  return (
    <div className="min-h-screen bg-[#f5f6f7] px-6 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[#212529] mb-2">Create Profile</h1>
        <p className="text-gray-500">Tell us more about yourself</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-[#f5f6f7] flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <Avatar className="w-full h-full">
                  <AvatarImage 
                    src={avatarUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                  <AvatarFallback>
                    {formData.fullName.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <i className="fa-regular fa-user text-3xl text-gray-400"></i>
              )}
            </div>
            <label 
              className={`absolute bottom-0 right-0 w-8 h-8 bg-[#212529] rounded-full flex items-center justify-center cursor-pointer ${uploading ? 'opacity-50' : ''}`}
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
            {uploading && (
              <div className="absolute -bottom-6 w-full text-center text-xs text-gray-500">
                Uploading...
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">Full Name</label>
            <Input 
              type="text" 
              value={formData.fullName}
              className="bg-[#f5f6f7] opacity-75 cursor-not-allowed" 
              readOnly
            />
          </div>

          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">Email Address</label>
            <Input 
              type="email" 
              value={formData.email}
              className="bg-[#f5f6f7] opacity-75 cursor-not-allowed" 
              readOnly
            />
          </div>

          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">Phone Number</label>
            <PhoneInput
              value={formData.phone}
              onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
            />
          </div>

          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">Address</label>
            <AddressInput
              value={formData.address}
              onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-[#212529] hover:bg-[#2c3238] text-white py-6 rounded-xl font-semibold mt-8"
          disabled={isLoading || uploading}
        >
          {isLoading ? 'Saving Profile...' : 'Save Profile'}
        </Button>
      </form>

      <div className="text-center mt-6">
        <p className="text-gray-500">
          Want to go back?{" "}
          <button 
            onClick={() => navigate('/login')} 
            className="font-semibold text-[#212529] hover:text-[#2c3238]"
          >
            Return to login
          </button>
        </p>
      </div>
    </div>
  );
};

export default Profile;
