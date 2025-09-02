"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export const useStats = () => {
  const { user } = useAuth();
  const { profile, updateProfile } = useUserProfile();
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    gamesWon: 0,
    winRate: 0,
    averageScore: 0,
    highestCheckout: 0,
    bullseyeCount: 0,
    perfectLegs: 0,
    currentStreak: 0,
    totalPoints: 0,
    accuracy: 0,
    doublesHit: 0,
    triplesHit: 0,
    weeklyGames: 0,
    monthlyGames: 0,
    total180s: 0,
    bestFinish: 0,
    favoriteMode: "501",
    recentForm: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      calculateStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const calculateStats = async () => {
    if (!user || !user.$id) return;

    try {
      setLoading(true);

      // Get all matches for the user
      const matchesResponse = await databases.listDocuments(
        DATABASE_ID,
        "matches",
        [
          Query.equal("userId", user.$id),
          Query.orderDesc("finishedAt"),
          Query.limit(100)
        ]
      );

      const matches = matchesResponse.documents;

      // Calculate basic stats
      const calculatedStats = {
        gamesPlayed: matches.length,
        gamesWon: 0,
        winRate: 0,
        averageScore: 0,
        highestCheckout: 0,
        bullseyeCount: 0,
        perfectLegs: 0,
        currentStreak: 0,
        totalPoints: 0,
        accuracy: 0,
        doublesHit: 0,
        triplesHit: 0,
        weeklyGames: 0,
        monthlyGames: 0,
        total180s: 0,
        bestFinish: 0,
        favoriteMode: "501",
        recentForm: []
      };

      // Calculate time-based stats
      const now = new Date();
      const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

      // Process each match
      matches.forEach(match => {
        // Parse match state if available
        let matchState = null;
        try {
          if (match.currentState) {
            matchState = typeof match.currentState === 'string' 
              ? JSON.parse(match.currentState) 
              : match.currentState;
          }
        } catch (e) {
          console.error("Error parsing match state:", e);
        }

        // Count wins
        if (matchState && matchState.winner === user.$id) {
          calculatedStats.gamesWon++;
        }

        // Count recent games
        const matchDate = new Date(match.finishedAt || match.startedAt);
        if (matchDate >= oneWeekAgo) {
          calculatedStats.weeklyGames++;
        }
        if (matchDate >= oneMonthAgo) {
          calculatedStats.monthlyGames++;
        }

        // Extract detailed stats from match state
        if (matchState) {
          // Count 180s
          if (matchState.stats && matchState.stats[user.$id]) {
            const userStats = matchState.stats[user.$id];
            calculatedStats.total180s += userStats.total180s || 0;
            calculatedStats.bullseyeCount += userStats.bullseyes || 0;
            calculatedStats.totalPoints += userStats.totalPoints || 0;
            
            // Track highest checkout
            if (userStats.highestCheckout > calculatedStats.highestCheckout) {
              calculatedStats.highestCheckout = userStats.highestCheckout;
            }

            // Track accuracy
            if (userStats.accuracy) {
              calculatedStats.accuracy = Math.max(calculatedStats.accuracy, userStats.accuracy);
            }
          }

          // Track recent form (last 5 games)
          if (calculatedStats.recentForm.length < 5) {
            calculatedStats.recentForm.push(matchState.winner === user.$id ? 'W' : 'L');
          }
        }
      });

      // Calculate win rate
      if (calculatedStats.gamesPlayed > 0) {
        calculatedStats.winRate = Math.round((calculatedStats.gamesWon / calculatedStats.gamesPlayed) * 100);
        calculatedStats.averageScore = Math.round(calculatedStats.totalPoints / calculatedStats.gamesPlayed);
      }

      // Calculate current streak
      let streak = 0;
      let streakType = null;
      for (let i = 0; i < calculatedStats.recentForm.length; i++) {
        if (i === 0) {
          streakType = calculatedStats.recentForm[i];
          streak = 1;
        } else if (calculatedStats.recentForm[i] === streakType) {
          streak++;
        } else {
          break;
        }
      }
      calculatedStats.currentStreak = streakType === 'W' ? streak : -streak;

      // Get practice session stats
      try {
        const practiceResponse = await databases.listDocuments(
          DATABASE_ID,
          "practice_sessions",
          [
            Query.equal("userId", user.$id),
            Query.orderDesc("startedAt"),
            Query.limit(50)
          ]
        );

        practiceResponse.documents.forEach(session => {
          if (session.stats) {
            try {
              const sessionStats = typeof session.stats === 'string' 
                ? JSON.parse(session.stats) 
                : session.stats;
              
              calculatedStats.bullseyeCount += sessionStats.bullseyes || 0;
              calculatedStats.total180s += sessionStats.total180s || 0;
              
              // Update accuracy from practice
              if (sessionStats.accuracy && sessionStats.accuracy > calculatedStats.accuracy) {
                calculatedStats.accuracy = sessionStats.accuracy;
              }

              // Update doubles/triples hit rate
              if (sessionStats.doublesHitRate) {
                calculatedStats.doublesHit = Math.max(calculatedStats.doublesHit, sessionStats.doublesHitRate);
              }
              if (sessionStats.triplesHitRate) {
                calculatedStats.triplesHit = Math.max(calculatedStats.triplesHit, sessionStats.triplesHitRate);
              }
            } catch (e) {
              console.error("Error parsing practice stats:", e);
            }
          }
        });
      } catch (error) {
        console.error("Error fetching practice sessions:", error);
      }

      // Keep real values - show 0 if no actual data exists
      // No fake defaults - show real stats only

      setStats(calculatedStats);

      // Update user profile with latest stats only if profile exists and stats have changed
      if (profile && calculatedStats.gamesPlayed > 0) {
        try {
          await updateProfile({
            stats: JSON.stringify({
              gamesPlayed: calculatedStats.gamesPlayed,
              gamesWon: calculatedStats.gamesWon,
              winRate: calculatedStats.winRate,
              averageScore: calculatedStats.averageScore,
              total180s: calculatedStats.total180s,
              bullseyeCount: calculatedStats.bullseyeCount,
              highestCheckout: calculatedStats.highestCheckout,
              currentStreak: calculatedStats.currentStreak,
              lastUpdated: new Date().toISOString()
            })
          });
        } catch (e) {
          console.error("Error updating profile stats:", e);
        }
      }

    } catch (error) {
      console.error("Error calculating stats:", error);
      // Keep existing stats on error, don't set fake values
      setStats(prev => ({
        ...prev
      }));
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    loading,
    refreshStats: calculateStats
  };
};