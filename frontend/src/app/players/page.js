"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import FriendButton from "@/components/social/FriendButton";
import NotificationBell from "@/components/notifications/NotificationBell";
import ProfileButton from "@/components/layout/ProfileButton";

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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="font-bold text-xl text-gray-900">Dartmaster</span>
              </Link>
              
              {user && (
                <nav className="hidden md:flex space-x-6">
                  <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
                    Dashboard
                  </Link>
                  <Link href="/play" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
                    Play
                  </Link>
                  <Link href="/practice" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
                    Practice
                  </Link>
                  <Link href="/activities" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
                    Activities
                  </Link>
                  <Link href="/players" className="text-sm font-medium text-gray-900 border-b-2 border-orange-500 pb-1">
                    Players
                  </Link>
                </nav>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <NotificationBell />
                  <ProfileButton />
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link 
                    href="/auth/login"
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition"
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/auth/register"
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Discover Players</h1>
          <p className="text-gray-600 text-lg">Find and connect with dart players from around the world</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>
              
              <select
                name="country"
                value={filters.country}
                onChange={handleFilterChange}
                className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              >
                <option value="">All Countries</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
              
              <button
                type="submit"
                className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Players Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-2 border-gray-300 rounded-full animate-spin border-t-orange-500"></div>
          </div>
        ) : profiles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {profiles.map((profile) => (
                <div
                  key={profile.$id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all"
                >
                  {/* Profile Header */}
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-white rounded-full overflow-hidden border-2 border-gray-200">
                      {profile.avatarUrl ? (
                        <img 
                          src={profile.avatarUrl} 
                          alt={profile.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-orange-100">
                          <span className="text-orange-600 text-2xl font-bold">
                            {profile.username?.charAt(0).toUpperCase() || "?"}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex-1">
                      <Link 
                        href={`/players/${profile.username}`}
                        className="hover:text-orange-600 transition"
                      >
                        <h3 className="text-lg font-semibold text-gray-900">
                          @{profile.username}
                        </h3>
                      </Link>
                      {profile.country && (
                        <p className="text-sm text-gray-600">📍 {profile.country}</p>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {profile.bio}
                    </p>
                  )}

                  {/* Stats */}
                  {profile.stats && (
                    <div className="grid grid-cols-3 gap-2 text-center mb-4">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-xl font-bold text-orange-500">
                          {profile.stats.gamesPlayed || 0}
                        </div>
                        <div className="text-xs text-gray-600">Games</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-xl font-bold text-green-600">
                          {profile.stats.wins || 0}
                        </div>
                        <div className="text-xs text-gray-600">Wins</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-xl font-bold text-yellow-600">
                          {profile.stats.winRate || 0}%
                        </div>
                        <div className="text-xs text-gray-600">Win Rate</div>
                      </div>
                    </div>
                  )}

                  {/* Club */}
                  {profile.club && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        🎯 {profile.club}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                    <Link
                      href={`/players/${profile.username}`}
                      className="flex-1 text-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
                    >
                      View Profile
                    </Link>
                    {user && (
                      <FriendButton userId={profile.userId} className="flex-1 text-sm" />
                    )}
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
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                            ? "bg-orange-500 text-white"
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
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
                            ? "bg-orange-500 text-white"
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
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
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg border border-gray-200 p-12 max-w-md mx-auto">
              <p className="text-gray-600 text-lg mb-6">No players found</p>
              {!user && (
                <Link
                  href="/auth/register"
                  className="inline-flex items-center px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition"
                >
                  Be the First to Join!
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}