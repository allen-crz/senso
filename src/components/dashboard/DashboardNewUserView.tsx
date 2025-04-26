
import React from 'react';
import WaterSection from '@/components/WaterSection';
import ElectricitySection from '@/components/ElectricitySection';
import { Card } from "@/components/ui/card";
import { Camera } from "lucide-react";

interface DashboardNewUserViewProps {
  onAddWaterReading: () => void;
  onAddElectricityReading: () => void;
}

const DashboardNewUserView = ({ onAddWaterReading, onAddElectricityReading }: DashboardNewUserViewProps) => {
  return (
    <div className="space-y-4">
      <WaterSection variant="dashboard" onAddReading={onAddWaterReading} />
      <ElectricitySection variant="dashboard" onAddReading={onAddElectricityReading} />

      <Card className="bg-white p-6 rounded-3xl shadow-sm">
        <div className="text-center">
          <Camera className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#212529] mb-2">Welcome to Monitoring!</h3>
          <p className="text-gray-500 mb-4">Start by adding your first meter reading</p>
          <button
            onClick={onAddWaterReading}
            className="w-full px-6 py-3 bg-blue-50 text-blue-500 rounded-full text-sm font-semibold mb-2"
          >
            Add Water Reading
          </button>
          <button
            onClick={onAddElectricityReading}
            className="w-full px-6 py-3 bg-amber-50 text-amber-500 rounded-full text-sm font-semibold"
          >
            Add Electricity Reading
          </button>
        </div>
      </Card>
    </div>
  );
};

export default DashboardNewUserView;
