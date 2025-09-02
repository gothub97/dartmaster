"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useFriends } from "@/contexts/FriendsContext";
import SharedNavigation from "@/components/layout/SharedNavigation";
import { useNotifications } from "@/contexts/NotificationContext";
import ActivityCard from "@/components/activity/ActivityCard";
import { useStats } from "@/hooks/useStats";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { friends, friendRequests, loading: friendsLoading } = useFriends();
  const { notifications } = useNotifications();
  const { stats, loading: statsLoading } = useStats();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [objectives, setObjectives] = useState({
    weeklyGamesGoal: 15,
    accuracyTarget: 60,
    doublesTarget: 40,
    practiceHoursGoal: 5
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  // Load objectives from profile
  useEffect(() => {
    if (profile?.objectives) {
      try {
        const parsed = JSON.parse(profile.objectives);
        // Check if parsed is valid
        if (parsed && typeof parsed === 'object') {
          setObjectives({
            weeklyGamesGoal: parsed?.weeklyGamesGoal ?? 15,
            accuracyTarget: parsed?.accuracyTarget ?? 60,
            doublesTarget: parsed?.doublesTarget ?? 40,
            practiceHoursGoal: parsed?.practiceHoursGoal ?? 5
          });
        }
      } catch (e) {
        console.error('Error parsing objectives:', e);
        // Keep default objectives on error
      }
    }
  }, [profile]);

  // Load challenges
  useEffect(() => {
    const loadChallenges = async () => {
      try {
        const now = new Date().toISOString();
        const response = await databases.listDocuments(
          DATABASE_ID,
          "challenges",
          [
            Query.greaterThan("endDate", now), // Not ended yet
            Query.orderAsc("startDate"),
            Query.limit(5)
          ]
        );
        setChallenges(response.documents);
      } catch (error) {
        console.error("Error loading challenges:", error);
      }
    };

    if (user) {
      loadChallenges();
    }
  }, [user]);

  // Load online friends with profiles
  useEffect(() => {
    const loadOnlineFriends = async () => {
      if (!friends || friends.length === 0) return;
      
      try {
        const friendProfiles = [];
        for (const friendId of friends.slice(0, 5)) {
          // Skip if friendId is invalid
          if (!friendId) continue;
          
          try {
            const response = await databases.listDocuments(
              DATABASE_ID,
              "user_profiles",
              [Query.equal("userId", friendId)]
            );
            
            if (response.documents.length > 0) {
              const profile = response.documents[0];
              // Check if online (active in last 5 minutes)
              const lastSeen = profile.updatedAt ? new Date(profile.updatedAt) : null;
              const isOnline = lastSeen && (new Date() - lastSeen) < 5 * 60 * 1000;
              
              friendProfiles.push({
                ...profile,
                isOnline,
                status: isOnline ? "online" : "offline"
              });
            }
          } catch (e) {
            console.error(`Error loading friend profile ${friendId}:`, e);
          }
        }
        setOnlineFriends(friendProfiles);
      } catch (error) {
        console.error("Error loading online friends:", error);
      }
    };

    loadOnlineFriends();
  }, [friends]);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      router.push("/");
    }
  };

  const loading = authLoading || profileLoading || statsLoading;
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 rounded-full animate-spin border-t-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNavigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-5rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            {/* Left Sidebar - Stats */}
            <div className="lg:col-span-3 space-y-4 lg:sticky lg:top-8 lg:h-fit">
              {/* Profile Card */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center space-x-4 mb-4">
                  {profile?.avatarUrl ? (
                    <img 
                      src={profile.avatarUrl} 
                      alt={profile.username}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-orange-600">
                        {profile?.username?.charAt(0) || user.name?.charAt(0) || user.email?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {profile?.username || user.name || 'Player'}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{profile?.club || user.email}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">This Week</span>
                    <span className="text-sm font-semibold text-gray-900">{stats.weeklyGames} games</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Win Rate</span>
                    <span className="text-sm font-semibold text-gray-900">{stats.winRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Avg Score</span>
                    <span className="text-sm font-semibold text-gray-900">{stats.averageScore || 0}</span>
                  </div>
                  {stats.currentStreak !== 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Current Streak</span>
                      <span className={`text-sm font-semibold ${stats.currentStreak > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(stats.currentStreak)}
                        {stats.currentStreak > 0 ? 'W' : 'L'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Your Progress</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Weekly Goal</span>
                      <span className="font-medium text-gray-900">{stats?.weeklyGames || 0}/{objectives?.weeklyGamesGoal || 15} games</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500" style={{ width: `${Math.min(100, ((stats?.weeklyGames || 0) / (objectives?.weeklyGamesGoal || 15)) * 100)}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Accuracy (Target: {objectives?.accuracyTarget || 60}%)</span>
                      <span className="font-medium text-gray-900">{Math.round(stats?.accuracy || 0)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${Math.min(100, ((stats?.accuracy || 0) / (objectives?.accuracyTarget || 60)) * 100)}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Doubles Hit Rate (Target: {objectives?.doublesTarget || 40}%)</span>
                      <span className="font-medium text-gray-900">{Math.round(stats?.doublesHit || 0)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, ((stats?.doublesHit || 0) / (objectives?.doublesTarget || 40)) * 100)}%` }}></div>
                    </div>
                  </div>
                  {stats?.total180s > 0 && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">180s This Month</span>
                        <span className="font-medium text-gray-900">{stats.total180s}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${Math.min(100, (stats.total180s / 10) * 100)}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Recent Badges</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-1">
                      <span className="text-xl">🎯</span>
                    </div>
                    <span className="text-xs text-gray-500">Bullseye</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-1">
                      <span className="text-xl">🔥</span>
                    </div>
                    <span className="text-xs text-gray-500">On Fire</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-1">
                      <span className="text-xl">⚡</span>
                    </div>
                    <span className="text-xs text-gray-500">Speed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Center - Activity Feed */}
            <div className="lg:col-span-6 h-full overflow-y-auto custom-scrollbar">
              <div className="mb-6 sticky top-0 bg-gray-50 z-10 pb-4">
                <h2 className="text-2xl font-bold text-gray-900">Activity Feed</h2>
                <p className="text-gray-500 mt-1">Latest from you and the community</p>
              </div>

              {/* Activity Cards */}
              <div className="space-y-4 pb-8">
                {notifications && notifications.length > 0 ? (
                  notifications.slice(0, 10).map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} />
                  ))
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No activities yet</h3>
                    <p className="text-gray-500 mb-6">Start playing to see your activities and connect with other players</p>
                    <Link 
                      href="/play"
                      className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                    >
                      Start Playing
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-3 space-y-4 lg:sticky lg:top-8 lg:h-fit">
              {/* Upcoming Challenges */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Challenges</h3>
                  <Link 
                    href="/challenges" 
                    className="text-xs text-orange-600 hover:text-orange-700"
                  >
                    View all →
                  </Link>
                </div>
                <div className="space-y-3">
                  {challenges.length > 0 ? (
                    challenges.slice(0, 3).map((challenge) => {
                      const now = new Date();
                      const startDate = new Date(challenge.startDate);
                      const endDate = new Date(challenge.endDate);
                      const status = now < startDate ? 'upcoming' : now > endDate ? 'ended' : 'active';
                      const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                      
                      let participants = [];
                      try {
                        participants = challenge.participants ? JSON.parse(challenge.participants) : [];
                      } catch (e) {
                        participants = [];
                      }
                      const isParticipant = participants.some(p => p.userId === user?.$id);
                      
                      return (
                        <Link
                          key={challenge.$id} 
                          href={`/challenges/${challenge.$id}`}
                          className={`block p-3 rounded-lg transition-colors ${
                            status === 'active' 
                              ? 'bg-orange-50 border border-orange-200 hover:bg-orange-100' 
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">{challenge.name}</span>
                            <span className={`text-xs ${
                              status === 'active' ? 'text-orange-600' : 
                              status === 'upcoming' ? 'text-blue-600' : 
                              'text-gray-500'
                            }`}>
                              {status === 'active' ? `${daysLeft}d left` : 
                               status === 'upcoming' ? 'Upcoming' : 
                               'Ended'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-500 truncate pr-2">
                              {challenge.description || `${challenge.type} challenge`}
                            </div>
                            {isParticipant && (
                              <span className="text-xs text-green-600">✓ Joined</span>
                            )}
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 mb-3">No active challenges</p>
                      <Link 
                        href="/challenges"
                        className="text-sm text-orange-600 hover:text-orange-700"
                      >
                        Browse challenges →
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Friends Online */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Friends Online</h3>
                <div className="space-y-3">
                  {onlineFriends.length > 0 ? (
                    onlineFriends.slice(0, 3).map((friend) => (
                      <div key={friend.$id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            {friend.avatarUrl ? (
                              <img 
                                src={friend.avatarUrl} 
                                alt={friend.username}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-xs font-semibold text-gray-600">
                                  {friend.username?.charAt(0) || '?'}
                                </span>
                              </div>
                            )}
                            {friend.isOnline && (
                              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{friend.username}</p>
                            <p className="text-xs text-gray-500">
                              {friend.isOnline ? 'Online' : 'Offline'}
                            </p>
                          </div>
                        </div>
                        <button className="text-xs text-orange-600 hover:text-orange-700">
                          {friend.isOnline ? 'Challenge' : 'Invite'}
                        </button>
                      </div>
                    ))
                  ) : friends.length > 0 ? (
                    <p className="text-sm text-gray-500">Loading friends...</p>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 mb-3">No friends yet</p>
                      <Link 
                        href="/friends"
                        className="text-sm text-orange-600 hover:text-orange-700"
                      >
                        Find Players →
                      </Link>
                    </div>
                  )}
                </div>
                {friends.length > 0 && (
                  <Link 
                    href="/friends"
                    className="block text-center text-sm text-gray-500 hover:text-gray-700 mt-4 pt-4 border-t border-gray-100"
                  >
                    View all friends ({friends.length}) →
                  </Link>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link 
                    href="/play"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-900">Quick Play</span>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  
                  <Link 
                    href="/practice"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-900">Practice Mode</span>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
      </main>
    </div>
  );
}
