"use client";

import { useState, useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";

const SignInComp = () => {
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { user, loading, checkAuth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle OAuth callback and redirects
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = searchParams.get('token');
        if (token) {
          // We have a token from OAuth callback
          const isAuthenticated = await checkAuth();
          if (isAuthenticated) {
            router.push('/');
          } else {
            setError('Failed to authenticate. Please try again.');
          }
        } else if (!loading && user) {
          // Already authenticated, redirect to home
          router.push('/');
        }
      } catch (err) {
        console.error('Auth error:', err);
        setError('An error occurred during authentication');
      }
    };

    checkAuthStatus();
  }, [user, loading, router, searchParams, checkAuth]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-800"></div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  const handleGoogleSignIn = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/google`;
  };

  return (
    <div className="flex flex-col gap-6 justify-center items-center px-4 mt-12">
      <div className="w-full max-w-sm bg-white shadow-lg rounded-xl p-6">
        <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 hover:cursor-pointer px-2 py-2 mb-4 bg-white border border-gray-300 rounded-xl shadow hover:shadow-md transition text-lg"
          >
            <FcGoogle size={24} />
            Continue with Google
          </button>

          <div className="flex items-center gap-2 mb-4">
            <hr className="flex-grow border-t border-gray-300" />
            <span className="text-sm text-gray-500">or</span>
            <hr className="flex-grow border-t border-gray-300" />
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!email || !password) {
              setError('Please fill in all fields');
              return;
            }
            try {
              const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
              });
              
              const data = await response.json();
              
              if (!response.ok) {
                throw new Error(data.message || 'Failed to sign in');
              }
              
              // Check if authentication was successful
              const isAuthenticated = await checkAuth();
              if (isAuthenticated) {
                router.push('/');
              } else {
                setError('Failed to authenticate. Please try again.');
              }
            } catch (err) {
              console.error('Sign in error:', err);
              const errorMessage = err instanceof Error ? err.message : 'An error occurred during sign in';
              setError(errorMessage);
            }
          }} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 hover:cursor-pointer rounded-md hover:bg-blue-700 transition"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  };

export default SignInComp;
