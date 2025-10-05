import React, { createContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface AuthContextType {
  user: any;
  preferences: any;
  loading: boolean;
  signOut: () => Promise<any>;
  refreshPreferences: () => void;
  isAuthenticated: boolean;
  hasProfile: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}
