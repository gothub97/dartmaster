"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import FriendButton from "@/components/social/FriendButton";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function PlayersPage() {
  const { user } = useAuth();
  const { searchProfiles } = useUserProfile();
  
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    country: "",
    club: ""
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0
  });

  useEffect(() => {
    loadProfiles();
  }, [pagination.page, filters]);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const result = await searchProfiles(searchTerm, {
        ...filters,
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit
      });
      
      setProfiles(result.profiles);
      setPagination(prev => ({ ...prev, total: result.total }));
    } catch (error) {
      console.error("Error loading profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadProfiles();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const countries = [
    "United States", "United Kingdom", "Canada", "Australia", "Germany",
    "Netherlands", "Belgium", "Ireland", "New Zealand", "South Africa",
    "France", "Spain", "Italy", "Sweden", "Norway", "Denmark"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation */}
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
                  <Link href="/dashboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">
                    Dashboard
                  </Link>
                  <Link href="/play" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">
                    Play
                  </Link>
                  <Link href="/players" className="text-white hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium transition">
                    Players
                  </Link>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {user && <NotificationBell />}
              
              {user ? (
                <Link 
                  href="/profile"
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition border border-red-500/30"
                >
                  My Profile
                </Link>
              ) : (
                <Link 
                  href="/auth/login"
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition border border-red-500/30"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Discover Players</h1>
          <p className="text-gray-400 text-lg">Find and connect with dart players from around the world</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                />
              </div>
              
              <select
                name="country"
                value={filters.country}
                onChange={handleFilterChange}
                className="px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500 transition"
              >
                <option value="">All Countries</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
              
              <button
                type="submit"
                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Players Grid */}
        {loading ? (
          <div className="text-center text-white">Loading players...</div>
        ) : profiles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {profiles.map((profile) => (
                <div
                  key={profile.$id}
                  className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-red-500/50 transition-all"
                >
                  {/* Profile Header */}
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-black/60 rounded-xl overflow-hidden">
                      {profile.avatarUrl ? (
                        <img 
                          src={profile.avatarUrl} 
                          alt={profile.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-purple-600">
                          <span className="text-white text-2xl font-bold">
                            {profile.username?.charAt(0).toUpperCase() || "?"}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex-1">
                      <Link 
                        href={`/players/${profile.username}`}
                        className="hover:text-red-400 transition"
                      >
                        <h3 className="text-lg font-semibold text-white">
                          @{profile.username}
                        </h3>
                      </Link>
                      {profile.country && (
                        <p className="text-sm text-gray-400">📍 {profile.country}</p>
                      )}
                    </div>
                  </div>

                    {/* Bio */}
                    {profile.bio && (
                      <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                        {profile.bio}
                      </p>
                    )}

                    {/* Stats */}
                    {profile.stats && (
                      <div className="flex justify-between text-center">
                        <div>
                          <div className="text-xl font-bold text-red-500">
                            {profile.stats.gamesPlayed || 0}
                          </div>
                          <div className="text-xs text-gray-500">Games</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-green-500">
                            {profile.stats.wins || 0}
                          </div>
                          <div className="text-xs text-gray-500">Wins</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-yellow-500">
                            {profile.stats.winRate || 0}%
                          </div>
                          <div className="text-xs text-gray-500">Win Rate</div>
                        </div>
                      </div>
                    )}

                  {/* Club */}
                  {profile.club && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-sm text-gray-400">
                        🎯 {profile.club}
                      </p>
                    </div>
                  )}

                  {/* Friend Button */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <FriendButton userId={profile.userId} className="w-full text-sm" />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white hover:bg-black/60 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-2">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                        className={`w-10 h-10 rounded-lg transition ${
                          pagination.page === pageNum
                            ? "bg-red-600 text-white"
                            : "bg-black/40 border border-white/10 text-white hover:bg-black/60"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {totalPages > 5 && (
                    <>
                      <span className="text-gray-400">...</span>
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: totalPages }))}
                        className={`w-10 h-10 rounded-lg transition ${
                          pagination.page === totalPages
                            ? "bg-red-600 text-white"
                            : "bg-black/40 border border-white/10 text-white hover:bg-black/60"
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
                  disabled={pagination.page === totalPages}
                  className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white hover:bg-black/60 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <p className="text-gray-400 text-lg mb-4">No players found</p>
            {!user && (
              <Link
                href="/auth/register"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition"
              >
                Be the First to Join!
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}