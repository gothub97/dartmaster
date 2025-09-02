"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { checkUser } = useAuth();
  const { profile, loadProfile } = useUserProfile();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if user is now logged in
        await checkUser();
        
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
        console.error("OAuth callback error:", error);
        router.push("/auth/login?error=oauth_failed");
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}