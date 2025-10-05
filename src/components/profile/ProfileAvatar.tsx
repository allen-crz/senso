import React, { useState } from 'react';
import { Camera } from 'lucide-react';

interface ProfileAvatarProps {
  avatarUrl: string | null;
  avatarFallback: string;
  uploading: boolean;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProfileAvatar = ({ avatarUrl, uploading, onUpload }: ProfileAvatarProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="flex justify-center mb-8">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-[#f5f6f7] flex items-center justify-center overflow-hidden">
          {avatarUrl ? (
            <div className="w-full h-full rounded-full bg-gray-200 overflow-hidden">
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-full h-full object-cover transition-opacity duration-300"
                style={{ opacity: imageLoaded ? 1 : 0 }}
                onLoad={() => setImageLoaded(true)}
              />
            </div>
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
