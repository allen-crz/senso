
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here you would typically save the profile data
    console.log('Profile saved');
    toast({
      title: "Profile Created",
      description: "Your profile has been created successfully.",
      duration: 2000,
    });
    
    // Navigate to success screen
    navigate('/success');
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
              className="bg-[#f5f6f7]" 
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">Email Address</label>
            <Input 
              type="email" 
              className="bg-[#f5f6f7]" 
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">Phone Number</label>
            <Input 
              type="tel" 
              className="bg-[#f5f6f7]" 
              placeholder="Enter your phone number"
            />
          </div>

          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">Address</label>
            <Textarea 
              className="bg-[#f5f6f7] resize-none h-24" 
              placeholder="Enter your complete address"
            />
          </div>
        </div>

        <Button type="submit" className="w-full bg-[#212529] hover:bg-[#2c3238] text-white py-6 rounded-xl font-semibold mt-8">
          Save Profile
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
