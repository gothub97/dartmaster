"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useClub } from "@/contexts/ClubContext";
import SharedNavigation from "@/components/layout/SharedNavigation";
import ClubCard from "@/components/clubs/ClubCard";

export default function ClubsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    clubs, 
    userClubs, 
    loading, 
    error,
    loadClubs, 
    loadUserClubs,
    joinClub,
    isUserMemberOfClub 
  } = useClub();
  
  const [filter, setFilter] = useState("all"); // all, my-clubs, public, nearby
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [joiningClub, setJoiningClub] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    }
  }, [user, router]);

  useEffect(() => {
    loadClubs({
      country: selectedCountry || undefined,
      city: selectedCity || undefined,
      search: searchQuery || undefined
    });
  }, [selectedCountry, selectedCity]);

  const handleJoinClub = async (clubId) => {
    try {
      setJoiningClub(clubId);
      await joinClub(clubId);
      // Refresh clubs list
      await loadClubs();
    } catch (error) {
      console.error("Error joining club:", error);
      alert(error.message || "Failed to join club");
    } finally {
      setJoiningClub(null);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadClubs({
      search: searchQuery,
      country: selectedCountry || undefined,
      city: selectedCity || undefined
    });
  };

  const filteredClubs = filter === "my-clubs" 
    ? userClubs 
    : filter === "public"
    ? clubs.filter(club => club.isPublic)
    : clubs;

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dart Clubs</h1>
              <p className="text-gray-600 mt-1">Join clubs, compete together, and share your passion for darts</p>
            </div>
            <Link
              href="/clubs/create"
              className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Club
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-gray-900">{clubs.length}</div>
              <div className="text-sm text-gray-600">Total Clubs</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-orange-500">{userClubs.length}</div>
              <div className="text-sm text-gray-600">Your Clubs</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-gray-900">
                {clubs.filter(c => c.isPublic).length}
              </div>
              <div className="text-sm text-gray-600">Public Clubs</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-gray-900">
                {clubs.reduce((sum, club) => sum + (club.memberCount || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Total Members</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              {/* Tab Filters */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === "all"
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All Clubs
                </button>
                <button
                  onClick={() => setFilter("my-clubs")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === "my-clubs"
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  My Clubs ({userClubs.length})
                </button>
                <button
                  onClick={() => setFilter("public")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === "public"
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Public
                </button>
              </div>

              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Search clubs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="submit"
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>

              {/* Location Filters */}
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Countries</option>
                <option value="USA">USA</option>
                <option value="UK">UK</option>
                <option value="Germany">Germany</option>
                <option value="Netherlands">Netherlands</option>
                <option value="Australia">Australia</option>
                <option value="Canada">Canada</option>
              </select>

              {selectedCountry && (
                <input
                  type="text"
                  placeholder="City..."
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* Clubs Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredClubs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No clubs found</h3>
            <p className="text-gray-600 mb-4">
              {filter === "my-clubs" 
                ? "You haven't joined any clubs yet. Browse and join clubs to get started!"
                : "No clubs match your search criteria. Try adjusting your filters."}
            </p>
            {filter === "my-clubs" && (
              <button
                onClick={() => setFilter("all")}
                className="bg-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition"
              >
                Browse All Clubs
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map((club) => (
              <ClubCard
                key={club.$id}
                club={club}
                isUserMember={isUserMemberOfClub(club.$id)}
                onJoin={joiningClub === club.$id ? null : handleJoinClub}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {filteredClubs.length > 0 && filteredClubs.length % 20 === 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={() => loadClubs({ 
                offset: filteredClubs.length,
                country: selectedCountry || undefined,
                city: selectedCity || undefined,
                search: searchQuery || undefined
              })}
              className="bg-white text-gray-700 px-6 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition"
            >
              Load More Clubs
            </button>
          </div>
        )}
      </div>
    </div>
  );
}