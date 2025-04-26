
import React from 'react';
import { ChevronDown } from 'lucide-react';

const NewUserResults = () => {
  return (
    <div className="space-y-4 pb-10">
      <h2 className="text-2xl font-bold text-[#212529] mb-6">Meter Scan Results</h2>

      {/* Meter Usage/Bill Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm mb-4">
        <h3 className="text-lg font-semibold text-blue-600 mb-4">Meter Usage This Month</h3>
        <div className="text-center mb-6">
          <p className="text-xl text-gray-700 mb-3">Welcome to Water Monitoring!</p>
          <p className="text-gray-500 mb-2">To get started, please input your first meter reading.</p>
          <p className="text-gray-500">You can either scan your meter or input the reading manually.</p>
        </div>
      </div>

      {/* Anomaly Detection Card */}
      <div className="bg-gray-100 p-6 rounded-3xl shadow-sm mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-600 mb-1">Anomaly Detection</h3>
            <p className="text-gray-400">Please input your first reading to enable anomaly detection</p>
          </div>
          <ChevronDown className="text-gray-400 h-6 w-6" />
        </div>
      </div>

      {/* Estimated Bill Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Estimated Bill</h3>
            <p className="text-gray-400">Input your first reading to see bill estimates</p>
          </div>
          <ChevronDown className="text-gray-400 h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

export default NewUserResults;
