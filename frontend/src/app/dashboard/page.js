"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import ProfileButton from "@/components/layout/ProfileButton";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    winRate: 0,
    averageScore: 0,
    highestCheckout: 0,
    bullseyeCount: 0,
    perfectLegs: 0
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      router.push("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                </div>
                <span className="font-bold text-xl text-white">Dartmaster</span>
              </Link>
              
              <div className="hidden md:flex space-x-4">
                <Link href="/dashboard" className="text-white hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium transition">
                  Dashboard
                </Link>
                <Link href="/play" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">
                  Play
                </Link>
                <Link href="/practice" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">
                  Practice
                </Link>
                <Link href="/players" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">
                  Players
                </Link>
                <Link href="/profile" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">
                  Profile
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-400">Welcome back,</p>
                <p className="text-sm font-semibold text-white">{user.name || user.email}</p>
              </div>
              
              {/* Profile Button with Avatar */}
              <ProfileButton />
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition border border-red-500/30"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {user.name || "Player"}!
          </h1>
          <p className="text-gray-400">Ready to improve your dart game?</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link href="/play" className="group">
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-red-500/50 transition-all transform hover:scale-[1.02]">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Quick Play</h3>
              <p className="text-gray-400 text-sm">Start a new game of 501 or Cricket</p>
              <div className="mt-4 text-red-400 group-hover:text-red-300 flex items-center text-sm font-medium">
                Play Now
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          <Link href="/matches" className="group">
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-yellow-500/50 transition-all transform hover:scale-[1.02]">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Active Matches</h3>
              <p className="text-gray-400 text-sm">Resume your ongoing matches</p>
              <div className="mt-4 text-yellow-400 group-hover:text-yellow-300 flex items-center text-sm font-medium">
                View Matches
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          <Link href="/practice" className="group">
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all transform hover:scale-[1.02]">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Practice Mode</h3>
              <p className="text-gray-400 text-sm">Improve your accuracy and consistency</p>
              <div className="mt-4 text-purple-400 group-hover:text-purple-300 flex items-center text-sm font-medium">
                Start Training
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          <Link href="/tournaments" className="group">
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-blue-500/50 transition-all transform hover:scale-[1.02]">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Tournaments</h3>
              <p className="text-gray-400 text-sm">Join competitive tournaments</p>
              <div className="mt-4 text-blue-400 group-hover:text-blue-300 flex items-center text-sm font-medium">
                View Tournaments
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Your Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-black/40 backdrop-blur-xl rounded-xl p-4 border border-white/10">
              <p className="text-gray-400 text-sm mb-1">Games Played</p>
              <p className="text-2xl font-bold text-white">{stats.gamesPlayed}</p>
            </div>
            <div className="bg-black/40 backdrop-blur-xl rounded-xl p-4 border border-white/10">
              <p className="text-gray-400 text-sm mb-1">Win Rate</p>
              <p className="text-2xl font-bold text-white">{stats.winRate}%</p>
            </div>
            <div className="bg-black/40 backdrop-blur-xl rounded-xl p-4 border border-white/10">
              <p className="text-gray-400 text-sm mb-1">Avg Score</p>
              <p className="text-2xl font-bold text-white">{stats.averageScore}</p>
            </div>
            <div className="bg-black/40 backdrop-blur-xl rounded-xl p-4 border border-white/10">
              <p className="text-gray-400 text-sm mb-1">Highest Checkout</p>
              <p className="text-2xl font-bold text-white">{stats.highestCheckout}</p>
            </div>
            <div className="bg-black/40 backdrop-blur-xl rounded-xl p-4 border border-white/10">
              <p className="text-gray-400 text-sm mb-1">Bullseyes</p>
              <p className="text-2xl font-bold text-white">{stats.bullseyeCount}</p>
            </div>
            <div className="bg-black/40 backdrop-blur-xl rounded-xl p-4 border border-white/10">
              <p className="text-gray-400 text-sm mb-1">Perfect Legs</p>
              <p className="text-2xl font-bold text-white">{stats.perfectLegs}</p>
            </div>
          </div>
        </div>

        {/* Recent Matches */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Recent Matches</h2>
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-8 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="text-gray-400">No matches played yet</p>
              <Link href="/play" className="inline-flex items-center mt-4 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition">
                Play Your First Game
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}