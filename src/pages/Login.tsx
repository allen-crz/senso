
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { signInWithEmail } from '@/services/auth';
import { supabase } from "@/integrations/supabase/client";
import { usePageTransition } from "@/hooks/usePageTransition";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // For login transition effect
  const [loginTransitioning, setLoginTransitioning] = useState(false);

  // Use page transition hook for transitioning between pages (register)
  const { transitionClass, triggerTransition, transitioning } = usePageTransition(300);

  // Handler for the login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginTransitioning(true);

    try {
      const { user, error } = await signInWithEmail(email, password);
      
      if (user && !error) {
        // For existing users, check if they have a profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone, address, created_at')
          .eq('id', user.id)
          .single();

        // Animate fade-out, then navigate
        setTimeout(() => {
          if (profile?.phone || profile?.address) {
            navigate('/dashboard');
          } else {
            navigate('/profile');
          }
        }, 300);
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginTransitioning(false); // Remove transition in case of error
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for Register link with transition
  const handleRegisterTransition = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    triggerTransition(() => {
      navigate("/register");
    });
  };

  // Classes for the login transition
  const mainTransitionClass = loginTransitioning 
    ? "opacity-0 pointer-events-none transition-opacity duration-300"
    : transitionClass; // fallback to regular transition logic

  return (
    <div className={`min-h-screen bg-[#f5f6f7] px-6 py-12 ${mainTransitionClass}`}>
      <div className="mb-12 flex justify-center">
        <div className="w-16 h-16 bg-[#212529] rounded-2xl flex items-center justify-center">
          <i className="fa-solid fa-bolt-lightning text-white text-2xl"></i>
        </div>
      </div>

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[#212529] mb-2">Welcome to Senso</h1>
        <p className="text-gray-500">Log in to your account to continue</p>
      </div>

      <form 
        onSubmit={handleLogin} 
        className="bg-white rounded-3xl p-6 shadow-sm mb-6"
        autoComplete="off"
      >
        <div className="space-y-4">
          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#f5f6f7] text-[#212529]"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="text-right mt-2 mb-6">
          <span className="text-sm text-[#212529] cursor-pointer">Forgot Password?</span>
        </div>

        <button 
          type="submit" 
          className={`
            w-full bg-[#212529] text-white py-4 rounded-xl font-semibold
            transition-all duration-150
            hover:bg-[#3a3f44] 
            active:scale-[0.96] active:bg-[#1A1F2C]
            focus:outline-none focus:ring-2 focus:ring-primary
            disabled:opacity-50
            select-none
          `}
          style={{ transitionProperty: 'background, transform, box-shadow, opacity' }}
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <div className="text-center mt-6">
        <p className="text-gray-500">
          {"Don't have an account? "}
          <a
            href="/register"
            onClick={handleRegisterTransition}
            className="font-semibold text-[#212529] cursor-pointer inline-block transition story-link hover-scale"
            tabIndex={0}
          >
            Create one here
          </a>
        </p>
      </div>

      {/* Fixed footer at bottom with rounded/corner popup style */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-[#212529] text-white px-5 py-2 rounded-full shadow-lg text-xs z-50
        w-auto max-w-xs text-center opacity-90 select-none">
        <span>Senso App v1.0.0</span>
      </div>
    </div>
  );
};

export default Login;

