"use client";

import { useState, useEffect } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import BadgeCard from "./BadgeCard";
import BadgeProgress from "./BadgeProgress";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function BadgeDisplay({ userId, showProgress = true }) {
  const [badges, setBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("earned");

  useEffect(() => {
    if (userId) {
      loadBadges();
    }
  }, [userId]);

  const loadBadges = async () => {
    try {
      setLoading(true);
      
      // Load all badges
      const badgesResponse = await databases.listDocuments(
        DATABASE_ID,
        "badges",
        [Query.equal("isActive", true), Query.limit(100)]
      );
      
      // Load user's earned badges - only if userId is valid
      let userBadgesResponse = { documents: [] };
      if (userId && userId.trim() !== '') {
        userBadgesResponse = await databases.listDocuments(
          DATABASE_ID,
          "user_badges",
          [Query.equal("userId", userId), Query.orderDesc("earnedAt")]
        );
      }
      
      setBadges(badgesResponse.documents);
      setUserBadges(userBadgesResponse.documents);
    } catch (error) {
      console.error("Error loading badges:", error);
    } finally {
      setLoading(false);
    }
  };

  // Merge badge data with user badge data
  const getEarnedBadges = () => {
    return userBadges.map(userBadge => {
      const badge = badges.find(b => b.$id === userBadge.badgeId);
      return {
        ...badge,
        earnedAt: userBadge.earnedAt,
        userBadgeId: userBadge.$id
      };
    }).filter(b => b);
  };

  const getUnearnedBadges = () => {
    return badges.filter(badge => 
      !userBadges.some(ub => ub.badgeId === badge.$id)
    );
  };

  const earnedBadges = getEarnedBadges();
  const unearnedBadges = getUnearnedBadges();

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "common": return "from-gray-400 to-gray-600";
      case "rare": return "from-blue-400 to-blue-600";
      case "epic": return "from-purple-400 to-purple-600";
      case "legendary": return "from-yellow-400 to-yellow-600";
      default: return "from-gray-400 to-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="w-8 h-8 border-2 border-gray-300 rounded-full animate-spin border-t-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{earnedBadges.length}</div>
          <div className="text-sm text-gray-500">Earned</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-400">{unearnedBadges.length}</div>
          <div className="text-sm text-gray-500">Available</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round((earnedBadges.length / (badges.length || 1)) * 100)}%
          </div>
          <div className="text-sm text-gray-500">Complete</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("earned")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "earned"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Earned ({earnedBadges.length})
        </button>
        <button
          onClick={() => setActiveTab("available")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "available"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Available ({unearnedBadges.length})
        </button>
        {showProgress && (
          <button
            onClick={() => setActiveTab("progress")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "progress"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Progress
          </button>
        )}
      </div>

      {/* Content */}
      {activeTab === "earned" && (
        <div>
          {earnedBadges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {earnedBadges.map((badge) => (
                <BadgeCard key={badge.userBadgeId} badge={badge} earned={true} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No badges earned yet</h3>
              <p className="text-gray-500">Start playing to earn your first badge!</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "available" && (
        <div>
          {unearnedBadges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {unearnedBadges.map((badge) => (
                <BadgeCard key={badge.$id} badge={badge} earned={false} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">All badges earned!</h3>
              <p className="text-gray-500">Congratulations! You've earned all available badges.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "progress" && showProgress && (
        <BadgeProgress userId={userId} badges={badges} userBadges={userBadges} />
      )}
    </div>
  );
}