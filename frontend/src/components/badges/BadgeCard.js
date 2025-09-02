"use client";

import { useState } from "react";

export default function BadgeCard({ badge, earned = false }) {
  const [showDetails, setShowDetails] = useState(false);

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "common": return "from-gray-400 to-gray-600";
      case "rare": return "from-blue-400 to-blue-600";
      case "epic": return "from-purple-400 to-purple-600";
      case "legendary": return "from-yellow-400 to-yellow-600";
      default: return "from-gray-400 to-gray-600";
    }
  };

  const getRarityBorder = (rarity) => {
    switch (rarity) {
      case "common": return "border-gray-300";
      case "rare": return "border-blue-300";
      case "epic": return "border-purple-300";
      case "legendary": return "border-yellow-300";
      default: return "border-gray-300";
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "achievement": return "bg-green-100 text-green-800";
      case "milestone": return "bg-blue-100 text-blue-800";
      case "skill": return "bg-orange-100 text-orange-800";
      case "social": return "bg-pink-100 text-pink-800";
      case "special": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <div
        onClick={() => setShowDetails(true)}
        className={`relative bg-white border-2 ${getRarityBorder(badge.rarity)} rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all ${
          !earned ? "opacity-60 grayscale" : ""
        }`}
      >
        {/* Rarity gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${getRarityColor(badge.rarity)} opacity-5 rounded-lg`}></div>
        
        {/* Content */}
        <div className="relative">
          {/* Icon */}
          <div className="text-4xl mb-2 text-center">{badge.icon}</div>
          
          {/* Name */}
          <h4 className="text-sm font-semibold text-gray-900 text-center mb-1 truncate">
            {badge.name}
          </h4>
          
          {/* Category */}
          <div className="flex justify-center mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(badge.category)}`}>
              {badge.category}
            </span>
          </div>
          
          {/* Points */}
          <div className="text-center">
            <span className="text-xs text-gray-500">+{badge.points} pts</span>
          </div>
          
          {/* Earned indicator */}
          {earned && badge.earnedAt && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-5xl">{badge.icon}</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{badge.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(badge.category)}`}>
                      {badge.category}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${getRarityColor(badge.rarity)} text-white`}>
                      {badge.rarity}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {badge.description && (
              <p className="text-gray-600 mb-4">{badge.description}</p>
            )}

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-t border-gray-100">
                <span className="text-sm text-gray-500">Points</span>
                <span className="font-semibold text-gray-900">+{badge.points}</span>
              </div>

              {earned && badge.earnedAt && (
                <div className="flex justify-between items-center py-2 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Earned</span>
                  <span className="font-semibold text-green-600">
                    {new Date(badge.earnedAt).toLocaleDateString()}
                  </span>
                </div>
              )}

              {!earned && (
                <div className="py-2 border-t border-gray-100">
                  <div className="flex items-center justify-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Not yet earned
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowDetails(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}