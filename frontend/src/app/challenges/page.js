"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import ProfileButton from "@/components/layout/ProfileButton";
import NotificationBell from "@/components/notifications/NotificationBell";
import ChallengeCard from "@/components/challenges/ChallengeCard";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function ChallengesPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, active, upcoming, ended, participating

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    }
  }, [user, router]);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        "challenges",
        [Query.orderDesc("startDate"), Query.limit(100)]
      );
      setChallenges(response.documents);
    } catch (error) {
      console.error("Error loading challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      router.push("/");
    }
  };

  const handleJoinChallenge = (challengeId) => {
    loadChallenges(); // Reload to update participant counts
  };

  const filteredChallenges = challenges.filter(challenge => {
    const now = new Date();
    const startDate = new Date(challenge.startDate);
    const endDate = new Date(challenge.endDate);
    const status = now < startDate ? "upcoming" : now > endDate ? "ended" : "active";
    
    let participants = [];
    try {
      participants = challenge.participants ? JSON.parse(challenge.participants) : [];
    } catch (e) {
      participants = [];
    }
    const isParticipant = participants.some(p => p.userId === user?.$id);

    switch (filter) {
      case "active":
        return status === "active";
      case "upcoming":
        return status === "upcoming";
      case "ended":
        return status === "ended";
      case "participating":
        return isParticipant;
      default:
        return true;
    }
  });

  const activeChallengesCount = challenges.filter(c => {
    const now = new Date();
    return now >= new Date(c.startDate) && now <= new Date(c.endDate);
  }).length;

  const participatingCount = challenges.filter(c => {
    let participants = [];
    try {
      participants = c.participants ? JSON.parse(c.participants) : [];
    } catch (e) {
      participants = [];
    }
    return participants.some(p => p.userId === user?.$id);
  }).length;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="font-semibold text-gray-900 text-lg">Dartmaster</span>
              </Link>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                Dashboard
              </Link>
              <Link href="/play" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                Play
              </Link>
              <Link href="/practice" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                Training
              </Link>
              <Link href="/activities" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                Activities
              </Link>
              <Link href="/challenges" className="text-sm font-medium text-gray-900 border-b-2 border-orange-500 pb-1">
                Challenges
              </Link>
              <Link href="/friends" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                Friends
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <NotificationBell />
              <ProfileButton />
              <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Challenges</h1>
          <p className="text-gray-500">Compete in tournaments and daily challenges to win prizes</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Challenges</p>
                <p className="text-2xl font-bold text-gray-900">{activeChallengesCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Participating In</p>
                <p className="text-2xl font-bold text-gray-900">{participatingCount}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Challenges</p>
                <p className="text-2xl font-bold text-gray-900">{challenges.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 mb-6 bg-white border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "all" 
                ? "bg-orange-500 text-white" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "active" 
                ? "bg-orange-500 text-white" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "upcoming" 
                ? "bg-orange-500 text-white" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter("participating")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "participating" 
                ? "bg-orange-500 text-white" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            My Challenges
          </button>
          <button
            onClick={() => setFilter("ended")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "ended" 
                ? "bg-orange-500 text-white" 
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Ended
          </button>
        </div>

        {/* Challenges Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-2 border-gray-300 rounded-full animate-spin border-t-orange-500"></div>
          </div>
        ) : filteredChallenges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredChallenges.map(challenge => (
              <ChallengeCard 
                key={challenge.$id} 
                challenge={challenge} 
                onJoin={handleJoinChallenge}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No challenges found</h3>
            <p className="text-gray-500">
              {filter === "participating" 
                ? "You haven't joined any challenges yet"
                : "No challenges match your current filter"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}