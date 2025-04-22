
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      // Pre-populate with user's registration data
      setFormData(prev => ({
        ...prev,
        fullName: user.user_metadata?.full_name || '',
        email: user.email || '',
      }));
    };

    fetchUserData();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No user found');
      }

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
        });

      if (error) throw error;

      toast({
        title: "Profile Created",
        description: "Your profile has been created successfully.",
        duration: 2000,
      });
      
      navigate('/success');
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
    <div className="min-h-screen bg-[#f5f6f7] px-6 py-12">
      {/* Header Text */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[#212529] mb-2">Create Profile</h1>
        <p className="text-gray-500">Tell us more about yourself</p>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-sm">
        {/* Profile Image Upload */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-[#f5f6f7] flex items-center justify-center">
              <i className="fa-regular fa-user text-3xl text-gray-400"></i>
            </div>
            <button 
              type="button"
              className="absolute bottom-0 right-0 w-8 h-8 bg-[#212529] rounded-full flex items-center justify-center"
              onClick={() => console.log('Upload image')}
            >
              <Camera className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">Full Name</label>
            <Input 
              type="text" 
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              className="bg-[#f5f6f7]" 
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">Email Address</label>
            <Input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="bg-[#f5f6f7]" 
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">Phone Number</label>
            <Input 
              type="tel" 
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="bg-[#f5f6f7]" 
              placeholder="Enter your phone number"
            />
          </div>

          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">Address</label>
            <Textarea 
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="bg-[#f5f6f7] resize-none h-24" 
              placeholder="Enter your complete address"
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-[#212529] hover:bg-[#2c3238] text-white py-6 rounded-xl font-semibold mt-8"
          disabled={isLoading}
        >
          {isLoading ? 'Saving Profile...' : 'Save Profile'}
        </Button>
      </form>

      {/* Return to Login */}
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
