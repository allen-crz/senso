
import React from 'react';

interface ProfileHeaderProps {
  title: string;
  subtitle?: string;
  email?: string;
  phone?: string;
  address?: string;
}

const ProfileHeader = ({ title, subtitle, email, phone, address }: ProfileHeaderProps) => {
  return (
    <div className="p-4 bg-white rounded-2xl shadow-sm mb-4">
      <h2 className="text-lg font-semibold text-[#212529] mb-2">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mb-3">{subtitle}</p>}
      
      <div className="space-y-1.5">
        {email && (
          <p className="text-sm">
            <span className="text-gray-500">Email:</span>{' '}
            <span className="text-[#212529]">{email}</span>
          </p>
        )}
        {phone && (
          <p className="text-sm">
            <span className="text-gray-500">Phone:</span>{' '}
            <span className="text-[#212529]">{phone}</span>
          </p>
        )}
        {address && (
          <p className="text-sm">
            <span className="text-gray-500">Address:</span>{' '}
            <span className="text-[#212529]">{address}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
