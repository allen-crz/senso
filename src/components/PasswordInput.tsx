
import React from 'react';
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  showPassword: boolean;
  onToggleShow: () => void;
}

const PasswordInput = ({ 
  value, 
  onChange, 
  label, 
  placeholder, 
  showPassword, 
  onToggleShow 
}: PasswordInputProps) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-500 mb-2">{label}</label>
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-[#212529] text-lg pr-10"
          placeholder={placeholder}
          required
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
};

export default PasswordInput;
