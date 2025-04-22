
import React from 'react';

interface ProfileHeaderProps {
  title: string;
  subtitle: string;
}

const ProfileHeader = ({ title, subtitle }: ProfileHeaderProps) => {
  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div className="text-sm text-[#212529]">9:41</div>
        <div className="flex items-center gap-2 text-[#212529]">
          <i className="fa-solid fa-signal"></i>
          <i className="fa-solid fa-wifi"></i>
          <i className="fa-solid fa-battery-full"></i>
        </div>
      </div>
      
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[#212529] mb-2">{title}</h1>
        <p className="text-gray-500">{subtitle}</p>
      </div>
    </>
  );
};

export default ProfileHeader;
