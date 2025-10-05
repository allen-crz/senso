import React from 'react';

interface PageLoaderProps {
  message?: string;
  className?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  message = "Loading...",
  className = ""
}) => {
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-[#f5f6f7] ${className}`}>
      <div className="w-8 h-8 border-4 border-[#212529] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export const ComponentLoader: React.FC<{ message?: string }> = ({
  message = "Loading component..."
}) => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center space-y-3">
        <div className="w-8 h-8 border-3 border-muted rounded-full animate-spin border-t-primary"></div>
        <p className="text-muted-foreground text-xs">{message}</p>
      </div>
    </div>
  );
};

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="animate-pulse space-y-4 p-4">
      {/* Header skeleton */}
      <div className="h-8 bg-muted rounded w-3/4"></div>

      {/* Content skeleton */}
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
        <div className="h-4 bg-muted rounded w-4/6"></div>
      </div>

      {/* Card skeleton */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="h-6 bg-muted rounded w-1/2"></div>
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/3"></div>
      </div>
    </div>
  );
};

export default PageLoader;