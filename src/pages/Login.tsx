import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempted with:', { email, password });
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-[#f5f6f7] px-6 py-12">
      <div className="mb-12 flex justify-center">
        <div className="w-16 h-16 bg-[#212529] rounded-2xl flex items-center justify-center">
          <i className="fa-solid fa-bolt-lightning text-white text-2xl"></i>
        </div>
      </div>

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[#212529] mb-2">Welcome to Senso</h1>
        <p className="text-gray-500">Log in to your account to continue</p>
      </div>

      <form onSubmit={handleLogin} className="bg-white rounded-3xl p-6 shadow-sm mb-6">
        <div className="space-y-4">
          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#f5f6f7] text-[#212529]"
              placeholder="Enter your email"
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
        </div>

        <div className="text-right mt-2 mb-6">
          <span className="text-sm text-[#212529] cursor-pointer">Forgot Password?</span>
        </div>

        <button type="submit" className="w-full bg-[#212529] text-white py-4 rounded-xl font-semibold">
          Log In
        </button>
      </form>

      <div className="text-center mt-6">
        <p className="text-gray-500">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-[#212529]">
            Create one here
          </Link>
        </p>
      </div>

      <div className="fixed bottom-8 left-0 right-0 text-center">
        <p className="text-xs text-gray-400">Senso App v1.0.0</p>
      </div>
    </div>
  );
};

export default Login;
