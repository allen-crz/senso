
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

  // Use page transition hook
  const { transitionClass, triggerTransition, transitioning } = usePageTransition(300);

  // Visual effect for button click (shrink and fade quickly)
  const [buttonActive, setButtonActive] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { user, error } = await signInWithEmail(email, password);
      
      if (user && !error) {
        // For existing users, check if they have a profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone, address, created_at')
          .eq('id', user.id)
          .maybeSingle();

        // If profile exists and has required fields, go to dashboard
        if (profile?.phone || profile?.address) {
          // Add page exit effect before navigating to /dashboard
          triggerTransition(() => {
            navigate('/dashboard');
          });
        } else {
          // If no profile or incomplete, go to profile page for new users
          triggerTransition(() => {
            navigate('/profile');
          });
        }
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
      setButtonActive(false); // Reset click effect
    }
  };

  // Handler for Register link with transition
  const handleRegisterTransition = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    triggerTransition(() => {
      navigate("/register");
    });
  };

  return (
    <div className={`min-h-screen bg-[#f5f6f7] px-6 py-12 transition-opacity duration-300 ${transitionClass}`}>
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
              autoComplete="username"
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
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#f5f6f7] text-[#212529]"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
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
        </div>

        <div className="text-right mt-2 mb-6">
          <span className="text-sm text-[#212529] cursor-pointer select-none">Forgot Password?</span>
        </div>

        <button 
          type="submit" 
          className={`
            w-full bg-[#212529] text-white py-4 font-semibold transition 
            duration-200 ease-in-out
            rounded-xl
            hover:bg-[#33373a] 
            hover:scale-105
            active:scale-95
            disabled:opacity-50 
            disabled:cursor-not-allowed
            focus:outline-none
            ${buttonActive ? 'scale-95 opacity-75' : ''}
          `}
          style={{transitionProperty: 'background, transform, opacity'}}
          disabled={isLoading}
          onMouseDown={() => setButtonActive(true)}
          onMouseUp={() => setButtonActive(false)}
          onMouseLeave={() => setButtonActive(false)}
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
            className="font-semibold text-[#212529] cursor-pointer inline-block transition story-link"
          >
            Create one here
          </a>
        </p>
      </div>

      <div className="w-full pt-8 text-center">
        <p className="text-xs text-gray-400 bg-transparent">
          Senso App v1.0.0
        </p>
      </div>
    </div>
  );
};

export default Login;
