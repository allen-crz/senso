
import React from 'react';
import { Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserTypeToggleProps {
  currentType: 'new' | 'existing';
  onTypeChange: (type: 'new' | 'existing') => void;
}

const UserTypeToggle = ({ currentType, onTypeChange }: UserTypeToggleProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Toggle user type"
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
        >
          <Info className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className={currentType === 'new' ? 'bg-blue-50' : ''}
          onClick={() => onTypeChange('new')}
        >
          New User View
        </DropdownMenuItem>
        <DropdownMenuItem
          className={currentType === 'existing' ? 'bg-blue-50' : ''}
          onClick={() => onTypeChange('existing')}
        >
          Existing User View
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserTypeToggle;
