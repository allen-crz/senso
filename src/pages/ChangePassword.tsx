
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from "lucide-react";
import ChangePasswordForm from '@/components/ChangePasswordForm';

const ChangePassword = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#f5f6f7]">
      <div className="px-6 pt-6 pb-4">
        <div className="mb-4 flex items-center gap-4">
          <button 
            onClick={() => navigate('/settings')}
            className="text-[#212529]"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-[#212529]">Change Password</h1>
        </div>
      </div>

      <div className="flex-grow overflow-auto px-6 pb-6">
        <ChangePasswordForm />
      </div>
    </div>
  );
};

export default ChangePassword;
