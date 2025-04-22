
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from 'react-router-dom';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
}

interface ProfileFormProps {
  formData: FormData;
  isLoading: boolean;
  uploading: boolean;
  onSubmit: () => void;
  onFormDataChange: (updates: Partial<FormData>) => void;
}

const ProfileForm = ({ 
  formData, 
  isLoading, 
  onSubmit, 
  onFormDataChange 
}: ProfileFormProps) => {
  return (
    <>
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="space-y-4">
          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">Full Name</label>
            <Input
              type="text"
              value={formData.fullName}
              onChange={(e) => onFormDataChange({ fullName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-[#f5f6f7] text-[#212529] border-none"
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">Email Address</label>
            <Input
              type="email"
              value={formData.email}
              className="w-full px-4 py-3 rounded-xl bg-[#f5f6f7] text-[#212529]/70 border-none cursor-not-allowed"
              placeholder="Enter your email"
              readOnly
            />
          </div>

          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">Phone Number</label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => onFormDataChange({ phone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-[#f5f6f7] text-[#212529] border-none"
              placeholder="Enter your phone number"
            />
          </div>

          <div className="form-group">
            <label className="block text-sm text-[#212529] mb-2">Address</label>
            <Textarea
              value={formData.address}
              onChange={(e) => onFormDataChange({ address: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-[#f5f6f7] text-[#212529] resize-none h-24 border-none"
              placeholder="Enter your complete address"
            />
          </div>
        </div>

        <Button 
          onClick={onSubmit}
          className="w-full bg-[#212529] text-white py-4 rounded-xl font-semibold mt-8 h-auto"
          disabled={isLoading}
        >
          {isLoading ? 'Saving Profile...' : 'Save Profile'}
        </Button>
      </div>

      <div className="text-center mt-6">
        <p className="text-gray-500">
          Want to go back?{' '}
          <Link to="/login" className="font-semibold text-[#212529] cursor-pointer">
            Return to login
          </Link>
        </p>
      </div>
    </>
  );
};

export default ProfileForm;
