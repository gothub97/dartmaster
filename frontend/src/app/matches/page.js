"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContextV2";

export default function MatchesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { activeMatches, loadActiveMatches, resumeMatch, getSpectatorLink, endMatch, isLoading } = useGame();
  const [copiedLink, setCopiedLink] = useState(null);
  const [showEndConfirmation, setShowEndConfirmation] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadActiveMatches();
    }
  }, [user]);

  const handleResumeMatch = async (matchId) => {
    await resumeMatch(matchId);
    router.push("/play");
  };

  const handleCopySpectatorLink = (matchId) => {
    const link = getSpectatorLink(matchId);
    navigator.clipboard.writeText(link);
    setCopiedLink(matchId);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleConfirmEndMatch = async (matchId) => {
    await endMatch(matchId, "abandoned");
    setShowEndConfirmation(null);
    await loadActiveMatches();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-white">Active Matches</h1>
          </div>
          
          <Link href="/play">
            <button className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition">
              New Match
            </button>
          </Link>
        </div>

        {/* Active Matches Grid */}
        {activeMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeMatches.map((match) => (
              <div
                key={match.id}
                className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1">
                      {match.config.name} Match
                    </h3>
                    <p className="text-sm text-gray-400">
                      Round {match.currentRound}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(match.startedAt)}
                  </span>
                </div>

                {/* Players */}
                <div className="space-y-2 mb-4">
                  {match.players.map((player, index) => (
                    <div
                      key={player.id}
                      className={`flex justify-between items-center p-2 rounded-lg ${
                        match.currentPlayerIndex === index
                          ? "bg-red-600/20 border border-red-500/30"
                          : "bg-white/5"
                      }`}
                    >
                      <span className="text-sm text-white">{player.name}</span>
                      <span className="text-sm font-bold text-white">
                        {match.mode === "cricket" 
                          ? `${player.score || 0} pts`
                          : match.mode === "aroundTheClock"
                          ? `Target: ${player.currentTarget}`
                          : player.score
                        }
                      </span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleResumeMatch(match.id)}
                    className="flex-1 py-2 bg-blue-600/30 hover:bg-blue-600/40 text-blue-400 rounded-lg font-semibold transition border border-blue-500/30"
                  >
                    Resume
                  </button>
                  <button
                    onClick={() => handleCopySpectatorLink(match.id)}
                    className="px-4 py-2 bg-green-600/30 hover:bg-green-600/40 text-green-400 rounded-lg font-semibold transition border border-green-500/30"
                  >
                    {copiedLink === match.id ? "Copied!" : "Share"}
                  </button>
                  <button
                    onClick={() => setShowEndConfirmation(match.id)}
                    className="px-4 py-2 bg-red-600/30 hover:bg-red-600/40 text-red-400 rounded-lg font-semibold transition border border-red-500/30"
                  >
                    End
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-12 border border-white/10 text-center">
            <div className="text-gray-400 mb-6">
              <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="text-xl">No active matches</p>
              <p className="text-sm mt-2">Start a new match to get playing!</p>
            </div>
            <Link href="/play">
              <button className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition">
                Start New Match
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* End Match Confirmation Modal */}
      {showEndConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-3">End Match?</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to end this match? The match will be marked as abandoned.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowEndConfirmation(null)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmEndMatch(showEndConfirmation)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all"
              >
                End Match
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}