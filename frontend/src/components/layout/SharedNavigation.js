"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import NotificationBell from "@/components/notifications/NotificationBell";
import ProfileButton from "@/components/layout/ProfileButton";
import AdminMenu from "@/components/admin/AdminMenu";

export default function SharedNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { profile } = useUserProfile();

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/play", label: "Play" },
    { href: "/practice", label: "Training" },
    { href: "/clubs", label: "Clubs" },
    { href: "/activities", label: "Activities" },
    { href: "/challenges", label: "Challenges" },
    { href: "/players", label: "Players" },
    { href: "/me/stats", label: "My Stats" },
  ];

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      router.push("/");
    }
  };

  const isActive = (href) => {
    if (href === "/dashboard" && pathname === "/dashboard") return true;
    if (href !== "/dashboard" && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span className="font-semibold text-gray-900 text-lg">Dartmaster</span>
            </Link>
          </div>

          {user && (
            <nav className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "text-gray-900 border-b-2 border-orange-500 pb-1"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <NotificationBell />
                {profile?.isAdmin && <AdminMenu />}
                <ProfileButton />
                <button 
                  onClick={handleLogout} 
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/auth/login"
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition"
                >
                  Sign In
                </Link>
                <Link 
                  href="/auth/register"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
