import React from 'react';

interface NewUserResultsProps {
  utilityType?: 'electricity' | 'water';
}

const NewUserResults: React.FC<NewUserResultsProps> = ({ 
  utilityType = 'water' 
}) => {
  // Choose colors based on utility type
  const headerColor = utilityType === 'electricity' ? 'text-orange-600' : 'text-blue-600';
  const utilityName = utilityType === 'electricity' ? 'Electricity' : 'Water';

  return (
    <div className="space-y-4 pb-10">
      <h2 className="text-2xl font-bold text-[#212529] mb-6">Meter Scan Results</h2>

      {/* Meter Usage/Bill Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm mb-4">
        <h3 className={`text-lg font-semibold ${headerColor} mb-4`}>Meter Usage This Month</h3>
        <div className="text-center mb-6">
          <p className="text-gray-500">Please input your first meter reading to get started.</p>
        </div>
      </div>

      {/* Anomaly Detection Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-600 mb-1">Anomaly Detection</h3>
          <p className="text-gray-400">Please input your first reading to enable anomaly detection</p>
        </div>
      </div>

      {/* Estimated Bill Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Estimated Bill</h3>
          <p className="text-gray-400">Input your first reading to see bill estimates</p>
        </div>
      </div>
    </div>
  );
};

export default NewUserResults;