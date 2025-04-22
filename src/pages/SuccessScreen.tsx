
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SuccessScreen = () => {
  return (
    <div className="min-h-screen bg-[#f5f6f7] px-6 py-12">
      {/* Success Animation */}
      <div className="flex flex-col items-center justify-center mb-12">
        <div className="w-32 h-32 bg-[#212529] rounded-full flex items-center justify-center mb-6 animate-bounce">
          <i className="fa-solid fa-check text-white text-5xl"></i>
        </div>
        <h1 className="text-3xl font-bold text-[#212529] mb-3 text-center">Account Created!</h1>
        <p className="text-gray-500 text-center mb-4">Your Senso account is ready to use</p>
      </div>

      {/* Welcome Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm mb-8">
        <div className="flex flex-col items-center text-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-[#f5f6f7] flex items-center justify-center">
            <i className="fa-regular fa-user text-2xl text-gray-400"></i>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#212529]">Welcome aboard!</h2>
            <p className="text-gray-500">Let's start monitoring your utilities</p>
          </div>
        </div>
      </div>

      {/* Start Scanning Button */}
      <div className="relative">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="w-full bg-[#212529] text-white py-6 rounded-2xl font-bold text-xl relative overflow-hidden group"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-camera text-2xl group-hover:rotate-12 transition-transform"></i>
              <span>Start Scanning!</span>
            </div>
          </div>
          <div className="absolute -right-2 -top-2 w-12 h-12 bg-white/10 rounded-full blur-lg group-hover:scale-150 transition-transform"></div>
        </button>
      </div>

      {/* Quick Tips */}
      <div className="mt-8">
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <i className="fa-solid fa-lightbulb text-sm"></i>
          <p className="text-sm">Tip: Make sure your meter is well-lit</p>
        </div>
      </div>
    </div>
  );
};

export default SuccessScreen;
