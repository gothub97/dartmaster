"use client";

import Link from "next/link";
import { useNotifications } from "@/contexts/NotificationContext";

export default function NotificationFeed() {
  const { notifications, loading, markAsRead } = useNotifications();

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
    
    return timestamp.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Activity Feed</h3>
        <div className="text-center text-gray-400 py-8">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-semibold text-white">Activity Feed</h3>
        {notifications.length > 3 && (
          <Link 
            href="/friends"
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            View all
          </Link>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="flex-1 overflow-y-auto space-y-6 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
          {notifications.slice(0, 10).map((notification) => (
            <div
              key={notification.id}
              className={`bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 transition-all hover:border-red-500/30 cursor-pointer ${
                !notification.read ? 'ring-2 ring-blue-500/20' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start space-x-4">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-red-500 to-purple-600 flex-shrink-0">
                  {notification.avatar ? (
                    <img
                      src={notification.avatar}
                      alt={notification.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-white text-xl font-bold">
                        {notification.username?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-white">
                      {notification.title}
                    </h4>
                    <span className="text-sm text-gray-400">
                      {formatTime(notification.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-base text-gray-300 mb-4 leading-relaxed">
                    {notification.message}
                  </p>

                  {/* Actions */}
                  {notification.actions && notification.actions.length > 0 && (
                    <div className="flex space-x-3 mb-4">
                      {notification.actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            action.action();
                          }}
                          className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                            action.type === 'success'
                              ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/30'
                              : action.type === 'danger'
                              ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30'
                              : 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30 border border-gray-500/30'
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* View Profile Link */}
                  {notification.username && (
                    <Link
                      href={`/players/${notification.username}`}
                      className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Profile 
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                </div>

                {/* Unread indicator */}
                {!notification.read && (
                  <div className="flex-shrink-0">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 text-gray-600">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
            </div>
            <h4 className="text-2xl font-semibold text-white mb-4">No activity yet</h4>
            <p className="text-gray-400 text-lg mb-8 max-w-md">
              When you receive friend requests and other notifications, they'll appear here.
            </p>
            <Link 
              href="/players"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl font-semibold hover:from-red-700 hover:to-red-800 transition text-lg"
            >
              Find Players
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}