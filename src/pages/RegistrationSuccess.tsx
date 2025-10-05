
import React from 'react';
import { useNavigate } from 'react-router-dom';

const RegistrationSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f6f7] flex flex-col justify-center items-center px-6 py-12">
      {/* Success Animation Container */}
      <div className="flex flex-col items-center justify-center mb-12">
        <div className="w-20 h-20 bg-[#212529] rounded-full flex items-center justify-center mb-8" style={{
          animation: 'gentleBounce 2s ease-in-out infinite'
        }}>
          <i className="fa-solid fa-check text-white text-3xl"></i>
        </div>
        <style>{`
          @keyframes gentleBounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-5px);
            }
            60% {
              transform: translateY(-3px);
            }
          }
        `}</style>
      </div>

      {/* Success Message */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-[#212529] mb-4">Account Created!</h1>
        <p className="text-gray-500 px-4 mb-4">Your account has been created successfully. Let's set up your profile to get started.</p>
        <p className="text-sm text-gray-400 px-4">Click below to create your profile and personalize your experience.</p>
      </div>

      {/* Action Button */}
      <div className="px-4 w-full max-w-xs">
        <button 
          onClick={() => navigate('/profile')}
          className="w-full bg-[#212529] text-white py-4 rounded-xl font-semibold"
        >
          Create Profile
        </button>
      </div>

      {/* Bottom Info */}
      <div className="fixed bottom-8 left-0 right-0 text-center">
        <p className="text-xs text-gray-400">Senso App v1.0.0</p>
      </div>
    </div>
  );
};

export default RegistrationSuccess;
