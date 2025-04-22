
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeClosed } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Perform login logic here
    // navigate("/dashboard"); // Example navigation after login
  };

  return (
    <div className="min-h-screen bg-[#f5f6f7] px-6 py-12 font-sans relative">
      {/* App Logo */}
      <div className="mb-12 flex justify-center">
        <div className="w-16 h-16 bg-[#212529] rounded-2xl flex items-center justify-center">
          <i className="fa-solid fa-bolt-lightning text-white text-2xl"></i>
        </div>
      </div>

      {/* Welcome Text */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[#212529] mb-2">Welcome to Senso</h1>
        <p className="text-gray-500">Log in to your account to continue</p>
      </div>

      {/* Login Form */}
      <form
        className="bg-white rounded-3xl p-6 shadow-sm mb-6"
        onSubmit={handleLogin}
        autoComplete="off"
      >
        <div className="space-y-4">
          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">
              Email Address
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-xl bg-[#f5f6f7] text-[#212529] outline-none"
              placeholder="Enter your email"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-4 py-3 rounded-xl bg-[#f5f6f7] text-[#212529] outline-none pr-12"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword((show) => !show)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <Eye size={20} className="text-gray-400" />
                ) : (
                  <EyeClosed size={20} className="text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-[#212529] text-white py-4 rounded-xl font-semibold mt-6 transition-colors hover:bg-[#18171d]"
        >
          Log In
        </button>
      </form>

      {/* Register Prompt */}
      <div className="text-center mt-6">
        <p className="text-gray-500">
          {"Don't have an account? "}
          <Link
            to="/register"
            className="font-semibold text-[#212529] cursor-pointer hover:underline"
          >
            Create one here
          </Link>
        </p>
      </div>

      {/* Bottom Info */}
      <div className="fixed bottom-8 left-0 right-0 text-center pointer-events-none z-[10000]">
        <p className="text-xs text-gray-400">Senso App v1.0.0</p>
      </div>
    </div>
  );
};

export default Login;
