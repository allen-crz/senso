
import React from 'react';

const DashboardExistingUserView = () => {
  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-3xl shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[#212529] mb-1">Water Usage Today</h3>
            <p className="text-2xl font-bold text-[#212529]">42 liters used</p>
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
            <i className="fa-solid fa-droplet text-blue-400"></i>
          </div>
        </div>
        <div className="h-2 w-full bg-blue-50 rounded-full mb-4">
          <div className="h-full w-3/4 bg-blue-400 rounded-full"></div>
        </div>
        <button className="text-sm font-semibold text-blue-500">View Details →</button>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[#212529] mb-1">Electricity Usage Today</h3>
            <p className="text-2xl font-bold text-[#212529]">3.2 kWh used</p>
          </div>
          <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
            <i className="fa-solid fa-bolt text-amber-400"></i>
          </div>
        </div>
        <div className="h-2 w-full bg-amber-50 rounded-full mb-4">
          <div className="h-full w-1/2 bg-amber-400 rounded-full"></div>
        </div>
        <button className="text-sm font-semibold text-amber-500">View Details →</button>
      </div>
    </div>
  );
};

export default DashboardExistingUserView;
