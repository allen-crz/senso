import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/hooks/useAuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireProfile?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireProfile = false
}) => {
  const { user, loading, hasProfile, isAuthenticated } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f6f7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#212529] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireProfile && !hasProfile) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;