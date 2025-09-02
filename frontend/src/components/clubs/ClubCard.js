"use client";

import Link from "next/link";
import { useState } from "react";

export default function ClubCard({ club, isUserMember = false, onJoin = null }) {
  const [imageError, setImageError] = useState(false);
  
  const stats = club.clubStats || {
    totalGames: 0,
    avgAccuracy: 0,
    totalTrophies: 0,
    weeklyActive: 0
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      {/* Club Header */}
      <div className="relative h-32 bg-gradient-to-br from-orange-400 to-orange-600">
        {club.logoUrl && !imageError ? (
          <img 
            src={club.logoUrl} 
            alt={club.name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {club.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}
        
        {/* Member Badge */}
        {isUserMember && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            Member
          </div>
        )}
        
        {/* Private/Public Badge */}
        <div className="absolute top-2 left-2">
          {club.isPublic ? (
            <div className="bg-white/90 backdrop-blur text-gray-700 text-xs px-2 py-1 rounded-full flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Public
            </div>
          ) : (
            <div className="bg-gray-800/90 backdrop-blur text-white text-xs px-2 py-1 rounded-full flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Private
            </div>
          )}
        </div>
      </div>

      {/* Club Info */}
      <div className="p-4">
        <Link href={`/clubs/${club.$id}`}>
          <h3 className="text-lg font-bold text-gray-900 hover:text-orange-600 transition">
            {club.name}
          </h3>
        </Link>
        
        {club.description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {club.description}
          </p>
        )}

        {/* Location */}
        {(club.city || club.country) && (
          <div className="flex items-center text-sm text-gray-500 mt-2">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{[club.city, club.country].filter(Boolean).join(", ")}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{club.memberCount || 0}</div>
            <div className="text-xs text-gray-500">Members</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{stats.totalGames}</div>
            <div className="text-xs text-gray-500">Games</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{stats.totalTrophies}</div>
            <div className="text-xs text-gray-500">Trophies</div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4">
          {isUserMember ? (
            <Link
              href={`/clubs/${club.$id}/dashboard`}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition text-center block"
            >
              View Dashboard
            </Link>
          ) : (
            <button
              onClick={() => onJoin && onJoin(club.$id)}
              className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-600 transition"
              disabled={!club.isPublic && club.joinMethod === "invite"}
            >
              {club.joinMethod === "invite" ? "Invite Only" : 
               club.joinMethod === "request" ? "Request to Join" : "Join Club"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}