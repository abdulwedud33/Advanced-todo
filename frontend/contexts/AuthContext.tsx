"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, authApi } from '@/utils/api';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for OAuth callback or existing token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token) {
          // Store the token from OAuth callback
          authApi.login(token);
          // Clear the URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        // Verify token if it exists
        if (localStorage.getItem('token')) {
          await verifyToken();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const verifyToken = async () => {
    try {
      const userData = await authApi.getCurrentUser();
      setUser({
        _id: userData.id,
        name: userData.name,
        email: userData.email
      });
      return true;
    } catch (error) {
      console.error('Error verifying token:', error);
      setUser(null);
      return false;
    }
  };

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
      window.location.href = '/';
    }
  };

  useEffect(() => {
    verifyToken();
  }, []);

  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth: verifyToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
