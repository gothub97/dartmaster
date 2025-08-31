"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";

export default function ProfileButton() {
  const { user } = useAuth();
  const { profile } = useUserProfile();

  console.log("ProfileButton - user:", user?.$id, "profile:", profile?.username, "avatarUrl:", profile?.avatarUrl);

  if (!user) return null;

  return (
    <Link
      href="/profile"
      className="flex items-center space-x-2 px-3 py-2 bg-black/40 hover:bg-black/60 rounded-lg transition border border-white/10"
      title="View Profile"
    >
      <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-red-500 to-purple-600">
        {profile?.avatarUrl ? (
          <img 
            src={profile.avatarUrl} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
        )}
      </div>
      <span className="text-sm text-white hidden sm:inline">Profile</span>
    </Link>
  );
}