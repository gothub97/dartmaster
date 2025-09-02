"use client";

import { useState } from "react";
import Link from "next/link";
import { databases } from "@/lib/appwrite";
import { useAuth } from "@/contexts/AuthContext";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function ChallengeCard({ challenge, onJoin }) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const now = new Date();
  const startDate = new Date(challenge.startDate);
  const endDate = new Date(challenge.endDate);
  const status = now < startDate ? "upcoming" : now > endDate ? "ended" : "active";
  const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
  
  let participants = [];
  try {
    participants = challenge.participants ? JSON.parse(challenge.participants) : [];
  } catch (e) {
    participants = [];
  }
  
  const isParticipant = participants.some(p => p.userId === user?.$id);
  const participantCount = participants.length;

  const handleJoinChallenge = async () => {
    if (!user || status !== "active" || isParticipant) return;
    
    try {
      const updatedParticipants = [
        ...participants,
        {
          userId: user.$id,
          username: user.name || user.email,
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
      
      if (onJoin) onJoin(challenge.$id);
    } catch (error) {
      console.error("Error joining challenge:", error);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "active":
        return "bg-green-50 border-green-200 text-green-600";
      case "upcoming":
        return "bg-blue-50 border-blue-200 text-blue-600";
      default:
        return "bg-gray-50 border-gray-200 text-gray-600";
    }
  };

  const getTypeIcon = () => {
    switch (challenge.type) {
      case "tournament":
        return "🏆";
      case "daily":
        return "📅";
      case "weekly":
        return "📆";
      default:
        return "🎯";
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow ${status === "active" ? "ring-2 ring-orange-200" : ""}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{getTypeIcon()}</div>
          <div>
            <Link href={`/challenges/${challenge.$id}`} className="font-semibold text-gray-900 hover:text-orange-600 transition-colors">
              {challenge.name}
            </Link>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor()}`}>
                {status === "active" ? `${daysLeft} days left` : status}
              </span>
              <span className="text-xs text-gray-500">
                {participantCount} participant{participantCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg 
            className={`w-5 h-5 transform transition-transform ${isExpanded ? "rotate-180" : ""}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {challenge.description && (
        <p className="text-sm text-gray-600 mb-4">{challenge.description}</p>
      )}

      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Start Date:</span>
              <div className="font-medium text-gray-900">
                {startDate.toLocaleDateString()} {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            <div>
              <span className="text-gray-500">End Date:</span>
              <div className="font-medium text-gray-900">
                {endDate.toLocaleDateString()} {endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>

          {challenge.rules && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Rules</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{challenge.rules}</p>
            </div>
          )}

          {challenge.prizes && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Prizes</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{challenge.prizes}</p>
            </div>
          )}

          {status === "active" && (
            <div className="pt-4">
              {isParticipant ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600 font-medium">✓ You're participating</span>
                  <Link 
                    href={`/challenges/${challenge.$id}`}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              ) : (
                <Link
                  href={`/challenges/${challenge.$id}`}
                  className="block w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-center"
                >
                  View & Join Challenge
                </Link>
              )}
            </div>
          )}

          {status === "upcoming" && (
            <div className="pt-4">
              {isParticipant ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-600 font-medium">✓ Pre-registered</span>
                  <Link 
                    href={`/challenges/${challenge.$id}`}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              ) : (
                <Link
                  href={`/challenges/${challenge.$id}`}
                  className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
                >
                  Pre-Register Now
                </Link>
              )}
              <div className="text-center text-xs text-gray-500 mt-2">
                Starts in {Math.ceil((startDate - now) / (1000 * 60 * 60 * 24))} days
              </div>
            </div>
          )}

          {status === "ended" && (
            <Link 
              href={`/challenges/${challenge.$id}`}
              className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center"
            >
              View Results
            </Link>
          )}
        </div>
      )}
    </div>
  );
}