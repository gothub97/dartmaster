"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { databases } from "@/lib/appwrite";
import { Query, ID } from "appwrite";
import SharedNavigation from "@/components/layout/SharedNavigation";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

// Predefined criteria types with their parameters
const CRITERIA_TYPES = {
  games_played: {
    label: "Games Played",
    params: ["count"],
    description: "Player must play at least X games"
  },
  games_won: {
    label: "Games Won",
    params: ["count"],
    description: "Player must win at least X games"
  },
  win_streak: {
    label: "Win Streak",
    params: ["count"],
    description: "Player must have X consecutive wins"
  },
  bullseyes: {
    label: "Bullseyes Hit",
    params: ["count"],
    description: "Player must hit X bullseyes total"
  },
  score_180: {
    label: "180 Scores",
    params: ["count"],
    description: "Player must score X perfect 180s"
  },
  average_score: {
    label: "Average Score",
    params: ["minScore", "minGames"],
    description: "Player must maintain X average over Y games"
  },
  checkout_percentage: {
    label: "Checkout Percentage",
    params: ["percentage", "minGames"],
    description: "Player must have X% checkout rate over Y games"
  },
  doubles_percentage: {
    label: "Doubles Accuracy",
    params: ["percentage", "minGames"],
    description: "Player must have X% doubles accuracy over Y games"
  },
  perfect_game: {
    label: "Perfect Game",
    params: [],
    description: "Player must complete a perfect game (9-dart finish)"
  },
  tournament_winner: {
    label: "Tournament Winner",
    params: ["place"],
    description: "Player must finish in top X of a tournament"
  },
  challenge_completed: {
    label: "Challenge Completed",
    params: ["count"],
    description: "Player must complete X challenges"
  },
  friends_count: {
    label: "Social - Friends",
    params: ["count"],
    description: "Player must have X friends"
  },
  matches_with_friends: {
    label: "Social - Friendly Matches",
    params: ["count"],
    description: "Player must play X matches with friends"
  },
  practice_hours: {
    label: "Practice Hours",
    params: ["hours"],
    description: "Player must practice for X hours"
  },
  daily_login: {
    label: "Daily Login Streak",
    params: ["days"],
    description: "Player must login for X consecutive days"
  }
};

