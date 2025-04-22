
import React from 'react';

interface ProfileHeaderProps {
  title: string;
  subtitle: string;
}

const ProfileHeader = ({ title, subtitle }: ProfileHeaderProps) => {
  return (
    <div className="mb-8 text-center">
      <h1 className="text-3xl font-bold text-[#212529] mb-2">{title}</h1>
      <p className="text-gray-500">{subtitle}</p>
    </div>
  );
};

export default ProfileHeader;
