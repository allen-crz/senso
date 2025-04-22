
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const [userId, setUserId] = useState<string | null>(null);

  // On mount, get user/email from session
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
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load profile data. Please try again.",
        });
      }
    };
    fetchUserData();
  }, [navigate, toast]);

  const handleChange = (key: string, val: string) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!userId) throw new Error("User not found");
      const profileData = {
        id: userId,
        full_name: formData.fullName,
        phone: formData.phone,
        address: formData.address,
      };
      const { error } = await supabase
        .from('profiles')
        .upsert(profileData);
      if (error) throw error;
      toast({
        title: "Profile Created",
        description: "Your profile has been created successfully.",
        duration: 2000,
      });
      navigate('/dashboard');
    } catch (error) {
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
    <div className="min-h-screen bg-[#f5f6f7] px-6 py-12 font-[Inter]">
      {/* Status Bar Mockup */}
      <div className="flex justify-between items-center mb-8">
        <div className="text-sm text-[#212529]">9:41</div>
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-signal"></i>
          <i className="fa-solid fa-wifi"></i>
          <i className="fa-solid fa-battery-full"></i>
        </div>
      </div>
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[#212529] mb-2">Create Profile</h1>
        <p className="text-gray-500">Tell us more about yourself</p>
      </div>
      {/* Profile Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl p-6 shadow-sm"
        autoComplete="off"
      >
        {/* Profile Image Upload (static for now) */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-[#f5f6f7] flex items-center justify-center">
              <i className="fa-regular fa-user text-3xl text-gray-400"></i>
            </div>
            <button
              type="button"
              className="absolute bottom-0 right-0 w-8 h-8 bg-[#212529] rounded-full flex items-center justify-center"
              tabIndex={-1}
              disabled
            >
              <i className="fa-solid fa-camera text-white text-sm"></i>
            </button>
          </div>
        </div>
        <div className="space-y-4">
          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">Full Name</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-[#f5f6f7] text-[#212529]"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">Email Address</label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-xl bg-[#f5f6f7] text-[#212529]"
              placeholder="Enter your email"
              value={formData.email}
              readOnly
              required
            />
          </div>
          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">Phone Number</label>
            <input
              type="tel"
              className="w-full px-4 py-3 rounded-xl bg-[#f5f6f7] text-[#212529]"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">Address</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl bg-[#f5f6f7] text-[#212529] resize-none h-24"
              placeholder="Enter your complete address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-[#212529] text-white py-4 rounded-xl font-semibold mt-8"
          disabled={isLoading}
        >
          {isLoading ? 'Saving Profile...' : 'Save Profile'}
        </button>
      </form>
      {/* Return to Login */}
      <div className="text-center mt-6">
        <p className="text-gray-500">
          Want to go back?{' '}
          <Link to="/login" className="font-semibold text-[#212529] cursor-pointer">
            Return to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Profile;
