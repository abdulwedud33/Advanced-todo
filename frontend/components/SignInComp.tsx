"use client";

import { useState, useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const SignInComp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { user, loading, checkAuth } = useAuth();
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";

  // Handle OAuth callback and redirects
  useEffect(() => {
    // Check for OAuth success
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    
    if (authStatus === 'success') {
      // Force a refresh of auth state
      checkAuth().then(() => {
        router.push('/');
      });
    } else if (!loading && user) {
      // Regular redirect if already authenticated
      router.push('/');
    }
  }, [user, loading, router]);

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

  return (
    <>
      <div className="flex flex-col gap-6 justify-center items-center px-4 mt-12">
        <div className="w-full max-w-sm bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-2xl font-bold text-center mb-6">SignIn</h2>

          <button
            onClick={async (e) => {
              e.preventDefault();
              try {
                // Store the current URL to redirect back after login
                const redirectUrl = window.location.origin;
                localStorage.setItem('redirectAfterLogin', redirectUrl);
                
                // Redirect to backend OAuth endpoint
                window.location.href = `${baseUrl}/auth/google`;
              } catch (error) {
                console.error('Error during Google sign-in:', error);
                // Optionally show error to user
              }
            }}
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

          <form className="flex flex-col gap-4">
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
    </>
  );
};

export default SignInComp;
