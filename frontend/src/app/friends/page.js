"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useFriends } from "@/contexts/FriendsContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useRouter } from "next/navigation";

export default function FriendsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    friends,
    friendRequests,
    sentRequests,
    loading: friendsLoading,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend
  } = useFriends();
  const { loadUserProfile } = useUserProfile();

  const [activeTab, setActiveTab] = useState("friends");
  const [friendProfiles, setFriendProfiles] = useState({});
  const [requestProfiles, setRequestProfiles] = useState({});
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  // Load profile data for friends and requests
  useEffect(() => {
    loadProfileData();
  }, [friends, friendRequests, sentRequests]);

  const loadProfileData = async () => {
    if (friendsLoading) return;
    
    setLoadingProfiles(true);
    try {
      const allUserIds = [
        ...friends,
        ...friendRequests.map(req => req.senderId),
        ...sentRequests.map(req => req.receiverId)
      ];

      const uniqueUserIds = [...new Set(allUserIds)];
      
      const profiles = {};
      
      for (const userId of uniqueUserIds) {
        try {
          const profile = await loadUserProfile(userId);
          if (profile) {
            profiles[userId] = profile;
          }
        } catch (error) {
          console.error(`Error loading profile for ${userId}:`, error);
        }
      }

      setFriendProfiles(profiles);
      setRequestProfiles(profiles);
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleAcceptRequest = async (request) => {
    try {
      const result = await acceptFriendRequest(request.$id);
      if (!result.success) {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const handleDeclineRequest = async (request) => {
    try {
      const result = await declineFriendRequest(request.$id);
      if (!result.success) {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error declining friend request:", error);
    }
  };

  const handleCancelRequest = async (request) => {
    try {
      const result = await cancelFriendRequest(request.receiverId);
      if (!result.success) {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error canceling friend request:", error);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!confirm("Are you sure you want to remove this friend?")) return;
    
    try {
      const result = await removeFriend(friendId);
      if (!result.success) {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  if (authLoading || friendsLoading) {
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
                <Link href="/dashboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">
                  Dashboard
                </Link>
                <Link href="/play" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">
                  Play
                </Link>
                <Link href="/players" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">
                  Players
                </Link>
                <Link href="/friends" className="text-white hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium transition">
                  Friends
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/profile" className="text-gray-300 hover:text-white text-sm">
                Profile
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Friends</h1>
          <p className="text-gray-400">Manage your friends and friend requests</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8">
          {[
            { id: "friends", label: "Friends", count: friends.length },
            { id: "requests", label: "Requests", count: friendRequests.length },
            { id: "sent", label: "Sent", count: sentRequests.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-medium transition ${
                activeTab === tab.id
                  ? "bg-red-600 text-white"
                  : "bg-black/40 text-gray-400 hover:text-white hover:bg-black/60"
              }`}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 min-h-[400px]">
          {activeTab === "friends" && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Your Friends</h2>
              {loadingProfiles ? (
                <div className="text-center text-gray-400 py-12">Loading friends...</div>
              ) : friends.length > 0 ? (
                <div className="grid gap-4">
                  {friends.map((friendId) => {
                    const profile = friendProfiles[friendId];
                    return (
                      <div key={friendId} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-black/60 rounded-xl overflow-hidden">
                            {profile?.avatarUrl ? (
                              <img 
                                src={profile.avatarUrl} 
                                alt={profile.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-purple-600">
                                <span className="text-white text-lg font-bold">
                                  {profile?.username?.charAt(0).toUpperCase() || "?"}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            {profile ? (
                              <>
                                <Link 
                                  href={`/players/${profile.username}`}
                                  className="font-semibold text-white hover:text-red-400 transition"
                                >
                                  @{profile.username}
                                </Link>
                                {profile.country && (
                                  <p className="text-sm text-gray-400">📍 {profile.country}</p>
                                )}
                              </>
                            ) : (
                              <div className="text-gray-400">Loading...</div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveFriend(friendId)}
                          className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition border border-red-500/30"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">You don't have any friends yet</div>
                  <Link 
                    href="/players"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition"
                  >
                    Find Players
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === "requests" && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Friend Requests</h2>
              {loadingProfiles ? (
                <div className="text-center text-gray-400 py-12">Loading requests...</div>
              ) : friendRequests.length > 0 ? (
                <div className="grid gap-4">
                  {friendRequests.map((request) => {
                    const profile = requestProfiles[request.senderId];
                    return (
                      <div key={request.$id} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-black/60 rounded-xl overflow-hidden">
                            {profile?.avatarUrl ? (
                              <img 
                                src={profile.avatarUrl} 
                                alt={profile.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-purple-600">
                                <span className="text-white text-lg font-bold">
                                  {profile?.username?.charAt(0).toUpperCase() || "?"}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            {profile ? (
                              <>
                                <Link 
                                  href={`/players/${profile.username}`}
                                  className="font-semibold text-white hover:text-red-400 transition"
                                >
                                  @{profile.username}
                                </Link>
                                <p className="text-sm text-gray-400">Sent you a friend request</p>
                              </>
                            ) : (
                              <div className="text-gray-400">Loading...</div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAcceptRequest(request)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(request)}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400">No pending friend requests</div>
                </div>
              )}
            </div>
          )}

          {activeTab === "sent" && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Sent Requests</h2>
              {loadingProfiles ? (
                <div className="text-center text-gray-400 py-12">Loading sent requests...</div>
              ) : sentRequests.length > 0 ? (
                <div className="grid gap-4">
                  {sentRequests.map((request) => {
                    const profile = requestProfiles[request.receiverId];
                    return (
                      <div key={request.$id} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-black/60 rounded-xl overflow-hidden">
                            {profile?.avatarUrl ? (
                              <img 
                                src={profile.avatarUrl} 
                                alt={profile.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-purple-600">
                                <span className="text-white text-lg font-bold">
                                  {profile?.username?.charAt(0).toUpperCase() || "?"}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            {profile ? (
                              <>
                                <Link 
                                  href={`/players/${profile.username}`}
                                  className="font-semibold text-white hover:text-red-400 transition"
                                >
                                  @{profile.username}
                                </Link>
                                <p className="text-sm text-gray-400">Request pending</p>
                              </>
                            ) : (
                              <div className="text-gray-400">Loading...</div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleCancelRequest(request)}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition"
                        >
                          Cancel
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400">No pending sent requests</div>
                </div>
              )}
            </div>
          )}
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