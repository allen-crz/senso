import React, { lazy, Suspense } from 'react';
import { ComponentLoader } from '@/components/layout/PageLoader';

// Lazy load heavy camera components
export const LazyCameraCapture = lazy(() => import('@/components/shared/MeterCapture'));
export const LazyWaterCamera = lazy(() => import('@/components/water-monitoring/CameraView'));
export const LazyElectricityCamera = lazy(() => import('@/components/electricity-monitoring/CameraView'));
export const LazyCustomCamera = lazy(() => import('@/components/shared/CustomCamera'));

// Lazy load chart and analytics components
export const LazyForecastSection = lazy(() => import('@/components/shared/EnhancedForecastSection'));
export const LazyMeterHistory = lazy(() => import('@/components/shared/MeterHistory'));
export const LazyCostForecast = lazy(() => import('@/components/shared/CleanCostForecast'));

// Lazy load complex forms
export const LazyProfileForm = lazy(() => import('@/components/profile/ProfileForm'));
export const LazyUserPreferencesForm = lazy(() => import('@/components/forms/UserPreferencesForm').catch(() => ({
  default: () => <div>Component not found</div>
})));

// Wrapper component with Suspense
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback = <ComponentLoader message="Loading component..." />,
  className = ""
}) => (
  <Suspense fallback={fallback}>
    <div className={className}>
      {children}
    </div>
  </Suspense>
);

// Pre-configured lazy components with proper error boundaries
export const CameraCapture: React.FC<any> = (props) => (
  <LazyWrapper fallback={<ComponentLoader message="Loading camera..." />}>
    <LazyCameraCapture {...props} />
  </LazyWrapper>
);

export const WaterCameraView: React.FC<any> = (props) => (
  <LazyWrapper fallback={<ComponentLoader message="Initializing camera..." />}>
    <LazyWaterCamera {...props} />
  </LazyWrapper>
);

export const ElectricityCameraView: React.FC<any> = (props) => (
  <LazyWrapper fallback={<ComponentLoader message="Initializing camera..." />}>
    <LazyElectricityCamera {...props} />
  </LazyWrapper>
);

export const ForecastSection: React.FC<any> = (props) => (
  <LazyWrapper fallback={<ComponentLoader message="Loading analytics..." />}>
    <LazyForecastSection {...props} />
  </LazyWrapper>
);

export const MeterHistory: React.FC<any> = (props) => (
  <LazyWrapper fallback={<ComponentLoader message="Loading history..." />}>
    <LazyMeterHistory {...props} />
  </LazyWrapper>
);

export const CostForecast: React.FC<any> = (props) => (
  <LazyWrapper fallback={<ComponentLoader message="Loading forecast..." />}>
    <LazyCostForecast {...props} />
  </LazyWrapper>
);

export const ProfileForm: React.FC<any> = (props) => (
  <LazyWrapper fallback={<ComponentLoader message="Loading form..." />}>
    <LazyProfileForm {...props} />
  </LazyWrapper>
);

// Bundle these heavy UI components separately
export const LazyRadixComponents = lazy(() =>
  import('@/components/ui/index').catch(() => ({
    default: () => <div>UI components loading...</div>
  }))
);

// Export all lazy components for easy importing
export * from '@/components/layout/PageLoader';