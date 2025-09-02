import { databases } from "@/lib/appwrite";
import { Query, ID } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export class BadgeEvaluator {
  constructor(userId) {
    this.userId = userId;
    this.userStats = null;
    this.userBadges = [];
    this.availableBadges = [];
  }

  // Load user's current badges
  async loadUserBadges() {
    // Skip if userId is invalid
    if (!this.userId || this.userId.trim() === '') {
      this.userBadges = [];
      return;
    }
    
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        "user_badges",
        [Query.equal("userId", this.userId)]
      );
      this.userBadges = response.documents;
    } catch (error) {
      console.error("Error loading user badges:", error);
      this.userBadges = [];
    }
  }

  // Load all active badges
  async loadAvailableBadges() {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        "badges",
        [Query.equal("isActive", true), Query.limit(100)]
      );
      this.availableBadges = response.documents;
    } catch (error) {
      console.error("Error loading available badges:", error);
      this.availableBadges = [];
    }
  }

  // Calculate user statistics
  async calculateUserStats() {
    // Skip if userId is invalid
    if (!this.userId || this.userId.trim() === '') {
      this.userStats = null;
      return null;
    }
    
    try {
      // Get user profile
      const profileResponse = await databases.listDocuments(
        DATABASE_ID,
        "user_profiles",
        [Query.equal("userId", this.userId), Query.limit(1)]
      );
      const profile = profileResponse.documents[0];

      // Get all user matches
      const matchesResponse = await databases.listDocuments(
        DATABASE_ID,
        "matches",
        [Query.equal("userId", this.userId), Query.equal("status", "completed"), Query.limit(500)]
      );
      const matches = matchesResponse.documents;

      // Calculate stats
      let stats = {
        gamesPlayed: matches.length,
        gamesWon: 0,
        currentWinStreak: 0,
        maxWinStreak: 0,
        totalBullseyes: 0,
        total180s: 0,
        totalScore: 0,
        totalDoubles: 0,
        totalDoublesAttempted: 0,
        perfectGames: 0,
        challengesCompleted: 0,
        friendsCount: 0,
        matchesWithFriends: 0,
        practiceHours: 0,
        averageScore: 0,
        checkoutPercentage: 0,
        doublesPercentage: 0
      };

      let tempWinStreak = 0;
      
      // Process matches
      matches.forEach(match => {
        try {
          const state = JSON.parse(match.currentState);
          
          // Check if won
          if (state.winner && state.winner.userId === this.userId) {
            stats.gamesWon++;
            tempWinStreak++;
            if (tempWinStreak > stats.maxWinStreak) {
              stats.maxWinStreak = tempWinStreak;
            }
          } else {
            tempWinStreak = 0;
          }

          // Get player stats from match
          const player = state.players?.find(p => p.userId === this.userId);
          if (player && player.stats) {
            stats.totalScore += player.stats.totalScore || 0;
            stats.totalBullseyes += player.stats.bullseyeCount || 0;
            stats.total180s += player.stats.total180s || 0;
            stats.totalDoubles += player.stats.doublesHit || 0;
            stats.totalDoublesAttempted += player.stats.doublesAttempted || 0;
            
            // Check for perfect game (9-dart finish)
            if (player.stats.dartsThrown === 9 && state.winner?.userId === this.userId) {
              stats.perfectGames++;
            }
          }

          // Check if match was with friends
          if (state.players?.length > 1) {
            const otherPlayers = state.players.filter(p => p.userId !== this.userId);
            // This would need friend checking logic
            // For now, count all multiplayer games
            if (otherPlayers.length > 0) {
              stats.matchesWithFriends++;
            }
          }
        } catch (e) {
          console.error("Error parsing match data:", e);
        }
      });

      stats.currentWinStreak = tempWinStreak;
      
      // Calculate percentages
      if (stats.gamesPlayed > 0) {
        stats.averageScore = Math.round(stats.totalScore / stats.gamesPlayed);
        stats.checkoutPercentage = Math.round((stats.gamesWon / stats.gamesPlayed) * 100);
      }
      
      if (stats.totalDoublesAttempted > 0) {
        stats.doublesPercentage = Math.round((stats.totalDoubles / stats.totalDoublesAttempted) * 100);
      }

      // Get challenges completed
      try {
        const challengesResponse = await databases.listDocuments(
          DATABASE_ID,
          "challenges",
          [Query.limit(100)]
        );
        
        let challengesCompleted = 0;
        challengesResponse.documents.forEach(challenge => {
          try {
            const participants = JSON.parse(challenge.participants || "[]");
            if (participants.some(p => p.userId === this.userId)) {
              const endDate = new Date(challenge.endDate);
              if (endDate < new Date()) {
                challengesCompleted++;
              }
            }
          } catch (e) {
            // Skip invalid challenges
          }
        });
        stats.challengesCompleted = challengesCompleted;
      } catch (error) {
        console.error("Error counting challenges:", error);
      }

      // Get friends count
      try {
        const friendsResponse = await databases.listDocuments(
          DATABASE_ID,
          "friends",
          [Query.equal("userId", this.userId), Query.equal("status", "accepted")]
        );
        stats.friendsCount = friendsResponse.total;
      } catch (error) {
        console.error("Error counting friends:", error);
      }

      // Calculate practice hours (approximate based on matches)
      stats.practiceHours = Math.round(stats.gamesPlayed * 0.25); // Assume 15 minutes per game

      this.userStats = stats;
      return stats;
    } catch (error) {
      console.error("Error calculating user stats:", error);
      return null;
    }
  }

  // Check if a specific badge criteria is met
  evaluateCriteria(badge) {
    if (!this.userStats) return false;

    try {
      const criteria = JSON.parse(badge.criteria);
      const params = criteria.params || {};

      switch (criteria.type) {
        case "games_played":
          return this.userStats.gamesPlayed >= (params.count || 0);

        case "games_won":
          return this.userStats.gamesWon >= (params.count || 0);

        case "win_streak":
          return this.userStats.maxWinStreak >= (params.count || 0);

        case "bullseyes":
          return this.userStats.totalBullseyes >= (params.count || 0);

        case "score_180":
          return this.userStats.total180s >= (params.count || 0);

        case "average_score":
          return this.userStats.averageScore >= (params.minScore || 0) &&
                 this.userStats.gamesPlayed >= (params.minGames || 0);

        case "checkout_percentage":
          return this.userStats.checkoutPercentage >= (params.percentage || 0) &&
                 this.userStats.gamesPlayed >= (params.minGames || 0);

        case "doubles_percentage":
          return this.userStats.doublesPercentage >= (params.percentage || 0) &&
                 this.userStats.gamesPlayed >= (params.minGames || 0);

        case "perfect_game":
          return this.userStats.perfectGames > 0;

        case "tournament_winner":
          // This would need tournament tracking
          return false;

        case "challenge_completed":
          return this.userStats.challengesCompleted >= (params.count || 0);

        case "friends_count":
          return this.userStats.friendsCount >= (params.count || 0);

        case "matches_with_friends":
          return this.userStats.matchesWithFriends >= (params.count || 0);

        case "practice_hours":
          return this.userStats.practiceHours >= (params.hours || 0);

        case "daily_login":
          // This would need login tracking
          return false;

        default:
          return false;
      }
    } catch (error) {
      console.error("Error evaluating criteria:", error);
      return false;
    }
  }

  // Award a badge to the user
  async awardBadge(badge) {
    try {
      // Check if already awarded
      const hasB = this.userBadges.some(ub => ub.badgeId === badge.$id);
      if (hasB) return false;

      // Create user badge record
      await databases.createDocument(
        DATABASE_ID,
        "user_badges",
        ID.unique(),
        {
          userId: this.userId,
          badgeId: badge.$id,
          earnedAt: new Date().toISOString(),
          progress: JSON.stringify(this.userStats)
        }
      );

      console.log(`Badge awarded: ${badge.name}`);
      return true;
    } catch (error) {
      console.error("Error awarding badge:", error);
      return false;
    }
  }

  // Main evaluation function
  async evaluateAndAwardBadges() {
    console.log("Evaluating badges for user:", this.userId);
    
    // Load necessary data
    await this.loadUserBadges();
    await this.loadAvailableBadges();
    await this.calculateUserStats();

    if (!this.userStats) {
      console.log("Could not calculate user stats");
      return [];
    }

    const newBadges = [];

    // Check each available badge
    for (const badge of this.availableBadges) {
      // Skip if already earned
      const alreadyEarned = this.userBadges.some(ub => ub.badgeId === badge.$id);
      if (alreadyEarned) continue;

      // Check if criteria is met
      if (this.evaluateCriteria(badge)) {
        const awarded = await this.awardBadge(badge);
        if (awarded) {
          newBadges.push(badge);
        }
      }
    }

    if (newBadges.length > 0) {
      console.log(`Awarded ${newBadges.length} new badges!`);
    }

    return newBadges;
  }

  // Get progress for unearnedges
  async getBadgeProgress() {
    await this.loadUserBadges();
    await this.loadAvailableBadges();
    await this.calculateUserStats();

    const progress = [];

    for (const badge of this.availableBadges) {
      const alreadyEarned = this.userBadges.some(ub => ub.badgeId === badge.$id);
      
      if (!alreadyEarned) {
        try {
          const criteria = JSON.parse(badge.criteria);
          const params = criteria.params || {};
          let currentProgress = 0;
          let targetProgress = 0;
          let percentage = 0;

          switch (criteria.type) {
            case "games_played":
              currentProgress = this.userStats.gamesPlayed;
              targetProgress = params.count || 0;
              break;
            case "games_won":
              currentProgress = this.userStats.gamesWon;
              targetProgress = params.count || 0;
              break;
            case "bullseyes":
              currentProgress = this.userStats.totalBullseyes;
              targetProgress = params.count || 0;
              break;
            case "score_180":
              currentProgress = this.userStats.total180s;
              targetProgress = params.count || 0;
              break;
            case "win_streak":
              currentProgress = this.userStats.maxWinStreak;
              targetProgress = params.count || 0;
              break;
            case "challenge_completed":
              currentProgress = this.userStats.challengesCompleted;
              targetProgress = params.count || 0;
              break;
            case "friends_count":
              currentProgress = this.userStats.friendsCount;
              targetProgress = params.count || 0;
              break;
            case "matches_with_friends":
              currentProgress = this.userStats.matchesWithFriends;
              targetProgress = params.count || 0;
              break;
            case "practice_hours":
              currentProgress = this.userStats.practiceHours;
              targetProgress = params.hours || 0;
              break;
          }

          if (targetProgress > 0) {
            percentage = Math.min(100, Math.round((currentProgress / targetProgress) * 100));
          }

          progress.push({
            badge,
            currentProgress,
            targetProgress,
            percentage,
            isClose: percentage >= 80
          });
        } catch (e) {
          // Skip badges with invalid criteria
        }
      }
    }

    return progress.sort((a, b) => b.percentage - a.percentage);
  }
}

// Function to check badges after a match
export async function checkBadgesAfterMatch(userId) {
  const evaluator = new BadgeEvaluator(userId);
  const newBadges = await evaluator.evaluateAndAwardBadges();
  return newBadges;
}