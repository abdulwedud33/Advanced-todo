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
        setLoading(true);
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token) {
          console.log('Token received from OAuth callback');
          // Store the token from OAuth callback
          authApi.login(token);
          // Clear the URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          // Verify the new token
          await verifyToken();
        } else if (localStorage.getItem('token')) {
          console.log('Found existing token, verifying...');
          // Verify existing token
          await verifyToken();
        } else {
          console.log('No token found');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid token
        authApi.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const verifyToken = async () => {
    try {
      console.log('Verifying token...');
      const userData = await authApi.getCurrentUser();
      
      if (userData && userData.id) {
        console.log('Token verified, user:', userData.email);
        setUser({
          _id: userData.id,
          name: userData.name,
          email: userData.email
        });
        return true;
      } else {
        console.log('Invalid user data received:', userData);
        throw new Error('Invalid user data');
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      // Clear invalid token
      authApi.logout();
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
