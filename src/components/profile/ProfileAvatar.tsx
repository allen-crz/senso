
import React from 'react';
import { Camera } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ProfileAvatarProps {
  avatarUrl: string | null;
  avatarFallback: string;
  uploading: boolean;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProfileAvatar = ({ avatarUrl, avatarFallback, uploading, onUpload }: ProfileAvatarProps) => {
  return (
    <div className="flex flex-col items-center mb-8">
      <div className="relative mb-3">
        <Avatar className="w-24 h-24">
          <AvatarImage 
            src={avatarUrl || ''} 
            alt="Profile" 
            className="object-cover border-2 border-white/20"
          />
          <AvatarFallback className="bg-white/10 text-white">{avatarFallback}</AvatarFallback>
        </Avatar>
        <label 
          className="absolute bottom-0 right-0 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center cursor-pointer"
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
      <label 
        htmlFor="avatar-upload"
        className="text-white/70 text-sm font-medium cursor-pointer hover:text-white transition-colors"
      >
        Add Profile Photo
      </label>
    </div>
  );
};

export default ProfileAvatar;
