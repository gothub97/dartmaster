"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/notifications/NotificationBell";
import ProfileButton from "@/components/layout/ProfileButton";

export default function SharedNavigation({ currentPage = "" }) {
  const { user } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", active: currentPage === "dashboard" },
    { href: "/play", label: "Play", active: currentPage === "play" },
    { href: "/practice", label: "Practice", active: currentPage === "practice" },
    { href: "/activities", label: "Activities", active: currentPage === "activities" },
    { href: "/players", label: "Players", active: currentPage === "players" },
    { href: "/profile", label: "Profile", active: currentPage === "profile" }
  ];

  return (
    <nav className="relative z-10 bg-black/20 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
              </div>
              <span className="font-bold text-xl text-white">Dartmaster</span>
            </Link>
            
            {user && (
              <div className="hidden md:flex space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                      item.active
                        ? "text-white hover:text-red-400"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notification Bell */}
                <NotificationBell />
                
                {/* Profile Button */}
                <ProfileButton />
                
                {/* Mobile menu button - could be implemented later */}
                <div className="md:hidden">
                  {/* Mobile menu toggle would go here */}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/auth/login"
                  className="px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 rounded-lg text-sm font-medium transition border border-gray-500/30"
                >
                  Sign In
                </Link>
                <Link 
                  href="/auth/register"
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition border border-red-500/30"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}