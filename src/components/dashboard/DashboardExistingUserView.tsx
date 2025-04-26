
import React from 'react';
import { Card } from "@/components/ui/card";
import { Droplet, Bolt, ChartLine, AlertTriangle } from "lucide-react";

interface DashboardExistingUserViewProps {
  onAddWaterReading: () => void;
  onAddElectricityReading: () => void;
}

const DashboardExistingUserView = ({ onAddWaterReading, onAddElectricityReading }: DashboardExistingUserViewProps) => {
  return (
    <div className="space-y-4">
      {/* Water Usage Card */}
      <Card className="p-6 rounded-3xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[#212529] mb-1">Water Usage Today</h3>
            <p className="text-2xl font-bold text-[#212529]">42 liters used</p>
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
            <Droplet className="text-blue-400 h-5 w-5" />
          </div>
        </div>
        <div className="h-2 w-full bg-blue-50 rounded-full mb-4">
          <div className="h-full w-3/4 bg-blue-400 rounded-full"></div>
        </div>
        <button 
          className="text-sm font-semibold text-blue-500"
          onClick={onAddWaterReading}
        >
          View Details →
        </button>
      </Card>

      {/* Electricity Usage Card */}
      <Card className="p-6 rounded-3xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[#212529] mb-1">Electricity Usage Today</h3>
            <p className="text-2xl font-bold text-[#212529]">3.2 kWh used</p>
          </div>
          <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
            <Bolt className="text-amber-400 h-5 w-5" />
          </div>
        </div>
        <div className="h-2 w-full bg-amber-50 rounded-full mb-4">
          <div className="h-full w-1/2 bg-amber-400 rounded-full"></div>
        </div>
        <button 
          className="text-sm font-semibold text-amber-500"
          onClick={onAddElectricityReading}
        >
          View Details →
        </button>
      </Card>

      {/* Cost Forecast Card */}
      <Card className="p-6 rounded-3xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[#212529] mb-1">This Month's Forecast</h3>
            <p className="text-2xl font-bold text-[#212529]">₱824 Estimated</p>
          </div>
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <ChartLine className="text-gray-500 h-5 w-5" />
          </div>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full mb-4">
          <div className="h-full w-2/3 bg-gray-400 rounded-full"></div>
        </div>
        <button className="text-sm font-semibold text-gray-500">View Breakdown →</button>
      </Card>

      {/* Anomaly Alert */}
      <Card className="bg-red-500 p-6 rounded-3xl">
        <div className="flex gap-4 items-center">
          <div className="w-10 h-10 bg-red-400 rounded-full flex items-center justify-center">
            <AlertTriangle className="text-white h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">Unusual water usage detected</h3>
            <button className="text-sm font-semibold text-white opacity-90">View Report →</button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardExistingUserView;
