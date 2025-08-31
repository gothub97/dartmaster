"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import FriendButton from "@/components/social/FriendButton";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { loadProfileByUsername } = useUserProfile();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentMatches, setRecentMatches] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      if (!params.username) {
        setError("Invalid profile URL");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Load profile
        const userProfile = await loadProfileByUsername(params.username);
        
        if (!userProfile) {
          setError("Profile not found");
          setLoading(false);
          return;
        }

        // Check visibility
        if (userProfile.visibility === "private") {
          setError("This profile is private");
          setLoading(false);
          return;
        }

        setProfile(userProfile);

        // Load statistics
        if (userProfile.stats) {
          setStats(userProfile.stats);
        }

        // Load recent matches (if public)
        if (userProfile.visibility === "public") {
          try {
            const matchesResponse = await databases.listDocuments(
              DATABASE_ID,
              "matches",
              [
                Query.equal("players", userProfile.userId),
                Query.equal("status", "finished"),
                Query.orderDesc("$createdAt"),
                Query.limit(5)
              ]
            );

            setRecentMatches(matchesResponse.documents);
          } catch (err) {
            console.error("Error loading matches:", err);
          }
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [params.username, loadProfileByUsername]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center">
        <div className="text-red-400 text-xl mb-4">{error}</div>
        <Link
          href="/players"
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
        >
          Browse Players
        </Link>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation */}
      <nav className="relative z-10 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                </div>
                <span className="font-bold text-xl text-white">Dartmaster</span>
              </Link>
              
              <div className="hidden md:flex space-x-4">
                <Link href="/players" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">
                  All Players
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/auth/login"
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition border border-red-500/30"
              >
                Sign In to Play
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Header */}
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden mb-8">
          {/* Background Banner */}
          <div className="h-48 bg-gradient-to-r from-red-600/20 to-purple-600/20"></div>
          
          {/* Profile Info */}
          <div className="px-8 pb-8">
            <div className="flex items-end -mt-16 mb-6">
              {/* Avatar */}
              <div className="w-32 h-32 bg-black/60 rounded-2xl border-4 border-black/40 overflow-hidden">
                {profile.avatarUrl ? (
                  <img 
                    src={profile.avatarUrl} 
                    alt={profile.username} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-purple-600">
                    <span className="text-white text-4xl font-bold">
                      {profile.username?.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="ml-6 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white">
                      @{profile.username}
                    </h1>
                    {profile.country && (
                      <p className="text-gray-400 mt-1">📍 {profile.country}</p>
                    )}
                    {profile.club && (
                      <p className="text-gray-400">🎯 {profile.club}</p>
                    )}
                  </div>
                  
                  {/* Friend Button */}
                  <div className="mt-2">
                    <FriendButton userId={profile.userId} />
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mb-6">
                <p className="text-white">{profile.bio}</p>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {profile.club && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Club</h3>
                  <p className="text-white">{profile.club}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Member Since</h3>
                <p className="text-white">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              {profile.socialLinks && Object.keys(profile.socialLinks).some(key => profile.socialLinks[key]) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Social</h3>
                  <div className="flex space-x-3">
                    {profile.socialLinks.twitter && (
                      <a
                        href={`https://twitter.com/${profile.socialLinks.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition"
                      >
                        Twitter
                      </a>
                    )}
                    {profile.socialLinks.instagram && (
                      <a
                        href={`https://instagram.com/${profile.socialLinks.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-400 hover:text-pink-300 transition"
                      >
                        Instagram
                      </a>
                    )}
                    {profile.socialLinks.facebook && (
                      <a
                        href={`https://facebook.com/${profile.socialLinks.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-400 transition"
                      >
                        Facebook
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Game Statistics</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500">{stats.gamesPlayed || 0}</div>
                <div className="text-sm text-gray-400 mt-1">Games Played</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">{stats.wins || 0}</div>
                <div className="text-sm text-gray-400 mt-1">Wins</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500">{stats.winRate || 0}%</div>
                <div className="text-sm text-gray-400 mt-1">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-500">{stats.averageScore || 0}</div>
                <div className="text-sm text-gray-400 mt-1">Avg Score</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Matches */}
        {recentMatches.length > 0 && (
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Recent Matches</h2>
            
            <div className="space-y-4">
              {recentMatches.map((match) => {
                const isWinner = match.winner === profile.userId;
                const gameState = match.gameState ? JSON.parse(match.gameState) : null;
                
                return (
                  <div
                    key={match.$id}
                    className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-white/10"
                  >
                    <div>
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${isWinner ? "bg-green-500" : "bg-red-500"}`}></div>
                        <span className="text-white font-medium">
                          {match.gameType === "501" ? "501" : match.gameType}
                        </span>
                        <span className="text-gray-400">
                          vs {match.players.length - 1} {match.players.length - 1 === 1 ? "player" : "players"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(match.finishedAt || match.$createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`font-bold ${isWinner ? "text-green-400" : "text-red-400"}`}>
                        {isWinner ? "Won" : "Lost"}
                      </div>
                      {gameState && gameState.players[profile.userId] && (
                        <div className="text-sm text-gray-400">
                          Score: {gameState.players[profile.userId].score}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <h3 className="text-xl text-white mb-4">Want to challenge {profile.username}?</h3>
          <Link
            href="/auth/register"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition"
          >
            Sign Up to Play
          </Link>
        </div>
      </div>
    </div>
  );
}