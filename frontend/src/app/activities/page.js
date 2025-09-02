"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import SharedNavigation from "@/components/layout/SharedNavigation";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function ActivitiesPage() {
  const { user, loading: authLoading } = useAuth();
  const [matches, setMatches] = useState([]);
  const [practiceSession, setPracticeSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, matches, practice
  const [sortBy, setSortBy] = useState('recent'); // recent, oldest

  useEffect(() => {
    if (user) {
      loadActivities();
    }
  }, [user, filter, sortBy]);

  const loadActivities = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const activities = [];

      // Load matches
      if (filter === 'all' || filter === 'matches') {
        const matchesResponse = await databases.listDocuments(
          DATABASE_ID,
          'matches',
          [
            Query.equal('userId', user.$id),
            Query.orderDesc('startedAt'),
            Query.limit(100)
          ]
        );

        matchesResponse.documents.forEach(match => {
          try {
            const currentState = typeof match.currentState === 'string' 
              ? JSON.parse(match.currentState) 
              : match.currentState;
            
            const players = typeof match.players === 'string'
              ? JSON.parse(match.players)
              : match.players;

            activities.push({
              id: match.$id,
              type: 'match',
              mode: match.mode,
              status: match.status,
              startedAt: match.startedAt,
              finishedAt: match.finishedAt,
              players,
              winner: currentState?.winner,
              currentRound: currentState?.currentRound || 0,
              stats: currentState?.players?.[0]?.stats || {},
              score: currentState?.players?.[0]?.score,
              duration: match.finishedAt 
                ? Math.round((new Date(match.finishedAt) - new Date(match.startedAt)) / 1000 / 60)
                : null
            });
          } catch (e) {
            console.error('Error parsing match:', e);
          }
        });
      }

      // Load practice sessions
      if (filter === 'all' || filter === 'practice') {
        const practiceResponse = await databases.listDocuments(
          DATABASE_ID,
          'practice_sessions',
          [
            Query.equal('userId', user.$id),
            Query.orderDesc('startedAt'),
            Query.limit(100)
          ]
        );

        practiceResponse.documents.forEach(session => {
          try {
            const stats = typeof session.stats === 'string'
              ? JSON.parse(session.stats)
              : session.stats;

            activities.push({
              id: session.$id,
              type: 'practice',
              mode: session.mode,
              status: session.completed ? 'completed' : 'incomplete',
              startedAt: session.startedAt,
              finishedAt: session.endedAt,
              stats: stats || {},
              duration: session.endedAt
                ? Math.round((new Date(session.endedAt) - new Date(session.startedAt)) / 1000 / 60)
                : null
            });
          } catch (e) {
            console.error('Error parsing practice session:', e);
          }
        });
      }

      // Sort activities
      activities.sort((a, b) => {
        const dateA = new Date(a.startedAt);
        const dateB = new Date(b.startedAt);
        return sortBy === 'recent' ? dateB - dateA : dateA - dateB;
      });

      setMatches(activities);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / 1000 / 60 / 60;

    if (diffInHours < 1) {
      const diffInMinutes = Math.round(diffInHours * 60);
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.round(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 168) { // 7 days
      const days = Math.round(diffInHours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getActivityIcon = (activity) => {
    if (activity.type === 'practice') {
      return (
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
      );
    }

    return (
      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
        <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
      </div>
    );
  };

  const getActivityTitle = (activity) => {
    if (activity.type === 'practice') {
      const modeNames = {
        'freePlay': 'Free Play',
        'aroundTheClock': 'Around the Clock',
        'checkout_practice': 'Checkout Practice',
        'bulls_practice': 'Bulls Practice',
        'accuracy_training': 'Accuracy Training'
      };
      return modeNames[activity.mode] || activity.mode;
    }
    return `${activity.mode} Match`;
  };

  const getActivityStatus = (activity) => {
    if (activity.status === 'active') {
      return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Active</span>;
    } else if (activity.status === 'completed') {
      return <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">Completed</span>;
    } else if (activity.winner === user.$id) {
      return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Won</span>;
    } else if (activity.winner && activity.winner !== user.$id) {
      return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">Lost</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">Incomplete</span>;
  };

  const getActivityStats = (activity) => {
    const stats = [];
    
    if (activity.type === 'match') {
      if (activity.score !== undefined) {
        stats.push(`Score: ${activity.score}`);
      }
      if (activity.currentRound) {
        stats.push(`Round ${activity.currentRound}`);
      }
      if (activity.stats?.total180s) {
        stats.push(`${activity.stats.total180s} × 180`);
      }
    } else if (activity.type === 'practice') {
      if (activity.stats?.accuracy) {
        stats.push(`${activity.stats.accuracy}% accuracy`);
      }
      if (activity.stats?.highestScore) {
        stats.push(`High: ${activity.stats.highestScore}`);
      }
      if (activity.stats?.totalThrows) {
        stats.push(`${activity.stats.totalThrows} throws`);
      }
    }

    if (activity.duration) {
      stats.push(`${activity.duration} min`);
    }

    return stats.join(' • ');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to view your activities</p>
          <Link href="/signin" className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNavigation />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity History</h1>
          <p className="text-gray-600">Track all your games and practice sessions</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Show:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Activities</option>
              <option value="matches">Matches Only</option>
              <option value="practice">Practice Only</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Activities List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading activities...</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No activities yet</h3>
              <p className="text-gray-600 mb-6">Start playing to see your game history here</p>
              <div className="flex justify-center space-x-4">
                <Link
                  href="/play"
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Play Now
                </Link>
                <Link
                  href="/practice"
                  className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Practice
                </Link>
              </div>
            </div>
          ) : (
            matches.map((activity) => (
              <Link 
                key={activity.id} 
                href={activity.type === 'practice' ? `/activities/${activity.id}` : '#'}
                className="block"
              >
                <div className="bg-white rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {getActivityIcon(activity)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {getActivityTitle(activity)}
                          </h3>
                          {getActivityStatus(activity)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {getActivityStats(activity)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(activity.startedAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {activity.type === 'practice' && (
                        <span className="text-sm text-orange-600">View Details →</span>
                      )}
                      {activity.status === 'active' && (
                        <Link
                          href="/play"
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                        >
                          Continue
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
