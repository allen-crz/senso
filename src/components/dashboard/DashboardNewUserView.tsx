
import React from 'react';
import { Camera } from 'lucide-react';

const DashboardNewUserView = () => {
  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-3xl shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[#212529] mb-1">Water Usage Today</h3>
            <p className="text-gray-400">No readings yet</p>
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
            <i className="fa-solid fa-droplet text-blue-400"></i>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-8">
          <Camera className="text-blue-200 w-12 h-12 mb-4" />
          <p className="text-gray-400 text-center mb-2">Take a photo of your water meter</p>
          <button className="px-6 py-2 bg-blue-50 text-blue-500 rounded-full text-sm font-semibold">Add Reading</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[#212529] mb-1">Electricity Usage Today</h3>
            <p className="text-gray-400">No readings yet</p>
          </div>
          <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
            <i className="fa-solid fa-bolt text-amber-400"></i>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-8">
          <Camera className="text-amber-200 w-12 h-12 mb-4" />
          <p className="text-gray-400 text-center mb-2">Take a photo of your electric meter</p>
          <button className="px-6 py-2 bg-amber-50 text-amber-500 rounded-full text-sm font-semibold">Add Reading</button>
        </div>
      </div>
    </div>
  );
};

export default DashboardNewUserView;
