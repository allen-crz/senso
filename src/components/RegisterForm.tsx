import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUpWithEmail } from '@/services/auth';
import { useToast } from "@/hooks/use-toast";
import PasswordRequirements from './PasswordRequirements';
import { validatePassword } from '@/utils/passwordValidation';
import { Input } from '@/components/ui/input';

const RegisterForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const passwordValidation = validatePassword(formData.password);
    
    if (!passwordValidation.isValid) {
      toast({
        variant: "destructive",
        title: "Invalid Password",
        description: "Password must be at least 8 characters long, include numbers and uppercase letters"
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: "Passwords do not match"
      });
      return;
    }

    if (!formData.termsAccepted) {
      toast({
        variant: "destructive",
        title: "Terms and Conditions",
        description: "Please accept the terms and conditions"
      });
      return;
    }

    setIsLoading(true);
    const { user, error } = await signUpWithEmail(formData.email, formData.password, formData.fullName);
    setIsLoading(false);

    if (user && !error) {
      navigate('/registration-success');
    }
  };

  return (
    <form onSubmit={handleRegister} className="bg-white rounded-3xl p-6 shadow-sm mb-6">
      <div className="space-y-4">
        <div className="form-group">
          <label className="block text-sm text-[#212529] mb-2">Full Name</label>
          <Input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-[#f5f6f7] text-[#212529]"
            placeholder="Enter your full name"
            required
          />
        </div>

        <div className="form-group">
          <label className="block text-sm text-[#212529] mb-2">Email Address</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-[#f5f6f7] text-[#212529]"
            placeholder="Enter your email"
            required
          />
        </div>

        <div className="form-group">
          <label className="block text-sm text-[#212529] mb-2">Password</label>
          <Input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-[#f5f6f7] text-[#212529]"
            placeholder="Create a password"
            required
          />
        </div>

        <div className="form-group">
          <label className="block text-sm text-[#212529] mb-2">Confirm Password</label>
          <Input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-[#f5f6f7] text-[#212529]"
            placeholder="Confirm your password"
            required
          />
        </div>

        <PasswordRequirements password={formData.password} />

        <div className="form-group flex items-start gap-3 mt-2">
          <input
            type="checkbox"
            checked={formData.termsAccepted}
            onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
            className="mt-1"
            required
          />
          <p className="text-sm text-gray-500">
            I agree to the <span className="font-semibold text-[#212529] cursor-pointer">Terms and Conditions</span>
          </p>
        </div>
      </div>

      <button 
        type="submit" 
        className="w-full bg-[#212529] text-white py-4 rounded-xl font-semibold mt-6 disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? 'Creating Account...' : 'Sign Up'}
      </button>
    </form>
  );
};

export default RegisterForm;
