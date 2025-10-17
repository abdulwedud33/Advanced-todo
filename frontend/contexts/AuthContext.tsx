"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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

  // Check for OAuth callback on mount
  useEffect(() => {
    const checkOAuthCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const authStatus = urlParams.get('auth');
      
      if (authStatus === 'success') {
        // Clear the URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        // Force a refresh of auth state
        checkAuth().then(() => {
          // Redirect to home after successful auth
          window.location.href = '/';
        });
      } else {
        // Regular auth check
        checkAuth();
      }
    };

    checkOAuthCallback();
  }, []);

  const checkAuth = async (): Promise<boolean> => {
    try {
      setLoading(true);
      console.log('Checking auth status...');
      const response = await fetch(`${baseUrl}/auth/status`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'X-Requested-With': 'XMLHttpRequest'
        },
        cache: 'no-store'
      });

      console.log('Auth status response:', response.status, response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Auth data received:', data);
        
        if (data.isAuthenticated && data.user) {
          console.log('User authenticated:', data.user);
          const userData = {
            _id: data.user._id,
            name: data.user.name,
            email: data.user.email
          };
          setUser(userData);
          return true;
        } else {
          console.log('User not authenticated');
          setUser(null);
          return false;
        }
      } else {
        console.log('Auth check failed with status:', response.status);
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
    return false;
  };

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      // Call backend logout first
      await fetch(`${baseUrl}/signOut`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'X-Requested-With': 'XMLHttpRequest'
        },
        cache: 'no-store',
      });
      
      // Clear local state after successful logout
      setUser(null);
      
      // Redirect to sign in page
      window.location.href = '/signIn';
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect even if logout fails
      window.location.href = '/signIn';
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
