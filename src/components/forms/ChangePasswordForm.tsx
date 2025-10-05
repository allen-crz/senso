
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from "@/services/auth";
import { toast } from "@/hooks/use-toast";
import PasswordInput from './PasswordInput';
import PasswordRequirements from './PasswordRequirements';
import { validatePassword } from '@/utils/passwordValidation';

const ChangePasswordForm = () => {
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

    const passwordValidation = validatePassword(newPassword);

    if (!passwordValidation.isValid) {
      toast({
        variant: "destructive",
        title: "Invalid Password",
        description: "Password must be at least 8 characters long, include numbers and uppercase letters",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await changePassword(newPassword);

      if (result.error) {
        throw new Error(result.error.message);
      }

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
    <form onSubmit={handlePasswordUpdate} className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm">
        <div className="space-y-4">
          <PasswordInput
            value={currentPassword}
            onChange={setCurrentPassword}
            label="Current Password"
            placeholder="Enter current password"
            showPassword={showCurrentPassword}
            onToggleShow={() => setShowCurrentPassword(!showCurrentPassword)}
          />
          <PasswordInput
            value={newPassword}
            onChange={setNewPassword}
            label="New Password"
            placeholder="Enter new password"
            showPassword={showNewPassword}
            onToggleShow={() => setShowNewPassword(!showNewPassword)}
          />
          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            label="Confirm New Password"
            placeholder="Confirm new password"
            showPassword={showConfirmPassword}
            onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
          />
        </div>
        <PasswordRequirements password={newPassword} />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 px-6 bg-[#212529] text-white rounded-xl font-semibold hover:bg-[#303338] active:bg-[#1a1d21] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  );
};

export default ChangePasswordForm;
