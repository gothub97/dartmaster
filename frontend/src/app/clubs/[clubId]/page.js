"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useClub } from "@/contexts/ClubContext";
import SharedNavigation from "@/components/layout/SharedNavigation";

export default function ClubProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { 
    currentClub,
    loading,
    error,
    loadClub,
    joinClub,
    leaveClub,
    isUserMemberOfClub,
    getUserRoleInClub,
    getClubMembers,
    getClubActivities,
    getClubAnnouncements
  } = useClub();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [joiningClub, setJoiningClub] = useState(false);
  const [leavingClub, setLeavingClub] = useState(false);
  const [membershipId, setMembershipId] = useState(null);

  const clubId = params.clubId;
  const isMember = isUserMemberOfClub(clubId);
  const userRole = getUserRoleInClub(clubId);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    }
  }, [user, router]);

  useEffect(() => {
    if (clubId) {
      loadClub(clubId);
    }
  }, [clubId]);

  useEffect(() => {
    if (currentClub?.$id === clubId) {
      loadClubData();
    }
  }, [currentClub, activeTab]);

  const loadClubData = async () => {
    try {
      if (activeTab === "members" || activeTab === "overview") {
        const membersData = await getClubMembers(clubId);
        setMembers(membersData.memberships || []);
        
        // Find current user's membership ID
        const userMembership = membersData.memberships?.find(
          m => m.userId === user?.$id
        );
        if (userMembership) {
          setMembershipId(userMembership.$id);
        }
      }
      
      if (activeTab === "activities" || activeTab === "overview") {
        const activitiesData = await getClubActivities(clubId, 10);
        setActivities(activitiesData.documents || []);
      }
      
      if (activeTab === "announcements" || activeTab === "overview") {
        const announcementsData = await getClubAnnouncements(clubId, 5);
        setAnnouncements(announcementsData.documents || []);
      }
    } catch (error) {
      console.error("Error loading club data:", error);
    }
  };

  const handleJoinClub = async () => {
    try {
      setJoiningClub(true);
      await joinClub(clubId);
      await loadClub(clubId);
      await loadClubData();
    } catch (error) {
      console.error("Error joining club:", error);
      alert(error.message || "Failed to join club");
    } finally {
      setJoiningClub(false);
    }
  };

  const handleLeaveClub = async () => {
    if (!membershipId) {
      alert("Could not find your membership information");
      return;
    }
    
    if (!confirm("Are you sure you want to leave this club?")) {
      return;
    }
    
    try {
      setLeavingClub(true);
      await leaveClub(clubId, membershipId);
      router.push("/clubs");
    } catch (error) {
      console.error("Error leaving club:", error);
      alert(error.message || "Failed to leave club");
    } finally {
      setLeavingClub(false);
    }
  };

  if (loading && !currentClub) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SharedNavigation />
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || !currentClub) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SharedNavigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Club not found</h2>
            <p className="text-gray-600 mb-4">{error || "The club you're looking for doesn't exist."}</p>
            <Link
              href="/clubs"
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              Browse Clubs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stats = currentClub.clubStats || {
    totalGames: 0,
    avgAccuracy: 0,
    totalTrophies: 0,
    weeklyActive: 0
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link
          href="/clubs"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Clubs
        </Link>

        {/* Club Header */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="relative h-48 bg-gradient-to-br from-orange-400 to-orange-600">
            {currentClub.logoUrl && (
              <img 
                src={currentClub.logoUrl} 
                alt={currentClub.name}
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-2">{currentClub.name}</h1>
                {(currentClub.city || currentClub.country) && (
                  <div className="flex items-center justify-center text-white/90">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{[currentClub.city, currentClub.country].filter(Boolean).join(", ")}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              {currentClub.isPublic ? (
                <span className="bg-white/90 backdrop-blur text-gray-700 text-xs px-3 py-1 rounded-full">
                  Public
                </span>
              ) : (
                <span className="bg-gray-800/90 backdrop-blur text-white text-xs px-3 py-1 rounded-full">
                  Private
                </span>
              )}
              {userRole && (
                <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full capitalize">
                  {userRole}
                </span>
              )}
            </div>
          </div>

          {/* Club Stats Bar */}
          <div className="grid grid-cols-5 gap-4 p-6 border-b border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{currentClub.memberCount || 0}</div>
              <div className="text-sm text-gray-500">Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalGames}</div>
              <div className="text-sm text-gray-500">Total Games</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.avgAccuracy}%</div>
              <div className="text-sm text-gray-500">Avg Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalTrophies}</div>
              <div className="text-sm text-gray-500">Trophies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.weeklyActive}</div>
              <div className="text-sm text-gray-500">Weekly Active</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 flex items-center justify-between">
            <div className="flex gap-2">
              {isMember ? (
                <>
                  <Link
                    href={`/clubs/${clubId}/dashboard`}
                    className="bg-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition"
                  >
                    Member Dashboard
                  </Link>
                  {(userRole === "owner" || userRole === "captain") && (
                    <Link
                      href={`/clubs/${clubId}/settings`}
                      className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
                    >
                      Settings
                    </Link>
                  )}
                  <button
                    onClick={handleLeaveClub}
                    disabled={leavingClub || userRole === "owner"}
                    className="text-red-600 hover:text-red-700 px-4 py-2 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {leavingClub ? "Leaving..." : "Leave Club"}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleJoinClub}
                  disabled={joiningClub || (!currentClub.isPublic && currentClub.joinMethod === "invite")}
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {joiningClub ? "Joining..." : 
                   currentClub.joinMethod === "invite" ? "Invite Only" :
                   currentClub.joinMethod === "request" ? "Request to Join" : "Join Club"}
                </button>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              Created {new Date(currentClub.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {["overview", "members", "tournaments", "activities", "announcements"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium capitalize border-b-2 transition ${
                    activeTab === tab
                      ? "border-orange-500 text-orange-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {currentClub.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
                    <p className="text-gray-600">{currentClub.description}</p>
                  </div>
                )}

                {/* Recent Activities */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
                  {activities.length > 0 ? (
                    <div className="space-y-3">
                      {activities.slice(0, 5).map((activity) => (
                        <div key={activity.$id} className="flex items-start space-x-3 text-sm">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                          <div>
                            <p className="text-gray-600">
                              {activity.data?.message || activity.type.replace(/_/g, ' ')}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {new Date(activity.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No recent activities</p>
                  )}
                </div>

                {/* Latest Announcements */}
                {announcements.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Announcements</h3>
                    <div className="space-y-3">
                      {announcements.slice(0, 2).map((announcement) => (
                        <div key={announcement.$id} className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
                          <p className="text-gray-600 text-sm mt-1">{announcement.content}</p>
                          <p className="text-gray-400 text-xs mt-2">
                            {new Date(announcement.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Members Tab */}
            {activeTab === "members" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Members ({members.length})
                </h3>
                {members.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map((member) => (
                      <div key={member.$id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 font-semibold">
                            {member.userName?.charAt(0).toUpperCase() || "?"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{member.userName || "Unknown"}</p>
                          <p className="text-sm text-gray-500">
                            {member.roles?.join(", ") || "Member"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No members to display</p>
                )}
              </div>
            )}

            {/* Tournaments Tab */}
            {activeTab === "tournaments" && (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Club Tournaments</h3>
                <p className="text-gray-600">Tournament feature coming soon!</p>
              </div>
            )}

            {/* Activities Tab */}
            {activeTab === "activities" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All Activities</h3>
                {activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div key={activity.$id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-700">
                            {activity.data?.message || activity.type.replace(/_/g, ' ')}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No activities to display</p>
                )}
              </div>
            )}

            {/* Announcements Tab */}
            {activeTab === "announcements" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Announcements</h3>
                  {(userRole === "owner" || userRole === "captain") && (
                    <button className="text-orange-500 hover:text-orange-600 font-medium text-sm">
                      + New Announcement
                    </button>
                  )}
                </div>
                {announcements.length > 0 ? (
                  <div className="space-y-4">
                    {announcements.map((announcement) => (
                      <div key={announcement.$id} className="bg-gray-50 rounded-lg p-4">
                        {announcement.isPinned && (
                          <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mb-2">
                            Pinned
                          </span>
                        )}
                        <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
                        <p className="text-gray-600 mt-2">{announcement.content}</p>
                        <p className="text-gray-400 text-sm mt-3">
                          Posted on {new Date(announcement.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No announcements yet</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}