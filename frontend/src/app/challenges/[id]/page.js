"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import SharedNavigation from "@/components/layout/SharedNavigation";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function ChallengeDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    }
  }, [user, router]);

  useEffect(() => {
    if (params.id) {
      loadChallenge();
    }
  }, [params.id]);

  useEffect(() => {
    if (challenge && user) {
      loadUserChallengeStats();
    }
  }, [challenge, user]);

  const loadChallenge = async () => {
    try {
      setLoading(true);
      const response = await databases.getDocument(
        DATABASE_ID,
        "challenges",
        params.id
      );
      setChallenge(response);
      
      // Parse participants
      try {
        const participantsList = JSON.parse(response.participants || "[]");
        setParticipants(participantsList);
      } catch (e) {
        setParticipants([]);
      }
      
      // Parse leaderboard
      try {
        const leaderboardData = JSON.parse(response.leaderboard || "[]");
        setLeaderboard(leaderboardData.sort((a, b) => b.score - a.score));
      } catch (e) {
        setLeaderboard([]);
      }
    } catch (error) {
      console.error("Error loading challenge:", error);
      router.push("/challenges");
    } finally {
      setLoading(false);
    }
  };

  const loadUserChallengeStats = async () => {
    // Load user's matches during the challenge period
    try {
      const startDate = new Date(challenge.startDate).toISOString();
      const endDate = new Date(challenge.endDate).toISOString();
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        "matches",
        [
          Query.equal("userId", user.$id),
          Query.equal("status", "completed"),
          Query.greaterThanEqual("startedAt", startDate),
          Query.lessThanEqual("startedAt", endDate),
          Query.orderDesc("startedAt"),
          Query.limit(100)
        ]
      );
      
      // Calculate stats based on challenge type
      let stats = calculateChallengeStats(response.documents, challenge.type);
      setUserStats(stats);
      
      // Update leaderboard if user has participated
      if (stats.gamesPlayed > 0) {
        updateLeaderboard(stats);
      }
    } catch (error) {
      console.error("Error loading user challenge stats:", error);
    }
  };

  const calculateChallengeStats = (matches, challengeType) => {
    let totalScore = 0;
    let highestScore = 0;
    let gamesPlayed = 0;
    let gamesWon = 0;
    let total180s = 0;
    let totalBullseyes = 0;

    matches.forEach(match => {
      try {
        const state = JSON.parse(match.currentState);
        gamesPlayed++;
        
        if (state.winner && state.winner.userId === user.$id) {
          gamesWon++;
        }
        
        // Get player stats from the match
        const player = state.players.find(p => p.userId === user.$id);
        if (player && player.stats) {
          totalScore += player.stats.totalScore || 0;
          if (player.stats.totalScore > highestScore) {
            highestScore = player.stats.totalScore;
          }
          total180s += (player.stats.total180s || 0);
          totalBullseyes += (player.stats.bullseyeCount || 0);
        }
      } catch (e) {
        console.error("Error parsing match data:", e);
      }
    });

    const averageScore = gamesPlayed > 0 ? Math.round(totalScore / gamesPlayed) : 0;
    
    // Parse scoring rules
    let challengeScore = 0;
    let scoringConfig = null;
    
    try {
      const rules = JSON.parse(challenge.rules);
      if (rules.scoring) {
        scoringConfig = rules.scoring;
      }
    } catch (e) {
      // Fallback to legacy scoring
    }
    
    if (scoringConfig) {
      // Use structured scoring configuration
      const config = scoringConfig.config || {};
      
      switch (scoringConfig.type) {
        case "points":
          // Points-based scoring with configurable point values
          challengeScore = 
            (gamesWon * (config.winPoints || 10)) +
            (gamesPlayed * (config.gamePoints || 1)) +
            (totalBullseyes * (config.bullseyePoints || 5)) +
            (total180s * (config.score180Points || 10));
          
          // Add high score bonus if applicable
          if (highestScore >= 170 && config.highScoreBonus) {
            challengeScore += config.highScoreBonus;
          }
          break;
          
        case "wins":
          // Wins-based scoring
          challengeScore = gamesWon * (config.winPoints || 1);
          break;
          
        case "average":
          // Average score with optional multiplier
          challengeScore = Math.round(averageScore * (config.scoreMultiplier || 1));
          break;
          
        case "bullseye":
          // Bullseye count scoring
          challengeScore = totalBullseyes * (config.bullseyePoints || 1);
          break;
          
        default:
          // Custom or fallback to average
          challengeScore = averageScore;
      }
      
      // Check minimum games requirement
      if (config.minGamesRequired && gamesPlayed < config.minGamesRequired) {
        challengeScore = 0; // Not eligible yet
      }
    } else {
      // Legacy scoring based on challenge type
      switch (challengeType) {
        case "tournament":
          challengeScore = averageScore;
          break;
        case "daily":
        case "weekly":
          challengeScore = (gamesWon * 3) + gamesPlayed + (total180s * 5);
          break;
        default:
          challengeScore = averageScore;
      }
    }

    return {
      gamesPlayed,
      gamesWon,
      averageScore,
      highestScore,
      total180s,
      totalBullseyes,
      challengeScore
    };
  };

  const updateLeaderboard = async (stats) => {
    try {
      let currentLeaderboard = [...leaderboard];
      
      // Find or create user entry
      const userIndex = currentLeaderboard.findIndex(entry => entry.userId === user.$id);
      const userEntry = {
        userId: user.$id,
        username: profile?.username || user.name || user.email,
        score: stats.challengeScore,
        gamesPlayed: stats.gamesPlayed,
        averageScore: stats.averageScore,
        updatedAt: new Date().toISOString()
      };
      
      if (userIndex >= 0) {
        currentLeaderboard[userIndex] = userEntry;
      } else {
        currentLeaderboard.push(userEntry);
      }
      
      // Sort and update
      currentLeaderboard.sort((a, b) => b.score - a.score);
      setLeaderboard(currentLeaderboard);
      
      // Update in database
      await databases.updateDocument(
        DATABASE_ID,
        "challenges",
        challenge.$id,
        {
          leaderboard: JSON.stringify(currentLeaderboard)
        }
      );
    } catch (error) {
      console.error("Error updating leaderboard:", error);
    }
  };

  const handleRegister = async () => {
    if (!user || !challenge) return;
    
    setRegistering(true);
    try {
      const updatedParticipants = [
        ...participants,
        {
          userId: user.$id,
          username: profile?.username || user.name || user.email,
          joinedAt: new Date().toISOString(),
          score: 0
        }
      ];
      
      await databases.updateDocument(
        DATABASE_ID,
        "challenges",
        challenge.$id,
        {
          participants: JSON.stringify(updatedParticipants)
        }
      );
      
      setParticipants(updatedParticipants);
    } catch (error) {
      console.error("Error registering for challenge:", error);
      alert("Failed to register for challenge");
    } finally {
      setRegistering(false);
    }
  };


  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 rounded-full animate-spin border-t-orange-500"></div>
      </div>
    );
  }

  if (!challenge) return null;

  const now = new Date();
  const startDate = new Date(challenge.startDate);
  const endDate = new Date(challenge.endDate);
  const status = now < startDate ? "upcoming" : now > endDate ? "ended" : "active";
  const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
  const isParticipant = participants.some(p => p.userId === user.$id);

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNavigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/challenges" className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block">
            ← Back to challenges
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{challenge.name}</h1>
              <p className="text-gray-600">{challenge.description}</p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                status === "active" ? "bg-green-100 text-green-800" :
                status === "upcoming" ? "bg-blue-100 text-blue-800" :
                "bg-gray-100 text-gray-800"
              }`}>
                {status === "active" ? `Active - ${daysLeft} days left` :
                 status === "upcoming" ? "Upcoming" : "Ended"}
              </span>
              <div className="mt-2 text-sm text-gray-500">
                {participants.length} participants
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Challenge Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Registration/Status Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              {(status === "active" || status === "upcoming") && !isParticipant && (
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {status === "upcoming" ? "Pre-Register for This Challenge" : "Join This Challenge"}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {status === "upcoming" 
                      ? "Reserve your spot! You'll be notified when the challenge starts." 
                      : "Register now to start competing!"}
                  </p>
                  <button
                    onClick={handleRegister}
                    disabled={registering}
                    className={`px-6 py-3 ${
                      status === "upcoming" 
                        ? "bg-blue-600 hover:bg-blue-700" 
                        : "bg-orange-600 hover:bg-orange-700"
                    } text-white rounded-lg transition-colors font-medium disabled:opacity-50`}
                  >
                    {registering ? "Registering..." : status === "upcoming" ? "Pre-Register Now" : "Register Now"}
                  </button>
                </div>
              )}
              
              {status === "upcoming" && isParticipant && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">You're Pre-Registered!</h3>
                  <p className="text-gray-600 mb-2">
                    You'll be notified when the challenge starts on {startDate.toLocaleDateString()}
                  </p>
                  <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Starts in {Math.ceil((startDate - now) / (1000 * 60 * 60 * 24))} days
                  </div>
                </div>
              )}
              
              {status === "active" && isParticipant && userStats && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-orange-600">{userStats.challengeScore}</div>
                      <div className="text-sm text-gray-500">Challenge Points</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{userStats.gamesPlayed}</div>
                      <div className="text-sm text-gray-500">Games Played</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{userStats.averageScore}</div>
                      <div className="text-sm text-gray-500">Avg Score</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{userStats.gamesWon}</div>
                      <div className="text-sm text-gray-500">Wins</div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Play more games during the challenge period to improve your score!
                    </p>
                  </div>
                </div>
              )}
              
              {status === "upcoming" && (
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Challenge Starting Soon</h3>
                  <p className="text-gray-600">
                    Starts on {startDate.toLocaleDateString()} at {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              )}
              
              {status === "ended" && (
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Challenge Ended</h3>
                  <p className="text-gray-600">View the final results below</p>
                </div>
              )}
            </div>

            {/* Details Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Challenge Details</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Type</span>
                    <div className="font-medium text-gray-900 capitalize">{challenge.type}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Duration</span>
                    <div className="font-medium text-gray-900">
                      {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                {challenge.rules && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Rules & Scoring</h4>
                    {(() => {
                      let rulesText = challenge.rules;
                      let scoringInfo = null;
                      
                      try {
                        const parsed = JSON.parse(challenge.rules);
                        rulesText = parsed.text || "";
                        scoringInfo = parsed.scoring;
                      } catch (e) {
                        // Legacy format - just text
                      }
                      
                      return (
                        <>
                          {rulesText && (
                            <div className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded mb-3">
                              {rulesText}
                            </div>
                          )}
                          
                          {scoringInfo && (
                            <div className="bg-orange-50 border border-orange-200 p-3 rounded">
                              <h5 className="text-sm font-medium text-gray-700 mb-2">
                                Scoring System: {
                                  scoringInfo.type === "points" ? "Points Based" :
                                  scoringInfo.type === "wins" ? "Wins Based" :
                                  scoringInfo.type === "average" ? "Average Score" :
                                  scoringInfo.type === "bullseye" ? "Bullseye Count" :
                                  "Custom"
                                }
                              </h5>
                              
                              {scoringInfo.type === "points" && scoringInfo.config && (
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Per Win:</span>
                                    <span className="font-medium">{scoringInfo.config.winPoints} pts</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Per Game:</span>
                                    <span className="font-medium">{scoringInfo.config.gamePoints} pts</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Per Bullseye:</span>
                                    <span className="font-medium">{scoringInfo.config.bullseyePoints} pts</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Per 180:</span>
                                    <span className="font-medium">{scoringInfo.config.score180Points} pts</span>
                                  </div>
                                  {scoringInfo.config.highScoreBonus > 0 && (
                                    <div className="flex justify-between col-span-2">
                                      <span className="text-gray-600">High Score Bonus (170+):</span>
                                      <span className="font-medium">{scoringInfo.config.highScoreBonus} pts</span>
                                    </div>
                                  )}
                                  {scoringInfo.config.minGamesRequired > 0 && (
                                    <div className="col-span-2 text-amber-600 mt-1">
                                      ⚠️ Minimum {scoringInfo.config.minGamesRequired} games required
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {scoringInfo.type === "wins" && scoringInfo.config && (
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Points per Win:</span>
                                    <span className="font-medium">{scoringInfo.config.winPoints || 1} pts</span>
                                  </div>
                                  {scoringInfo.config.minGamesRequired > 0 && (
                                    <div className="text-amber-600">
                                      ⚠️ Minimum {scoringInfo.config.minGamesRequired} games required
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {scoringInfo.type === "average" && scoringInfo.config && (
                                <div className="space-y-1 text-xs">
                                  {scoringInfo.config.scoreMultiplier && scoringInfo.config.scoreMultiplier !== 1 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Score Multiplier:</span>
                                      <span className="font-medium">x{scoringInfo.config.scoreMultiplier}</span>
                                    </div>
                                  )}
                                  {scoringInfo.config.minGamesRequired > 0 && (
                                    <div className="text-amber-600">
                                      ⚠️ Minimum {scoringInfo.config.minGamesRequired} games required
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {scoringInfo.type === "bullseye" && scoringInfo.config && (
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Points per Bullseye:</span>
                                    <span className="font-medium">{scoringInfo.config.bullseyePoints || 1} pts</span>
                                  </div>
                                  {scoringInfo.config.minGamesRequired > 0 && (
                                    <div className="text-amber-600">
                                      ⚠️ Minimum {scoringInfo.config.minGamesRequired} games required
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
                
                {challenge.prizes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Prizes</h4>
                    <div className="text-sm text-gray-600 whitespace-pre-wrap bg-orange-50 p-3 rounded">
                      {challenge.prizes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Leaderboard */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Leaderboard</h3>
              
              {leaderboard.length > 0 ? (
                <div className="space-y-2">
                  {leaderboard.slice(0, 10).map((entry, index) => (
                    <div 
                      key={entry.userId}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        entry.userId === user.$id ? "bg-orange-50 border border-orange-200" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? "bg-yellow-400 text-white" :
                          index === 1 ? "bg-gray-300 text-white" :
                          index === 2 ? "bg-orange-400 text-white" :
                          "bg-gray-200 text-gray-600"
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {entry.username}
                            {entry.userId === user.$id && " (You)"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {entry.gamesPlayed} games
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{entry.score}</div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                    </div>
                  ))}
                  
                  {leaderboard.length > 10 && (
                    <div className="text-center pt-2">
                      <button className="text-sm text-orange-600 hover:text-orange-700">
                        View all {leaderboard.length} participants
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm">No scores yet</p>
                  <p className="text-xs mt-1">Be the first to play!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}