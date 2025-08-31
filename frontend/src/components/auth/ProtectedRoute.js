"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Higher-order component that protects routes from unauthenticated access
 */
const ProtectedRoute = ({ children, fallback = null, redirectTo = "/auth/login" }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're not loading and there's no user
    if (!loading && !user) {
      // Get current path to redirect back after login
      const currentPath = window.location.pathname + window.location.search;
      const loginUrl = `${redirectTo}?returnUrl=${encodeURIComponent(currentPath)}`;
      router.push(loginUrl);
    }
  }, [user, loading, router, redirectTo]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show fallback component if user is not authenticated
  if (!user) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  // User is authenticated, show protected content
  return children;
};

export default ProtectedRoute;