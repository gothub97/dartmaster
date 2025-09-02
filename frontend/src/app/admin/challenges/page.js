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

export default function AdminChallengesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "daily",
    startDate: "",
    endDate: "",
    rules: "",
    prizes: "",
    scoringType: "points",
    scoringConfig: {
      winPoints: 10,
      gamePoints: 1,
      bullseyePoints: 5,
      score180Points: 10,
      highScoreBonus: 20,
      minGamesRequired: 3
    }
  });

  useEffect(() => {
    if (profile && !profile.isAdmin) {
      router.push("/dashboard");
    }
  }, [profile, router]);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        "challenges",
        [Query.orderDesc("$createdAt"), Query.limit(50)]
      );
      setChallenges(response.documents);
    } catch (error) {
      console.error("Error loading challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    
    try {
      // Combine rules text with scoring configuration
      const scoringRules = {
        text: formData.rules,
        scoring: {
          type: formData.scoringType,
          config: formData.scoringConfig
        }
      };

      const challengeData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        rules: JSON.stringify(scoringRules),
        prizes: formData.prizes,
        createdBy: user.$id,
        participants: JSON.stringify([]),
        leaderboard: JSON.stringify([])
      };

      await databases.createDocument(
        DATABASE_ID,
        "challenges",
        ID.unique(),
        challengeData
      );

      setShowCreateForm(false);
      setFormData({
        name: "",
        description: "",
        type: "daily",
        startDate: "",
        endDate: "",
        rules: "",
        prizes: "",
        scoringType: "points",
        scoringConfig: {
          winPoints: 10,
          gamePoints: 1,
          bullseyePoints: 5,
          score180Points: 10,
          highScoreBonus: 20,
          minGamesRequired: 3
        }
      });
      loadChallenges();
    } catch (error) {
      console.error("Error creating challenge:", error);
      alert("Failed to create challenge");
    }
  };

  const handleDeleteChallenge = async (challengeId) => {
    if (!confirm("Are you sure you want to delete this challenge?")) return;

    try {
      await databases.deleteDocument(DATABASE_ID, "challenges", challengeId);
      loadChallenges();
    } catch (error) {
      console.error("Error deleting challenge:", error);
      alert("Failed to delete challenge");
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Manage Challenges</h1>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Challenge</span>
            </button>
          </div>
          <p className="text-gray-500">Create and manage platform challenges</p>
        </div>

        {/* Create Challenge Form */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Create New Challenge</h2>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleCreateChallenge} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Challenge Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows="3"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="tournament">Tournament</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rules Description</label>
                    <textarea
                      value={formData.rules}
                      onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows="3"
                      placeholder="Enter challenge rules description..."
                    />
                  </div>

                  {/* Scoring Configuration */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Scoring Type
                      </label>
                      <select
                        value={formData.scoringType}
                        onChange={(e) => setFormData({...formData, scoringType: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="points">Points Based</option>
                        <option value="wins">Wins Based</option>
                        <option value="average">Average Score</option>
                        <option value="bullseye">Bullseye Count</option>
                        <option value="custom">Custom Scoring</option>
                      </select>
                    </div>

                    {/* Scoring Configuration Details */}
                    {formData.scoringType === "points" && (
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <h4 className="text-sm font-medium text-gray-700">Points Configuration</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Win Points</label>
                            <input
                              type="number"
                              value={formData.scoringConfig.winPoints}
                              onChange={(e) => setFormData({
                                ...formData,
                                scoringConfig: {...formData.scoringConfig, winPoints: parseInt(e.target.value)}
                              })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Game Points</label>
                            <input
                              type="number"
                              value={formData.scoringConfig.gamePoints}
                              onChange={(e) => setFormData({
                                ...formData,
                                scoringConfig: {...formData.scoringConfig, gamePoints: parseInt(e.target.value)}
                              })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Bullseye Points</label>
                            <input
                              type="number"
                              value={formData.scoringConfig.bullseyePoints}
                              onChange={(e) => setFormData({
                                ...formData,
                                scoringConfig: {...formData.scoringConfig, bullseyePoints: parseInt(e.target.value)}
                              })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">180 Points</label>
                            <input
                              type="number"
                              value={formData.scoringConfig.score180Points}
                              onChange={(e) => setFormData({
                                ...formData,
                                scoringConfig: {...formData.scoringConfig, score180Points: parseInt(e.target.value)}
                              })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">High Score Bonus</label>
                            <input
                              type="number"
                              value={formData.scoringConfig.highScoreBonus}
                              onChange={(e) => setFormData({
                                ...formData,
                                scoringConfig: {...formData.scoringConfig, highScoreBonus: parseInt(e.target.value)}
                              })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Min Games Required</label>
                            <input
                              type="number"
                              value={formData.scoringConfig.minGamesRequired}
                              onChange={(e) => setFormData({
                                ...formData,
                                scoringConfig: {...formData.scoringConfig, minGamesRequired: parseInt(e.target.value)}
                              })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.scoringType === "wins" && (
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <h4 className="text-sm font-medium text-gray-700">Wins Configuration</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Points per Win</label>
                            <input
                              type="number"
                              value={formData.scoringConfig.winPoints || 1}
                              onChange={(e) => setFormData({
                                ...formData,
                                scoringConfig: {...formData.scoringConfig, winPoints: parseInt(e.target.value)}
                              })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Min Games Required</label>
                            <input
                              type="number"
                              value={formData.scoringConfig.minGamesRequired}
                              onChange={(e) => setFormData({
                                ...formData,
                                scoringConfig: {...formData.scoringConfig, minGamesRequired: parseInt(e.target.value)}
                              })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.scoringType === "average" && (
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <h4 className="text-sm font-medium text-gray-700">Average Score Configuration</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Min Games Required</label>
                            <input
                              type="number"
                              value={formData.scoringConfig.minGamesRequired}
                              onChange={(e) => setFormData({
                                ...formData,
                                scoringConfig: {...formData.scoringConfig, minGamesRequired: parseInt(e.target.value)}
                              })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Score Multiplier</label>
                            <input
                              type="number"
                              step="0.1"
                              value={formData.scoringConfig.scoreMultiplier || 1}
                              onChange={(e) => setFormData({
                                ...formData,
                                scoringConfig: {...formData.scoringConfig, scoreMultiplier: parseFloat(e.target.value)}
                              })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.scoringType === "bullseye" && (
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <h4 className="text-sm font-medium text-gray-700">Bullseye Configuration</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Points per Bullseye</label>
                            <input
                              type="number"
                              value={formData.scoringConfig.bullseyePoints || 1}
                              onChange={(e) => setFormData({
                                ...formData,
                                scoringConfig: {...formData.scoringConfig, bullseyePoints: parseInt(e.target.value)}
                              })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Min Games Required</label>
                            <input
                              type="number"
                              value={formData.scoringConfig.minGamesRequired}
                              onChange={(e) => setFormData({
                                ...formData,
                                scoringConfig: {...formData.scoringConfig, minGamesRequired: parseInt(e.target.value)}
                              })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prizes</label>
                    <textarea
                      value={formData.prizes}
                      onChange={(e) => setFormData({ ...formData, prizes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows="2"
                      placeholder="Enter prize information..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Create Challenge
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Challenges List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-2 border-gray-300 rounded-full animate-spin border-t-purple-600"></div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {challenges.length > 0 ? (
                  challenges.map((challenge) => {
                    const now = new Date();
                    const startDate = new Date(challenge.startDate);
                    const endDate = new Date(challenge.endDate);
                    const status = now < startDate ? "upcoming" : now > endDate ? "ended" : "active";
                    
                    return (
                      <tr key={challenge.$id}>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{challenge.name}</div>
                            {challenge.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">{challenge.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                            {challenge.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(challenge.startDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(challenge.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            status === "active" ? "bg-green-100 text-green-800" :
                            status === "upcoming" ? "bg-blue-100 text-blue-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => router.push(`/admin/challenges/${challenge.$id}`)}
                              className="text-purple-600 hover:text-purple-700"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteChallenge(challenge.$id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No challenges created yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}