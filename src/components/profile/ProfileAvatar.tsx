
import React from 'react';
import { Camera } from 'lucide-react';

interface ProfileAvatarProps {
  avatarUrl: string | null;
  avatarFallback: string;
  uploading: boolean;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProfileAvatar = ({ avatarUrl, uploading, onUpload }: ProfileAvatarProps) => {
  return (
    <div className="flex justify-center mb-8">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-[#f5f6f7] flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
          ) : (
            <i className="fa-regular fa-user text-3xl text-gray-400"></i>
          )}
        </div>
        <label 
          className="absolute bottom-0 right-0 w-8 h-8 bg-[#212529] rounded-full flex items-center justify-center cursor-pointer"
          htmlFor="avatar-upload"
        >
          <Camera className="h-4 w-4 text-white" />
          <input
            type="file"
            id="avatar-upload"
            accept="image/*"
            onChange={onUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
};

export default ProfileAvatar;
