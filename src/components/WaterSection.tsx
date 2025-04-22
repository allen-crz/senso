
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const fetchWaterData = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');

  const { data, error } = await supabase
    .from('water_readings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
};

const WaterSection = () => {
  const { data: waterData, isLoading, error } = useQuery({
    queryKey: ['water-reading'],
    queryFn: fetchWaterData
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <Card className="bg-white p-6 rounded-3xl shadow-sm">
        <div className="text-center text-gray-500">
          No water readings available
        </div>
      </Card>
    );
  }

  const currentUsage = waterData?.reading || 0;
  const maxUsage = 100; // Example threshold
  const progress = (currentUsage / maxUsage) * 100;

  return (
    <Card className="bg-white p-6 rounded-3xl shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#212529] mb-1">Current Usage</h3>
          <p className="text-2xl font-bold text-[#212529]">{currentUsage} liters</p>
          <p className="text-sm text-gray-500">
            Last updated {new Date(waterData?.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
          <i className="fa-solid fa-droplet text-blue-400"></i>
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
