
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@/config/permissions';

// This is the shape of the user data that is safe to expose on the client-side.
export interface ClientSafeUserData {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  schoolId?: string;
  schoolName?: string;
  appId?: string;
  studentAppId?: string; // For student role
}

interface AuthContextType {
  currentUser: ClientSafeUserData | null;
  setCurrentUser: (user: ClientSafeUserData | null) => void;
  isLoading: boolean;
  login: (userData: ClientSafeUserData) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<ClientSafeUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      // If parsing fails, it's better to clear the broken data.
      localStorage.removeItem('currentUser');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((userData: ClientSafeUserData) => {
    localStorage.setItem('currentUser', JSON.stringify(userData));
    setCurrentUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    // Redirect to login page after logout to ensure a clean state.
    router.push('/login');
  }, [router]);

  const value = {
    currentUser,
    setCurrentUser,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