export default function AdminBadgesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "🏆",
    category: "achievement",
    rarity: "common",
    points: 10,
    isActive: true,
    criteriaType: "games_played",
    criteriaParams: {}
  });

  useEffect(() => {
    if (profile && !profile.isAdmin) {
      router.push("/dashboard");
    }
  }, [profile, router]);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        "badges",
        [Query.orderDesc("$createdAt"), Query.limit(100)]
      );
      setBadges(response.documents);
    } catch (error) {
      console.error("Error loading badges:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateBadge = async (e) => {
    e.preventDefault();
    
    try {
      const criteria = {
        type: formData.criteriaType,
        params: formData.criteriaParams,
        description: CRITERIA_TYPES[formData.criteriaType].description
      };

      const badgeData = {
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        category: formData.category,
        rarity: formData.rarity,
        points: formData.points,
        isActive: formData.isActive,
        criteria: JSON.stringify(criteria)
      };

      if (editingBadge) {
        await databases.updateDocument(
          DATABASE_ID,
          "badges",
          editingBadge.$id,
          badgeData
        );
      } else {
        await databases.createDocument(
          DATABASE_ID,
          "badges",
          ID.unique(),
          badgeData
        );
      }

      setShowCreateForm(false);
      setEditingBadge(null);
      resetForm();
      loadBadges();
    } catch (error) {
      console.error("Error saving badge:", error);
      alert("Failed to save badge");
    }
  };

  const handleEditBadge = (badge) => {
    try {
      const criteria = JSON.parse(badge.criteria);
      setFormData({
        name: badge.name,
        description: badge.description || "",
        icon: badge.icon,
        category: badge.category,
        rarity: badge.rarity,
        points: badge.points,
        isActive: badge.isActive,
        criteriaType: criteria.type || "games_played",
        criteriaParams: criteria.params || {}
      });
      setEditingBadge(badge);
      setShowCreateForm(true);
    } catch (error) {
      console.error("Error parsing badge data:", error);
    }
  };

  const handleDeleteBadge = async (badgeId) => {
    if (!confirm("Are you sure you want to delete this badge?")) return;

    try {
      await databases.deleteDocument(DATABASE_ID, "badges", badgeId);
      loadBadges();
    } catch (error) {
      console.error("Error deleting badge:", error);
      alert("Failed to delete badge");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon: "🏆",
      category: "achievement",
      rarity: "common",
      points: 10,
      isActive: true,
      criteriaType: "games_played",
      criteriaParams: {}
    });
  };

  const handleCriteriaParamChange = (param, value) => {
    setFormData({
      ...formData,
      criteriaParams: {
        ...formData.criteriaParams,
        [param]: value
      }
    });
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "common": return "bg-gray-100 text-gray-800";
      case "rare": return "bg-blue-100 text-blue-800";
      case "epic": return "bg-purple-100 text-purple-800";
      case "legendary": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "achievement": return "bg-green-100 text-green-800";
      case "milestone": return "bg-blue-100 text-blue-800";
      case "skill": return "bg-orange-100 text-orange-800";
      case "social": return "bg-pink-100 text-pink-800";
      case "special": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (!profile?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-700 mb-4">You don't have permission to access this page</div>
          <Link href="/dashboard" className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNavigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Manage Badges</h1>
            <button
              onClick={() => {
                resetForm();
                setEditingBadge(null);
                setShowCreateForm(true);
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Badge</span>
            </button>
          </div>
          <p className="text-gray-500">Create and manage achievement badges for players</p>
        </div>

        {/* Create/Edit Badge Form */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingBadge ? "Edit Badge" : "Create New Badge"}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingBadge(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleCreateOrUpdateBadge} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Badge Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Icon (Emoji)</label>
                      <input
                        type="text"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        maxLength="2"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows="2"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="achievement">Achievement</option>
                        <option value="milestone">Milestone</option>
                        <option value="skill">Skill</option>
                        <option value="social">Social</option>
                        <option value="special">Special</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rarity</label>
                      <select
                        value={formData.rarity}
                        onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="common">Common</option>
                        <option value="rare">Rare</option>
                        <option value="epic">Epic</option>
                        <option value="legendary">Legendary</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                      <input
                        type="number"
                        value={formData.points}
                        onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        min="0"
                        max="1000"
                      />
                    </div>
                  </div>

                  {/* Criteria Configuration */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Award Criteria</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Criteria Type</label>
                      <select
                        value={formData.criteriaType}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          criteriaType: e.target.value,
                          criteriaParams: {} // Reset params when type changes
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {Object.entries(CRITERIA_TYPES).map(([key, config]) => (
                          <option key={key} value={key}>{config.label}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {CRITERIA_TYPES[formData.criteriaType].description}
                      </p>
                    </div>

                    {/* Dynamic parameter inputs based on criteria type */}
                    {CRITERIA_TYPES[formData.criteriaType].params.length > 0 && (
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        {CRITERIA_TYPES[formData.criteriaType].params.map(param => (
                          <div key={param}>
                            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                              {param.replace(/_/g, ' ')}
                            </label>
                            <input
                              type="number"
                              value={formData.criteriaParams[param] || ''}
                              onChange={(e) => handleCriteriaParamChange(param, parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              placeholder={param === 'percentage' ? '0-100' : 'Enter value'}
                              required
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      Badge is active (can be earned by players)
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setEditingBadge(null);
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      {editingBadge ? "Update Badge" : "Create Badge"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Badges Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-2 border-gray-300 rounded-full animate-spin border-t-purple-600"></div>
          </div>
        ) : badges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {badges.map((badge) => {
              let criteria = null;
              try {
                criteria = JSON.parse(badge.criteria);
              } catch (e) {
                criteria = { type: "unknown", params: {} };
              }

              return (
                <div key={badge.$id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-4xl">{badge.icon}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{badge.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(badge.category)}`}>
                            {badge.category}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getRarityColor(badge.rarity)}`}>
                            {badge.rarity}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEditBadge(badge)}
                        className="p-1 text-gray-400 hover:text-purple-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteBadge(badge.$id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {badge.description && (
                    <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Points:</span>
                      <span className="font-medium">{badge.points}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className={`font-medium ${badge.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                        {badge.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Criteria:</span>
                      <span className="font-medium text-xs">
                        {CRITERIA_TYPES[criteria.type]?.label || criteria.type}
                      </span>
                    </div>
                  </div>

                  {criteria.params && Object.keys(criteria.params).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        {Object.entries(criteria.params).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No badges created yet</h3>
            <p className="text-gray-500">Create your first badge to start rewarding players</p>
          </div>
        )}
      </main>
    </div>
  );
}