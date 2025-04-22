
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Bolt, Camera } from "lucide-react";

interface ElectricityReading {
  id: string;
  user_id: string;
  reading: number;
  created_at: string;
  updated_at: string;
}

const fetchElectricityData = async (): Promise<ElectricityReading | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');

  const { data, error } = await supabase
    .from('electricity_readings')
    .select()
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching electricity data:', error);
    return null;
  }
  
  return data;
};

const ElectricitySection = ({ variant = 'dashboard' }: { variant?: 'dashboard' | 'electricity' }) => {
  const { data: electricityData, isLoading } = useQuery({
    queryKey: ['electricity-reading'],
    queryFn: fetchElectricityData
  });

  if (isLoading) {
    return <LoadingState />;
  }

  // If no electricity readings and on dashboard, show "Add Reading" card
  if (!electricityData && variant === 'dashboard') {
    return (
      <Card className="bg-white p-6 rounded-3xl shadow-sm">
        <div className="flex flex-col items-center justify-center py-8">
          <Camera className="text-amber-200 w-12 h-12 mb-4" />
          <p className="text-gray-400 text-center mb-2">Take a photo of your electric meter</p>
          <button className="px-6 py-2 bg-amber-50 text-amber-500 rounded-full text-sm font-semibold">
            Add Reading
          </button>
        </div>
      </Card>
    );
  }

  const currentUsage = electricityData?.reading || 0;
  const maxUsage = 5; // Example threshold in kWh
  const progress = (currentUsage / maxUsage) * 100;

  return (
    <Card className="bg-white p-6 rounded-3xl shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#212529] mb-1">Current Usage</h3>
          <p className="text-2xl font-bold text-[#212529]">{currentUsage} kWh</p>
          <p className="text-sm text-gray-500">
            Last updated {new Date(electricityData?.created_at || '').toLocaleDateString()}
          </p>
        </div>
        <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
          <Bolt className="text-amber-400 h-5 w-5" />
        </div>
      </div>
      <Progress value={progress} className="h-2 mb-4" />
      <button className="text-sm font-semibold text-amber-500">View Details →</button>
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

export default ElectricitySection;
