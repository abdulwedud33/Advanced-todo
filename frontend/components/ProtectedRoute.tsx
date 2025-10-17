"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (loading) return;
      
      if (requireAuth) {
        if (!isAuthenticated) {
          // Store the current path for redirecting after login
          const redirectPath = pathname === '/signIn' ? '/' : pathname;
          sessionStorage.setItem('redirectAfterLogin', redirectPath);
          router.push('/signIn');
          return;
        }
      } else if (isAuthenticated && ['/signIn', '/signUp'].includes(pathname)) {
        // If user is authenticated and trying to access auth pages, redirect to home
        const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/';
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectTo);
        return;
      }
      
      setIsAuthorized(true);
    };

    checkAuth();
  }, [user, loading, isAuthenticated, pathname, requireAuth, router]);

  if (loading || isAuthorized === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-800"></div>
      </div>
    );
  }

  if (!requireAuth && isAuthenticated) {
    return null; // Will redirect
  }

  return <>{children}</>;
};

export default ProtectedRoute;
