"use client";

import { useState, useEffect } from "react";
import { BadgeEvaluator } from "@/utils/badge-evaluator";

export default function BadgeProgress({ userId, badges, userBadges }) {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadProgress();
    }
  }, [userId, badges, userBadges]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const evaluator = new BadgeEvaluator(userId);
      const badgeProgress = await evaluator.getBadgeProgress();
      setProgress(badgeProgress);
    } catch (error) {
      console.error("Error loading badge progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCriteriaLabel = (badge) => {
    try {
      const criteria = JSON.parse(badge.criteria);
      return criteria.description || "Complete requirements";
    } catch (e) {
      return "Complete requirements";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="w-8 h-8 border-2 border-gray-300 rounded-full animate-spin border-t-orange-500"></div>
      </div>
    );
  }

  if (progress.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">All badges earned!</h3>
        <p className="text-gray-500">You've completed all available badges.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {progress.map((item, index) => (
        <div
          key={item.badge.$id}
          className={`bg-white border ${
            item.isClose ? "border-orange-200 ring-2 ring-orange-100" : "border-gray-200"
          } rounded-lg p-4 hover:shadow-md transition-shadow`}
        >
          <div className="flex items-start space-x-4">
            {/* Icon */}
            <div className="text-3xl flex-shrink-0">{item.badge.icon}</div>
            
            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">{item.badge.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{getCriteriaLabel(item.badge)}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {item.percentage}%
                  </div>
                  {item.targetProgress > 0 && (
                    <div className="text-xs text-gray-500">
                      {item.currentProgress} / {item.targetProgress}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.percentage >= 100
                      ? "bg-green-500"
                      : item.percentage >= 80
                      ? "bg-orange-500"
                      : item.percentage >= 50
                      ? "bg-yellow-500"
                      : "bg-gray-400"
                  }`}
                  style={{ width: `${Math.min(100, item.percentage)}%` }}
                ></div>
              </div>
              
              {/* Close to earning indicator */}
              {item.isClose && item.percentage < 100 && (
                <div className="mt-2 flex items-center text-xs text-orange-600">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Almost there! Keep going!
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}