"use client";

import { useState, useEffect } from "react";
import { useFriends } from "@/contexts/FriendsContext";
import { useAuth } from "@/contexts/AuthContext";

export default function FriendButton({ userId, className = "" }) {
  const { user } = useAuth();
  const {
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend,
    getFriendshipStatus
  } = useFriends();

  const [status, setStatus] = useState("loading");
  const [loading, setLoading] = useState(false);

  // Load friendship status on mount
  useEffect(() => {
    loadStatus();
  }, [userId, user]);

  const loadStatus = async () => {
    if (!userId || !user) return;
    try {
      const friendshipStatus = await getFriendshipStatus(userId);
      setStatus(friendshipStatus);
    } catch (error) {
      console.error("Error loading friendship status:", error);
      setStatus("none");
    }
  };

  const handleSendRequest = async () => {
    setLoading(true);
    try {
      const result = await sendFriendRequest(userId);
      if (result.success) {
        setStatus("sent");
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    setLoading(true);
    try {
      const result = await cancelFriendRequest(userId);
      if (result.success) {
        setStatus("none");
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error canceling friend request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    setLoading(true);
    try {
      // Note: We'll need to modify this to get the actual request ID
      // For now, we'll implement a workaround
      alert("Accept functionality will be implemented in the friends page");
    } catch (error) {
      console.error("Error accepting friend request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!confirm("Are you sure you want to remove this friend?")) return;
    
    setLoading(true);
    try {
      const result = await removeFriend(userId);
      if (result.success) {
        setStatus("none");
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error removing friend:", error);
    } finally {
      setLoading(false);
    }
  };

  // Don't show button for own profile
  if (status === "self" || !user) return null;

  // Show loading state
  if (status === "loading") {
    return (
      <div className={`px-4 py-2 bg-gray-600 text-gray-400 rounded-lg ${className}`}>
        Loading...
      </div>
    );
  }

  const buttonClass = `px-4 py-2 rounded-lg font-medium transition ${className}`;

  switch (status) {
    case "none":
      return (
        <button
          onClick={handleSendRequest}
          disabled={loading}
          className={`${buttonClass} bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50`}
        >
          {loading ? "Sending..." : "Add Friend"}
        </button>
      );

    case "sent":
      return (
        <button
          onClick={handleCancelRequest}
          disabled={loading}
          className={`${buttonClass} bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-50`}
        >
          {loading ? "Canceling..." : "Request Sent"}
        </button>
      );

    case "received":
      return (
        <div className="flex space-x-2">
          <button
            onClick={handleAcceptRequest}
            disabled={loading}
            className={`${buttonClass} bg-green-600 hover:bg-green-700 text-white disabled:opacity-50`}
          >
            {loading ? "..." : "Accept"}
          </button>
          <button
            onClick={() => alert("Decline functionality will be implemented in the friends page")}
            disabled={loading}
            className={`${buttonClass} bg-red-600 hover:bg-red-700 text-white disabled:opacity-50`}
          >
            Decline
          </button>
        </div>
      );

    case "accepted":
      return (
        <button
          onClick={handleRemoveFriend}
          disabled={loading}
          className={`${buttonClass} bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 disabled:opacity-50`}
        >
          {loading ? "Removing..." : "Remove Friend"}
        </button>
      );

    case "blocked":
      return (
        <div className={`${buttonClass} bg-gray-600 text-gray-400`}>
          Blocked
        </div>
      );

    case "declined":
      return (
        <button
          onClick={handleSendRequest}
          disabled={loading}
          className={`${buttonClass} bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50`}
        >
          {loading ? "Sending..." : "Send Request Again"}
        </button>
      );

    default:
      return null;
  }
}