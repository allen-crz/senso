
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";

const ChangePassword = () => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "New password and confirmation must match",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 8 characters long",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your password has been updated",
      });
      
      navigate('/settings');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update password",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f7] relative">
      <div className="px-6 pb-32">
        <div className="mb-8 flex items-center gap-4 pt-6">
          <button 
            onClick={() => navigate('/settings')}
            className="text-[#212529]"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-[#212529]">Change Password</h1>
        </div>

        <form onSubmit={handlePasswordUpdate} className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Current Password</label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-transparent text-[#212529] text-lg pr-10"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">New Password</label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-transparent text-[#212529] text-lg pr-10"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Confirm New Password</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-transparent text-[#212529] text-lg pr-10"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Password Requirements</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-500">
                  <i className={`fa-solid fa-check ${newPassword.length >= 8 ? 'text-green-500' : 'text-gray-300'}`} />
                  At least 8 characters
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-500">
                  <i className={`fa-solid fa-check ${/\d/.test(newPassword) ? 'text-green-500' : 'text-gray-300'}`} />
                  Include numbers
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-500">
                  <i className={`fa-solid fa-check ${/[!@#$%^&*]/.test(newPassword) ? 'text-green-500' : 'text-gray-300'}`} />
                  Include special characters
                </li>
              </ul>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-purple-500 text-white rounded-full font-semibold hover:bg-purple-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-6 left-6 right-6">
        <div className="bg-[#212529] rounded-full px-8 py-4">
          <div className="flex justify-between items-center">
            <button onClick={() => navigate('/dashboard')} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-house text-gray-400 text-2xl"></i>
              </div>
              <span className="text-xs text-gray-400">Home</span>
            </button>
            <button onClick={() => navigate('/water')} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-droplet text-gray-400 text-2xl"></i>
              </div>
              <span className="text-xs text-gray-400">Water</span>
            </button>
            <button onClick={() => navigate('/electricity')} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-bolt text-gray-400 text-2xl"></i>
              </div>
              <span className="text-xs text-gray-400">Electric</span>
            </button>
            <button onClick={() => navigate('/settings')} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-gear text-white text-2xl"></i>
              </div>
              <span className="text-xs font-medium text-purple-500">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
