"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFriends } from "@/contexts/FriendsContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

const NotificationContext = createContext({});

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { friendRequests, sentRequests, acceptFriendRequest, declineFriendRequest } = useFriends();
  const { loadUserProfile } = useUserProfile();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [readNotifications, setReadNotifications] = useState(() => {
    // Load read notifications from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('readNotifications');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  // Update notifications when friend requests change
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    updateNotifications();
  }, [friendRequests, sentRequests, user]);

  const updateNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const notificationList = [];

      // Add friend requests as notifications
      for (const request of friendRequests) {
        try {
          const senderProfile = await loadUserProfile(request.senderId);
          if (senderProfile) {
            notificationList.push({
              id: `friend_request_${request.$id}`,
              type: 'friend_request',
              title: 'New Friend Request',
              message: `@${senderProfile.username} sent you a friend request`,
              avatar: senderProfile.avatarUrl,
              username: senderProfile.username,
              timestamp: new Date(request.createdAt),
              data: {
                requestId: request.$id,
                senderId: request.senderId,
                senderProfile: senderProfile
              },
              actions: [
                {
                  label: 'Accept',
                  type: 'success',
                  action: () => handleAcceptRequest(request.$id)
                },
                {
                  label: 'Decline',
                  type: 'danger',
                  action: () => handleDeclineRequest(request.$id)
                }
              ]
            });
          }
        } catch (error) {
          console.error(`Error loading profile for friend request ${request.$id}:`, error);
        }
      }

      // Add match activities
      await addMatchActivities(notificationList);

      // Add practice session activities
      await addPracticeActivities(notificationList);

      // Add achievement activities
      await addAchievementActivities(notificationList);

      // Sort by timestamp (newest first)
      notificationList.sort((a, b) => b.timestamp - a.timestamp);

      // Mark notifications as read if they were previously read
      const markedNotifications = notificationList.map(n => ({
        ...n,
        read: readNotifications.includes(n.id)
      }));

      setNotifications(markedNotifications);
      // Only count unread notifications
      setUnreadCount(markedNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error("Error updating notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to add match activities
  const addMatchActivities = async (notificationList) => {
    try {
      // Get ALL recent matches to show global activity
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const matchesResponse = await databases.listDocuments(
        DATABASE_ID,
        'matches',
        [
          Query.orderDesc('startedAt'),
          Query.limit(20)
        ]
      );

      for (const match of matchesResponse.documents) {
        try {
          const currentState = JSON.parse(match.currentState);
          const players = JSON.parse(match.players);
          
          // Handle winner - it can be either a userId string or a player object
          const winnerId = typeof currentState.winner === 'object' 
            ? currentState.winner?.userId 
            : currentState.winner;
          
          // Get winner profile with fallback
          const winner = winnerId 
            ? (typeof currentState.winner === 'object' ? currentState.winner : players.find(p => p.userId === winnerId))
            : null;
          const loser = winnerId ? players.find(p => p.userId !== winnerId) : null;
          
          let winnerProfile = null;
          if (winnerId) {
            try {
              winnerProfile = await loadUserProfile(winnerId);
            } catch (e) {
              // Use fallback data from match if profile not found
              winnerProfile = {
                username: winner?.username || winner?.name || 'Player',
                avatarUrl: null
              };
            }
          }
          
          // Check if match is active or completed
          if (match.status === 'active') {
            // Show active match
            const activePlayer = players[0]; // For now, show first player for active games
            let playerProfile = null;
            
            // Try to load the active player's profile
            try {
              playerProfile = await loadUserProfile(activePlayer.userId);
            } catch (e) {
              // Use fallback data from match if profile not found
              playerProfile = {
                username: activePlayer?.username || activePlayer?.name || 'Player',
                avatarUrl: null
              };
            }
            
            notificationList.push({
              id: `match_${match.$id}`,
              type: 'match_active',
              title: 'Game in Progress',
              message: `@${playerProfile.username} is playing ${match.mode} - Round ${currentState.currentRound || 1}`,
              avatar: playerProfile.avatarUrl,
              username: playerProfile.username,
              timestamp: new Date(match.startedAt),
              data: { match, activePlayer }
            });
          } else if (winnerId && winnerProfile) {
            // Show completed match
            // Check if it's a solo game (only one player)
            const isSolo = players.length === 1 || !loser;
            
            const message = isSolo 
              ? `@${winnerProfile.username} completed ${match.mode} solo practice${currentState.finalScore ? ` - Score: ${currentState.finalScore}` : ''}`
              : `@${winnerProfile.username} defeated @${loser?.username || loser?.name || 'opponent'} ${currentState.finalScore || ''} in ${match.mode}`;
            
            notificationList.push({
              id: `match_${match.$id}`,
              type: 'match_result',
              title: isSolo ? 'Solo Game Completed' : 'Match Completed',
              message,
              avatar: winnerProfile.avatarUrl,
              username: winnerProfile.username,
              timestamp: new Date(match.finishedAt || match.startedAt),
              data: { match, winner, loser, isSolo }
            });
          }

          // Add highlight activities for notable achievements in the match
          if (currentState.highlights && winnerProfile) {
            for (const highlight of currentState.highlights) {
              if (highlight.includes('180') || highlight.includes('checkout')) {
                notificationList.push({
                  id: `match_highlight_${match.$id}_${highlight}`,
                  type: 'match_highlight',
                  title: 'Amazing Performance!',
                  message: `@${winnerProfile.username}: ${highlight}`,
                  avatar: winnerProfile.avatarUrl,
                  username: winnerProfile.username,
                  timestamp: new Date(match.finishedAt || match.startedAt),
                  data: { match, highlight }
                });
              }
            }
          }
        } catch (error) {
          console.error(`Error processing match ${match.$id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error loading match activities:', error);
    }
  };

  // Helper function to add practice session activities
  const addPracticeActivities = async (notificationList) => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const practiceResponse = await databases.listDocuments(
        DATABASE_ID,
        'practice_sessions',
        [
          Query.equal('completed', true),
          Query.orderDesc('endedAt'),
          Query.limit(15)
        ]
      );

      for (const session of practiceResponse.documents) {
        try {
          let userProfile = null;
          try {
            userProfile = await loadUserProfile(session.userId);
          } catch (e) {
            // Use fallback username if profile not found
            userProfile = {
              username: `Player_${session.userId.substring(0, 6)}`,
              avatarUrl: null
            };
          }

          const stats = JSON.parse(session.stats || '{}');
          let activityMessage = '';

          switch (session.mode) {
            case 'checkout_practice':
              if (stats.personalBest) {
                activityMessage = `completed checkout practice with a personal best of ${stats.personalBest}!`;
              } else {
                activityMessage = `completed checkout practice with ${stats.accuracy}% accuracy`;
              }
              break;
            case 'bulls_practice':
              if (stats.consecutiveBulls >= 10) {
                activityMessage = `hit ${stats.consecutiveBulls} consecutive bullseyes in practice! 🎯`;
              } else {
                activityMessage = `completed bullseye practice with ${stats.accuracy}% accuracy`;
              }
              break;
            case 'around_the_clock':
              activityMessage = `completed Around the Clock in ${stats.completionTime || 'record time'}!`;
              break;
            case 'accuracy_training':
              if (stats.improvement) {
                activityMessage = `improved accuracy by ${stats.improvement} in practice!`;
              } else {
                activityMessage = `achieved ${stats.accuracy}% accuracy in training`;
              }
              break;
            default:
              activityMessage = `completed a ${session.mode} practice session`;
          }

          notificationList.push({
            id: `practice_${session.$id}`,
            type: 'practice_session',
            title: 'Practice Achievement',
            message: `@${userProfile.username} ${activityMessage}`,
            avatar: userProfile.avatarUrl,
            username: userProfile.username,
            timestamp: new Date(session.endedAt),
            data: { session, stats }
          });
        } catch (error) {
          console.error(`Error processing practice session ${session.$id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error loading practice activities:', error);
    }
  };

  // Helper function to add achievement activities
  const addAchievementActivities = async (notificationList) => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const achievementsResponse = await databases.listDocuments(
        DATABASE_ID,
        'user_achievements',
        [
          Query.orderDesc('earnedAt'),
          Query.limit(10)
        ]
      );

      for (const userAchievement of achievementsResponse.documents) {
        try {
          let userProfile = null;
          try {
            userProfile = await loadUserProfile(userAchievement.userId);
          } catch (e) {
            // Use fallback username if profile not found
            userProfile = {
              username: `Player_${userAchievement.userId.substring(0, 6)}`,
              avatarUrl: null
            };
          }
          
          const achievementResponse = await databases.listDocuments(
            DATABASE_ID,
            'achievements',
            [Query.equal('achievementId', userAchievement.achievementId)]
          );
          
          if (achievementResponse.documents.length === 0) continue;
          
          const achievement = achievementResponse.documents[0];

          notificationList.push({
            id: `achievement_${userAchievement.$id}`,
            type: 'achievement',
            title: 'Achievement Unlocked!',
            message: `@${userProfile.username} earned "${achievement.name}" ${achievement.icon}`,
            avatar: userProfile.avatarUrl,
            username: userProfile.username,
            timestamp: new Date(userAchievement.earnedAt),
            data: { userAchievement, achievement }
          });
        } catch (error) {
          console.error(`Error processing achievement ${userAchievement.$id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error loading achievement activities:', error);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const result = await acceptFriendRequest(requestId);
      if (result.success) {
        // Remove the notification
        setNotifications(prev => prev.filter(n => n.data?.requestId !== requestId));
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Show success message
        showToast('Friend request accepted!', 'success');
      } else {
        showToast(result.error || 'Failed to accept request', 'error');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      showToast('Error accepting friend request', 'error');
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      const result = await declineFriendRequest(requestId);
      if (result.success) {
        // Remove the notification
        setNotifications(prev => prev.filter(n => n.data?.requestId !== requestId));
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        showToast('Friend request declined', 'info');
      } else {
        showToast(result.error || 'Failed to decline request', 'error');
      }
    } catch (error) {
      console.error('Error declining friend request:', error);
      showToast('Error declining friend request', 'error');
    }
  };

  // Simple toast notification system
  const showToast = (message, type = 'info') => {
    // This is a simple implementation - in a real app you might use a proper toast library
    console.log(`Toast [${type}]: ${message}`);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    
    // Add to read notifications list and persist
    if (!readNotifications.includes(notificationId)) {
      const updatedRead = [...readNotifications, notificationId];
      setReadNotifications(updatedRead);
      if (typeof window !== 'undefined') {
        localStorage.setItem('readNotifications', JSON.stringify(updatedRead));
      }
    }
    
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    const allNotificationIds = notifications.map(n => n.id);
    const updatedRead = [...new Set([...readNotifications, ...allNotificationIds])];
    
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setReadNotifications(updatedRead);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('readNotifications', JSON.stringify(updatedRead));
    }
    
    setUnreadCount(0);
  };

  const clearNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    updateNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};