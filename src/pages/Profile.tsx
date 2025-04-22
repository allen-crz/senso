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
    <div className="min-h-screen bg-black text-white relative pt-12">
      <div className="px-6 pb-32">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white text-center">Complete Your Profile</h1>
          <p className="text-center text-white/60 mt-2">
            Let's set up your account
          </p>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-3">
            <Avatar className="w-24 h-24">
              <AvatarImage 
                src={avatarUrl || ''} 
                alt="Profile" 
                className="object-cover border-2 border-white/20"
              />
              <AvatarFallback className="bg-white/10 text-white">{avatarFallback}</AvatarFallback>
            </Avatar>
            <label 
              className="absolute bottom-0 right-0 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center cursor-pointer"
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
            className="text-white/70 text-sm font-medium cursor-pointer hover:text-white transition-colors"
          >
            Add Profile Photo
          </label>
        </div>

        <div className="bg-black border border-white/20 rounded-3xl p-6 mb-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm text-white/60 font-medium">Full Name</label>
              <Input
                type="text"
                value={formData.fullName}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, fullName: e.target.value }));
                }}
                className="px-4 py-3 rounded-xl bg-black text-white border border-white/20 focus:border-white/40"
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/60 font-medium">Email Address</label>
              <Input
                type="email"
                value={formData.email}
                className="px-4 py-3 rounded-xl bg-black text-white/70 border border-white/20 cursor-not-allowed opacity-50"
                readOnly
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/60 font-medium">Phone Number</label>
              <PhoneInput
                value={formData.phone}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, phone: value }));
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/60 font-medium">Address</label>
              <AddressInput
                value={formData.address}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, address: value }));
                }}
              />
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSubmit}
          className="w-full py-4 bg-white text-black rounded-full font-semibold mb-6 hover:bg-white/90 transition-colors"
          disabled={isLoading || uploading}
        >
          {isLoading ? 'Creating Profile...' : 'Get Started'}
        </Button>

        <p className="text-center text-xs text-white/40 mb-20">
          This information helps personalize your experience.
        </p>
      </div>
    </div>
  );
};

export default Profile;
