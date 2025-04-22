
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PhoneInput from '@/components/PhoneInput';
import AddressInput from '@/components/AddressInput';

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
  uploading, 
  onSubmit, 
  onFormDataChange 
}: ProfileFormProps) => {
  return (
    <>
      <div className="bg-white border border-black/20 rounded-3xl p-6 mb-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm text-black/60 font-medium">Full Name</label>
            <Input
              type="text"
              value={formData.fullName}
              onChange={(e) => onFormDataChange({ fullName: e.target.value })}
              className="px-4 py-3 rounded-xl bg-white text-black border border-black/20 focus:border-black/40"
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-black/60 font-medium">Email Address</label>
            <Input
              type="email"
              value={formData.email}
              className="px-4 py-3 rounded-xl bg-white text-black/70 border border-black/20 cursor-not-allowed opacity-50"
              readOnly
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-black/60 font-medium">Phone Number</label>
            <PhoneInput
              value={formData.phone}
              onChange={(value) => onFormDataChange({ phone: value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-black/60 font-medium">Address</label>
            <AddressInput
              value={formData.address}
              onChange={(value) => onFormDataChange({ address: value })}
            />
          </div>
        </div>
      </div>

      <Button 
        onClick={onSubmit}
        className="w-full py-4 bg-black text-white rounded-full font-semibold mb-6 hover:bg-black/90 transition-colors"
        disabled={isLoading || uploading}
      >
        {isLoading ? 'Creating Profile...' : 'Get Started'}
      </Button>

      <p className="text-center text-xs text-black/40 mb-20">
        This information helps personalize your experience.
      </p>
    </>
  );
};

export default ProfileForm;
