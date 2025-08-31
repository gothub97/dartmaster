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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 rounded-full animate-spin border-t-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-red-600 text-xl mb-4">{error}</div>
        <Link
          href="/players"
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition"
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="font-bold text-xl text-gray-900">Dartmaster</span>
              </Link>
              
              <nav className="hidden md:flex space-x-6">
                <Link href="/players" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
                  All Players
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/auth/login"
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition"
              >
                Sign In to Play
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
          {/* Background Banner */}
          <div className="h-32 bg-gradient-to-r from-orange-400 to-red-500"></div>
          
          {/* Profile Info */}
          <div className="px-8 pb-8">
            <div className="flex items-end -mt-16 mb-6">
              {/* Avatar */}
              <div className="w-32 h-32 bg-white rounded-full border-4 border-white overflow-hidden shadow-lg">
                {profile.avatarUrl ? (
                  <img 
                    src={profile.avatarUrl} 
                    alt={profile.username} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-orange-100">
                    <span className="text-orange-600 text-4xl font-bold">
                      {profile.username?.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="ml-6 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      @{profile.username}
                    </h1>
                    {profile.country && (
                      <p className="text-gray-600 mt-1">📍 {profile.country}</p>
                    )}
                    {profile.club && (
                      <p className="text-gray-600">🎯 {profile.club}</p>
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
                <p className="text-gray-700">{profile.bio}</p>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {profile.club && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Club</h3>
                  <p className="text-gray-900">{profile.club}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Member Since</h3>
                <p className="text-gray-900">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              {profile.socialLinks && Object.keys(profile.socialLinks).some(key => profile.socialLinks[key]) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Social</h3>
                  <div className="flex space-x-3">
                    {profile.socialLinks.twitter && (
                      <a
                        href={`https://twitter.com/${profile.socialLinks.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 transition"
                      >
                        Twitter
                      </a>
                    )}
                    {profile.socialLinks.instagram && (
                      <a
                        href={`https://instagram.com/${profile.socialLinks.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:text-pink-700 transition"
                      >
                        Instagram
                      </a>
                    )}
                    {profile.socialLinks.facebook && (
                      <a
                        href={`https://facebook.com/${profile.socialLinks.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:text-blue-800 transition"
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
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Game Statistics</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500">{stats.gamesPlayed || 0}</div>
                <div className="text-sm text-gray-600 mt-1">Games Played</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.wins || 0}</div>
                <div className="text-sm text-gray-600 mt-1">Wins</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{stats.winRate || 0}%</div>
                <div className="text-sm text-gray-600 mt-1">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.averageScore || 0}</div>
                <div className="text-sm text-gray-600 mt-1">Avg Score</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Matches */}
        {recentMatches.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Matches</h2>
            
            <div className="space-y-4">
              {recentMatches.map((match) => {
                const isWinner = match.winner === profile.userId;
                const gameState = match.gameState ? JSON.parse(match.gameState) : null;
                
                return (
                  <div
                    key={match.$id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div>
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${isWinner ? "bg-green-500" : "bg-red-500"}`}></div>
                        <span className="text-gray-900 font-medium">
                          {match.gameType === "501" ? "501" : match.gameType}
                        </span>
                        <span className="text-gray-600">
                          vs {match.players.length - 1} {match.players.length - 1 === 1 ? "player" : "players"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(match.finishedAt || match.$createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`font-bold ${isWinner ? "text-green-600" : "text-red-600"}`}>
                        {isWinner ? "Won" : "Lost"}
                      </div>
                      {gameState && gameState.players[profile.userId] && (
                        <div className="text-sm text-gray-600">
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
        <div className="mt-12 text-center bg-white rounded-lg border border-gray-200 p-8">
          <h3 className="text-xl text-gray-900 mb-4">Want to challenge {profile.username}?</h3>
          <Link
            href="/auth/register"
            className="inline-flex items-center px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition"
          >
            Sign Up to Play
          </Link>
        </div>
      </div>
    </div>
  );
}