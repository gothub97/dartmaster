"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, checkUser } = useAuth();
  const { profile, loadProfile } = useUserProfile();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error in URL params (Appwrite adds error param on OAuth failure)
        const errorParam = searchParams.get('error');
        if (errorParam) {
          console.error("OAuth error from Appwrite:", errorParam);
          router.push(`/auth/login?error=${errorParam}`);
          return;
        }

        // Give Appwrite a moment to establish the session
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if user is now logged in
        const userExists = await checkUser();
        
        if (!user) {
          // If still no user after checking, session creation might have failed
          console.error("No user found after OAuth callback");
          router.push("/auth/login?error=session_failed");
          return;
        }
        
        // Load user profile to check if they need to set up their profile
        const profileExists = await loadProfile();
        
        if (!profileExists) {
          // New user, redirect to profile setup
          router.push("/profile?setup=true");
        } else {
          // Existing user, redirect to dashboard
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("OAuth callback error details:", {
          message: error.message,
          code: error.code,
          type: error.type,
          response: error.response
        });
        setError(error.message || "Authentication failed");
        
        // Redirect with more specific error
        setTimeout(() => {
          router.push(`/auth/login?error=oauth_failed&details=${encodeURIComponent(error.message || '')}`);
        }, 2000);
      }
    };

    handleCallback();
  }, [searchParams, user]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">
          {error ? "Authentication failed. Redirecting..." : "Completing sign in..."}
        </p>
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}