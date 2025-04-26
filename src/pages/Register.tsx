
import React from 'react';
import { Link } from 'react-router-dom';
import RegisterForm from '@/components/RegisterForm';

const Register = () => {
  return (
    <div className="min-h-screen bg-[#f5f6f7] px-6 py-12 relative">
      <div className="mb-12 flex justify-center">
        <div className="w-16 h-16 bg-[#212529] rounded-2xl flex items-center justify-center">
          <i className="fa-solid fa-bolt-lightning text-white text-2xl"></i>
        </div>
      </div>

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[#212529] mb-2">Create your account</h1>
        <p className="text-gray-500">Join Senso to start monitoring your utilities</p>
      </div>

      <RegisterForm />

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
