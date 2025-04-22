
import React from 'react';

interface ProfileHeaderProps {
  title: string;
  subtitle: string;
}

const ProfileHeader = ({ title, subtitle }: ProfileHeaderProps) => {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-white text-center">{title}</h1>
      <p className="text-center text-white/60 mt-2">
        {subtitle}
      </p>
    </div>
  );
};

export default ProfileHeader;
