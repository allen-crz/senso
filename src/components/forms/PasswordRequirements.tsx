
import React from 'react';

interface PasswordRequirementsProps {
  password: string;
}

const PasswordRequirements = ({ password }: PasswordRequirementsProps) => {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-gray-500 mb-4">Password Requirements</h3>
      <ul className="space-y-2">
        <li className="flex items-center gap-2 text-sm text-gray-500">
          <i className={`fa-solid fa-check ${password.length >= 8 ? 'text-green-500' : 'text-gray-300'}`} />
          At least 8 characters
        </li>
        <li className="flex items-center gap-2 text-sm text-gray-500">
          <i className={`fa-solid fa-check ${/\d/.test(password) ? 'text-green-500' : 'text-gray-300'}`} />
          Include numbers
        </li>
        <li className="flex items-center gap-2 text-sm text-gray-500">
          <i className={`fa-solid fa-check ${/[A-Z]/.test(password) ? 'text-green-500' : 'text-gray-300'}`} />
          Include uppercase letters
        </li>
      </ul>
    </div>
  );
};

export default PasswordRequirements;
