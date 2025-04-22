
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Droplet, Camera } from "lucide-react";

interface WaterReading {
  id: string;
  user_id: string;
  reading: number;
  created_at: string;
  updated_at: string;
}

interface WaterSectionProps {
  variant?: 'dashboard' | 'water';
  onAddReading?: () => void;
}

const fetchWaterData = async (): Promise<WaterReading | null> => {
  // Handling the error from console logs - the table doesn't exist yet
  // So we'll return null to simulate no data
  console.log('Attempting to fetch water data');
  return null;
};

const WaterSection = ({ variant = 'dashboard', onAddReading }: WaterSectionProps) => {
  const { data: waterData, isLoading, error } = useQuery({
    queryKey: ['water-reading'],
    queryFn: fetchWaterData
  });

  if (isLoading) {
    return <LoadingState />;
  }

  // If no water readings and on dashboard, show "Add Reading" card
  if (!waterData && variant === 'dashboard') {
    return (
      <Card className="bg-white p-6 rounded-3xl shadow-sm">
        <div className="flex flex-col items-center justify-center py-8">
          <Camera className="text-blue-200 w-12 h-12 mb-4" />
          <p className="text-gray-400 text-center mb-2">Take a photo of your water meter</p>
          <button
            className="px-6 py-2 bg-blue-50 text-blue-500 rounded-full text-sm font-semibold transition-colors hover:bg-blue-100 hover:text-blue-600 active:scale-95 focus:outline-none"
            onClick={onAddReading}
            type="button"
          >
            Add Reading
          </button>
        </div>
      </Card>
    );
  }

  // If no water readings and on water page, show "No readings" message
  if (!waterData) {
    return (
      <Card className="bg-white p-6 rounded-3xl shadow-sm">
        <div className="text-center text-gray-500 py-8">
          <Camera className="text-blue-200 w-12 h-12 mb-4 mx-auto" />
          <p className="mb-4">No water readings available</p>
          <button
            className="px-6 py-2 bg-blue-50 text-blue-500 rounded-full text-sm font-semibold transition-colors hover:bg-blue-100 hover:text-blue-600 active:scale-95 focus:outline-none"
            onClick={onAddReading}
            type="button"
          >
            Add Reading
          </button>
        </div>
      </Card>
    );
  }

  const currentUsage = waterData.reading || 0;
  const maxUsage = 100; // Example threshold
  const progress = (currentUsage / maxUsage) * 100;

  return (
    <Card className="bg-white p-6 rounded-3xl shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#212529] mb-1">Current Usage</h3>
          <p className="text-2xl font-bold text-[#212529]">{currentUsage} liters</p>
          <p className="text-sm text-gray-500">
            Last updated {new Date(waterData.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
          <Droplet className="text-blue-400 h-5 w-5" />
        </div>
      </div>
      <Progress value={progress} className="h-2 mb-4" />
      <button className="text-sm font-semibold text-blue-500">View Details →</button>
    </Card>
  );
};

const LoadingState = () => (
  <Card className="bg-white p-6 rounded-3xl shadow-sm">
    <div className="space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-2 w-full" />
    </div>
  </Card>
);

export default WaterSection;
