import React from 'react';
import MeterCameraView from '@/components/shared/MeterCameraView';

interface CameraViewProps {
  onClose: () => void;
}

const CameraView = ({ onClose }: CameraViewProps) => {
  return (
    <MeterCameraView 
      onClose={onClose} 
      meterType="water" 
      route="/water-monitoring" 
    />
  );
};

export default CameraView;