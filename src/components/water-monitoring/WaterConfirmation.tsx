
import React from 'react';

const WaterConfirmation = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#212529]">Confirm Reading</h2>
      <div className="bg-white p-6 rounded-3xl shadow-sm">
        <h3 className="text-lg font-semibold text-[#212529] mb-4">Review your submission</h3>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-xl">
            <p className="text-sm text-blue-600 mb-1">Current Reading</p>
            <p className="text-2xl font-bold text-blue-600">42 m³</p>
          </div>
          <button className="w-full bg-blue-500 text-white py-4 rounded-full font-medium">
            Confirm Reading
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaterConfirmation;
