"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { databases } from "@/lib/appwrite";
import { Query, ID } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function ActivityCard({ activity }) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [liked, setLiked] = useState(false);
  const [kudosCount, setKudosCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activity) {
      loadActivityData();
    }
  }, [activity]);

  const loadActivityData = async () => {
    try {
      // Load kudos count
      const kudosResponse = await databases.listDocuments(
        DATABASE_ID,
        'activity_kudos',
        [Query.equal('activityId', activity.id)]
      );
      setKudosCount(kudosResponse.total);

      // Check if current user has liked
      if (user) {
        const userKudos = kudosResponse.documents.find(k => k.userId === user.$id);
        setLiked(!!userKudos);
      }

      // Load comments
      const commentsResponse = await databases.listDocuments(
        DATABASE_ID,
        'activity_comments',
        [
          Query.equal('activityId', activity.id),
          Query.orderDesc('$createdAt')
        ]
      );
      setComments(commentsResponse.documents);
    } catch (error) {
      console.error('Error loading activity data:', error);
    }
  };

  const handleKudos = async () => {
    if (!user) {
      alert('Please sign in to give kudos');
      return;
    }

    setLoading(true);
    try {
      if (!liked) {
        // Add kudos
        await databases.createDocument(
          DATABASE_ID,
          'activity_kudos',
          ID.unique(),
          {
            activityId: activity.id,
            activityType: activity.type,
            userId: user.$id,
            username: profile?.username || user.name || 'Player',
            createdAt: new Date().toISOString()
          }
        );
        setKudosCount(kudosCount + 1);
        setLiked(true);
      } else {
        // Remove kudos
        const kudosResponse = await databases.listDocuments(
          DATABASE_ID,
          'activity_kudos',
          [
            Query.equal('activityId', activity.id),
            Query.equal('userId', user.$id)
          ]
        );
        
        if (kudosResponse.documents.length > 0) {
          await databases.deleteDocument(
            DATABASE_ID,
            'activity_kudos',
            kudosResponse.documents[0].$id
          );
          setKudosCount(Math.max(0, kudosCount - 1));
          setLiked(false);
        }
      }
    } catch (error) {
      console.error('Error toggling kudos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async () => {
    if (!user) {
      alert('Please sign in to comment');
      return;
    }

    if (!commentText.trim()) return;

    setLoading(true);
    try {
      const newComment = await databases.createDocument(
        DATABASE_ID,
        'activity_comments',
        ID.unique(),
        {
          activityId: activity.id,
          activityType: activity.type,
          userId: user.$id,
          username: profile?.username || user.name || 'Player',
          avatarUrl: profile?.avatarUrl || null,
          content: commentText.trim(),
          createdAt: new Date().toISOString()
        }
      );

      setComments([newComment, ...comments]);
      setCommentText("");
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = () => {
    switch (activity.type) {
      case 'match_result':
        return (
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'practice_session':
        return (
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
        );
      case 'achievement':
        return (
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
        );
      case 'friend_request':
        return (
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">🎯</span>
          </div>
        );
    }
  };

  const getActivityIllustration = () => {
    if (activity.type === 'match_result') {
      return (
        <div className="h-48 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg mb-4 relative overflow-hidden">
          {/* Dartboard illustration */}
          <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600" />
            <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600" />
            <circle cx="100" cy="100" r="20" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600" />
            <circle cx="100" cy="100" r="5" fill="currentColor" className="text-orange-600" />
          </svg>
          
          {/* Match score display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur rounded-lg px-6 py-4 shadow-lg">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{activity.data?.match?.currentState ? JSON.parse(activity.data.match.currentState).finalScore : '3-1'}</div>
                <div className="text-sm text-gray-500 mt-1">{activity.data?.match?.mode || '501'} • {activity.data?.match?.duration || '12'} min</div>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (activity.type === 'practice_session') {
      return (
        <div className="h-48 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg mb-4 relative overflow-hidden">
          {/* Practice stats visualization */}
          <div className="absolute inset-0 flex items-end justify-around p-4">
            {[65, 78, 82, 70, 88, 92, 85].map((height, i) => (
              <div key={i} className="flex-1 mx-1">
                <div 
                  className="bg-blue-500/20 rounded-t"
                  style={{ height: `${height}%` }}
                />
              </div>
            ))}
          </div>
          
          {/* Practice result */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur rounded-lg px-4 py-2">
            <div className="text-2xl font-bold text-gray-900">{activity.data?.stats?.accuracy || 85}%</div>
            <div className="text-xs text-gray-500">Accuracy</div>
          </div>
        </div>
      );
    } else if (activity.type === 'achievement') {
      return (
        <div className="h-48 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg mb-4 relative overflow-hidden flex items-center justify-center">
          <div className="text-6xl">{activity.data?.achievement?.icon || '🏆'}</div>
        </div>
      );
    }
    return null;
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    
    return time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-4 overflow-hidden hover:border-gray-300 transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {activity.avatar ? (
              <img 
                src={activity.avatar} 
                alt={activity.username}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-600">
                  {activity.username?.charAt(0) || '?'}
                </span>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Link 
                  href={`/players/${activity.username}`}
                  className="font-semibold text-gray-900 hover:text-orange-600 transition-colors"
                >
                  {activity.username || 'Player'}
                </Link>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-500">{formatTime(activity.timestamp)}</span>
              </div>
              <p className="text-sm text-gray-600 mt-0.5">{activity.title}</p>
            </div>
          </div>
          {getActivityIcon()}
        </div>
      </div>

      {/* Illustration/Content */}
      <div className="px-4 pt-4">
        {getActivityIllustration()}
        
        {/* Activity message */}
        <p className="text-gray-900 mb-4">
          {activity.message}
        </p>

        {/* Friend request actions */}
        {activity.type === 'friend_request' && activity.actions && (
          <div className="flex space-x-2 mb-4">
            {activity.actions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  action.type === 'success' 
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Additional stats for matches */}
        {activity.type === 'match_result' && activity.data?.match && (
          <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg mb-4">
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-900">180s</div>
              <div className="text-xs text-gray-500">2</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-900">High Finish</div>
              <div className="text-xs text-gray-500">126</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-900">Avg</div>
              <div className="text-xs text-gray-500">65.4</div>
            </div>
          </div>
        )}

        {/* Additional stats for practice */}
        {activity.type === 'practice_session' && activity.data?.stats && (
          <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg mb-4">
            <div>
              <div className="text-xs text-gray-500">Duration</div>
              <div className="text-sm font-semibold text-gray-900">15 min</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Darts Thrown</div>
              <div className="text-sm font-semibold text-gray-900">180</div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleKudos}
              className={`flex items-center space-x-1 transition-colors ${
                liked ? 'text-orange-600' : 'text-gray-500 hover:text-orange-600'
              }`}
            >
              <svg className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              <span className="text-sm font-medium">{kudosCount}</span>
            </button>
            
            <button 
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm font-medium">{comments.length > 0 ? comments.length : ''} Comment{comments.length !== 1 ? 's' : ''}</span>
            </button>
          </div>
          
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
            </svg>
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {/* Comment Input */}
            {user && (
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={loading}
                />
                <button
                  onClick={handleComment}
                  disabled={loading || !commentText.trim()}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Post
                </button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.$id} className="flex space-x-2">
                    {comment.avatarUrl ? (
                      <img 
                        src={comment.avatarUrl} 
                        alt={comment.username}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-gray-600">
                          {comment.username?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg px-3 py-2">
                        <Link 
                          href={`/players/${comment.username}`}
                          className="text-sm font-semibold text-gray-900 hover:text-orange-600"
                        >
                          {comment.username}
                        </Link>
                        <p className="text-sm text-gray-700 mt-0.5">{comment.content}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 ml-3">
                        {formatTime(new Date(comment.createdAt || comment.$createdAt))}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">No comments yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}