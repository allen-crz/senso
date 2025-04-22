
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { signUpWithEmail } from '@/services/auth';
import { useToast } from "@/hooks/use-toast";

const Register = () => {
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
      toast({
        title: "Account Created",
        description: "Please log in with your new account"
      });
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f7] px-6 py-12">
      <div className="mb-12 flex justify-center">
        <div className="w-16 h-16 bg-[#212529] rounded-2xl flex items-center justify-center">
          <i className="fa-solid fa-bolt-lightning text-white text-2xl"></i>
        </div>
      </div>

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[#212529] mb-2">Create your account</h1>
        <p className="text-gray-500">Join Senso to start monitoring your utilities</p>
      </div>

      <form onSubmit={handleRegister} className="bg-white rounded-3xl p-6 shadow-sm mb-6">
        <div className="space-y-4">
          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">Full Name</label>
            <input
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
            <input
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[#f5f6f7] text-[#212529]"
                placeholder="Create a password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[#f5f6f7] text-[#212529]"
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

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

      <div className="text-center mt-6">
        <p className="text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-[#212529]">
            Log in
          </Link>
        </p>
      </div>

      <div className="fixed bottom-8 left-0 right-0 text-center">
        <p className="text-xs text-gray-400">Senso App v1.0.0</p>
      </div>
    </div>
  );
};

export default Register;
