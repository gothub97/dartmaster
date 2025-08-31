"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { databases } from "@/lib/appwrite";
import { useAuth } from "@/contexts/AuthContext";
import { ID, Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const FRIENDSHIPS_COLLECTION = "friendships";

const FriendsContext = createContext({});

export const useFriends = () => {
  const context = useContext(FriendsContext);
  if (!context) {
    throw new Error("useFriends must be used within a FriendsProvider");
  }
  return context;
};

export const FriendsProvider = ({ children }) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load friends and requests when user changes
  useEffect(() => {
    if (user) {
      loadFriends();
      loadFriendRequests();
    } else {
      setFriends([]);
      setFriendRequests([]);
      setSentRequests([]);
      setLoading(false);
    }
  }, [user]);

  // Load accepted friends
  const loadFriends = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get friendships where current user is sender and status is accepted
      const sentFriendsResponse = await databases.listDocuments(
        DATABASE_ID,
        FRIENDSHIPS_COLLECTION,
        [
          Query.equal("senderId", user.$id),
          Query.equal("status", "accepted")
        ]
      );

      // Get friendships where current user is receiver and status is accepted
      const receivedFriendsResponse = await databases.listDocuments(
        DATABASE_ID,
        FRIENDSHIPS_COLLECTION,
        [
          Query.equal("receiverId", user.$id),
          Query.equal("status", "accepted")
        ]
      );

      // Combine both arrays and extract friend user IDs
      const allFriendships = [...sentFriendsResponse.documents, ...receivedFriendsResponse.documents];
      const friendUserIds = allFriendships.map(friendship => 
        friendship.senderId === user.$id ? friendship.receiverId : friendship.senderId
      );

      // For now, store just the IDs. Later we can populate with full profile data
      setFriends(friendUserIds);
      
    } catch (error) {
      console.error("Error loading friends:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load pending friend requests (received)
  const loadFriendRequests = async () => {
    if (!user) return;

    try {
      // Get pending requests where current user is the receiver
      const receivedRequestsResponse = await databases.listDocuments(
        DATABASE_ID,
        FRIENDSHIPS_COLLECTION,
        [
          Query.equal("receiverId", user.$id),
          Query.equal("status", "pending")
        ]
      );

      // Get pending requests where current user is the sender
      const sentRequestsResponse = await databases.listDocuments(
        DATABASE_ID,
        FRIENDSHIPS_COLLECTION,
        [
          Query.equal("senderId", user.$id),
          Query.equal("status", "pending")
        ]
      );

      setFriendRequests(receivedRequestsResponse.documents);
      setSentRequests(sentRequestsResponse.documents);
      
    } catch (error) {
      console.error("Error loading friend requests:", error);
    }
  };

  // Send friend request
  const sendFriendRequest = async (receiverId) => {
    if (!user) return { success: false, error: "User not authenticated" };
    if (receiverId === user.$id) return { success: false, error: "Cannot send friend request to yourself" };

    try {
      // Check if friendship already exists
      const existingFriendship = await checkExistingFriendship(receiverId);
      if (existingFriendship) {
        return { success: false, error: "Friendship already exists or request already sent" };
      }

      // Create new friend request
      const response = await databases.createDocument(
        DATABASE_ID,
        FRIENDSHIPS_COLLECTION,
        ID.unique(),
        {
          senderId: user.$id,
          receiverId: receiverId,
          status: "pending",
          createdAt: new Date().toISOString()
        }
      );

      // Update sent requests
      setSentRequests(prev => [...prev, response]);

      return { success: true, request: response };
    } catch (error) {
      console.error("Error sending friend request:", error);
      return { success: false, error: error.message };
    }
  };

  // Accept friend request
  const acceptFriendRequest = async (requestId) => {
    if (!user) return { success: false, error: "User not authenticated" };

    try {
      // Update the friendship status to accepted
      const response = await databases.updateDocument(
        DATABASE_ID,
        FRIENDSHIPS_COLLECTION,
        requestId,
        {
          status: "accepted",
          updatedAt: new Date().toISOString()
        }
      );

      // Remove from friend requests and reload friends
      setFriendRequests(prev => prev.filter(req => req.$id !== requestId));
      await loadFriends();

      return { success: true, friendship: response };
    } catch (error) {
      console.error("Error accepting friend request:", error);
      return { success: false, error: error.message };
    }
  };

  // Decline friend request
  const declineFriendRequest = async (requestId) => {
    if (!user) return { success: false, error: "User not authenticated" };

    try {
      // Update the friendship status to declined
      await databases.updateDocument(
        DATABASE_ID,
        FRIENDSHIPS_COLLECTION,
        requestId,
        {
          status: "declined",
          updatedAt: new Date().toISOString()
        }
      );

      // Remove from friend requests
      setFriendRequests(prev => prev.filter(req => req.$id !== requestId));

      return { success: true };
    } catch (error) {
      console.error("Error declining friend request:", error);
      return { success: false, error: error.message };
    }
  };

  // Remove friend
  const removeFriend = async (friendId) => {
    if (!user) return { success: false, error: "User not authenticated" };

    try {
      // Find the friendship document
      const friendship = await findFriendship(friendId);
      if (!friendship) {
        return { success: false, error: "Friendship not found" };
      }

      // Delete the friendship
      await databases.deleteDocument(
        DATABASE_ID,
        FRIENDSHIPS_COLLECTION,
        friendship.$id
      );

      // Remove from friends list
      setFriends(prev => prev.filter(id => id !== friendId));

      return { success: true };
    } catch (error) {
      console.error("Error removing friend:", error);
      return { success: false, error: error.message };
    }
  };

  // Check if friendship exists (any status)
  const checkExistingFriendship = async (otherUserId) => {
    if (!user) return null;

    try {
      // Check if current user sent request to other user
      const sentResponse = await databases.listDocuments(
        DATABASE_ID,
        FRIENDSHIPS_COLLECTION,
        [
          Query.equal("senderId", user.$id),
          Query.equal("receiverId", otherUserId)
        ]
      );

      // Check if other user sent request to current user
      const receivedResponse = await databases.listDocuments(
        DATABASE_ID,
        FRIENDSHIPS_COLLECTION,
        [
          Query.equal("senderId", otherUserId),
          Query.equal("receiverId", user.$id)
        ]
      );

      const allFriendships = [...sentResponse.documents, ...receivedResponse.documents];
      return allFriendships.length > 0 ? allFriendships[0] : null;
    } catch (error) {
      console.error("Error checking existing friendship:", error);
      return null;
    }
  };

  // Find friendship document between current user and another user
  const findFriendship = async (otherUserId) => {
    if (!user) return null;

    try {
      const friendship = await checkExistingFriendship(otherUserId);
      return friendship && friendship.status === "accepted" ? friendship : null;
    } catch (error) {
      console.error("Error finding friendship:", error);
      return null;
    }
  };

  // Get friendship status with another user
  const getFriendshipStatus = async (otherUserId) => {
    if (!user) return "none";
    if (otherUserId === user.$id) return "self";

    try {
      const friendship = await checkExistingFriendship(otherUserId);
      if (!friendship) return "none";

      // Check if current user sent the request
      if (friendship.senderId === user.$id) {
        return friendship.status === "pending" ? "sent" : friendship.status;
      } else {
        return friendship.status === "pending" ? "received" : friendship.status;
      }
    } catch (error) {
      console.error("Error getting friendship status:", error);
      return "none";
    }
  };

  // Cancel sent friend request
  const cancelFriendRequest = async (receiverId) => {
    if (!user) return { success: false, error: "User not authenticated" };

    try {
      // Find the pending request
      const sentRequest = sentRequests.find(req => req.receiverId === receiverId);
      if (!sentRequest) {
        return { success: false, error: "Friend request not found" };
      }

      // Delete the request
      await databases.deleteDocument(
        DATABASE_ID,
        FRIENDSHIPS_COLLECTION,
        sentRequest.$id
      );

      // Remove from sent requests
      setSentRequests(prev => prev.filter(req => req.$id !== sentRequest.$id));

      return { success: true };
    } catch (error) {
      console.error("Error canceling friend request:", error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    friends,
    friendRequests,
    sentRequests,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend,
    getFriendshipStatus,
    loadFriends,
    loadFriendRequests
  };

  return (
    <FriendsContext.Provider value={value}>
      {children}
    </FriendsContext.Provider>
  );
};