"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { usePractice } from "@/contexts/PracticeContext";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { getSessionThrows, getSessionStatistics } = usePractice();
  
  const [throws, setThrows] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [view, setView] = useState('throws'); // throws, statistics, heatmap

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    
    loadActivityData();
  }, [user, params.id]);

  const loadActivityData = async () => {
    if (!params.id) return;
    
    setLoading(true);
    try {
      // Load session info
      const sessionResponse = await databases.getDocument(
        DATABASE_ID,
        'practice_sessions',
        params.id
      );
      setSessionInfo(sessionResponse);
      
      // Load throws
      const throwsData = await getSessionThrows(params.id);
      setThrows(throwsData);
      
      // Load statistics
      const statsData = await getSessionStatistics(params.id);
      setStatistics(statsData);
    } catch (error) {
      console.error('Error loading activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateHeatMap = () => {
    const heatMap = {};
    throws.forEach(throwData => {
      const key = `${throwData.segment}-${throwData.multiplier}`;
      heatMap[key] = (heatMap[key] || 0) + 1;
    });
    return heatMap;
  };

  const getSegmentColor = (count, maxCount) => {
    if (!count) return 'bg-gray-100';
    const intensity = count / maxCount;
    if (intensity > 0.8) return 'bg-red-600';
    if (intensity > 0.6) return 'bg-orange-600';
    if (intensity > 0.4) return 'bg-yellow-600';
    if (intensity > 0.2) return 'bg-green-600';
    return 'bg-green-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 rounded-full animate-spin border-t-orange-500"></div>
      </div>
    );
  }

  const heatMap = calculateHeatMap();
  const maxHits = Math.max(...Object.values(heatMap), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="font-bold text-xl text-gray-900">Dartmaster</span>
              </Link>
              
              <nav className="hidden md:flex space-x-6">
                <Link href="/activities" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
                  ← Back to Activities
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Session Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {sessionInfo?.mode || 'Practice'} Session
          </h1>
          <div className="text-gray-600">
            {new Date(sessionInfo?.startedAt || params.id).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        {/* View Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setView('throws')}
              className={`px-6 py-3 text-sm font-medium transition ${
                view === 'throws'
                  ? 'text-orange-600 border-b-2 border-orange-500'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Throw History ({throws.length})
            </button>
            <button
              onClick={() => setView('statistics')}
              className={`px-6 py-3 text-sm font-medium transition ${
                view === 'statistics'
                  ? 'text-orange-600 border-b-2 border-orange-500'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Statistics
            </button>
            <button
              onClick={() => setView('heatmap')}
              className={`px-6 py-3 text-sm font-medium transition ${
                view === 'heatmap'
                  ? 'text-orange-600 border-b-2 border-orange-500'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Heat Map
            </button>
          </div>

          <div className="p-6">
            {/* Throws View */}
            {view === 'throws' && (
              <div className="space-y-2">
                <div className="grid grid-cols-7 gap-4 text-sm font-medium text-gray-600 pb-2 border-b">
                  <div>#</div>
                  <div>Turn</div>
                  <div>Dart</div>
                  <div>Target</div>
                  <div>Hit</div>
                  <div>Score</div>
                  <div>Result</div>
                </div>
                {throws.map((throwData, index) => (
                  <div key={throwData.$id} className="grid grid-cols-7 gap-4 text-sm py-2 border-b border-gray-100">
                    <div className="text-gray-500">{throwData.throwNumber}</div>
                    <div className="text-gray-900">{throwData.turnNumber}</div>
                    <div className="text-gray-900">{throwData.dartNumber}/3</div>
                    <div className="text-gray-900">
                      {throwData.targetSegment !== null ? (
                        <span>
                          {throwData.targetSegment === 25 ? 'Bull' : throwData.targetSegment}
                          {throwData.targetMultiplier && throwData.targetMultiplier > 1 && 
                            ` ×${throwData.targetMultiplier}`}
                        </span>
                      ) : '-'}
                    </div>
                    <div className="text-gray-900">
                      {throwData.segment === 25 ? 'Bull' : throwData.segment}
                      {throwData.multiplier > 1 && ` ×${throwData.multiplier}`}
                    </div>
                    <div className="font-semibold text-orange-600">{throwData.score}</div>
                    <div>
                      {throwData.isHit !== null && (
                        throwData.isHit ? (
                          <span className="text-green-600">✓ Hit</span>
                        ) : (
                          <span className="text-red-600">✗ Miss</span>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Statistics View */}
            {view === 'statistics' && statistics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500">{statistics.totalThrows}</div>
                  <div className="text-sm text-gray-600 mt-1">Total Throws</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{statistics.totalScore}</div>
                  <div className="text-sm text-gray-600 mt-1">Total Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {statistics.averageScore.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Average Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {statistics.accuracy ? `${statistics.accuracy.toFixed(1)}%` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{statistics.bullseyeCount}</div>
                  <div className="text-sm text-gray-600 mt-1">Bullseyes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{statistics.tripleCount}</div>
                  <div className="text-sm text-gray-600 mt-1">Triples</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600">{statistics.doubleCount}</div>
                  <div className="text-sm text-gray-600 mt-1">Doubles</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-600">
                    {Math.max(...throws.map(t => t.turnNumber || 0))}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Total Turns</div>
                </div>
              </div>
            )}

            {/* Heat Map View */}
            {view === 'heatmap' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hit Frequency Heat Map</h3>
                <div className="grid grid-cols-5 gap-2">
                  {[...Array(20)].map((_, i) => {
                    const segment = i + 1;
                    const singles = heatMap[`${segment}-1`] || 0;
                    const doubles = heatMap[`${segment}-2`] || 0;
                    const triples = heatMap[`${segment}-3`] || 0;
                    
                    return (
                      <div key={segment} className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="text-center font-semibold text-gray-900 mb-2">
                          {segment}
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span>S:</span>
                            <div className={`px-2 py-1 rounded ${getSegmentColor(singles, maxHits)} text-white`}>
                              {singles}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>D:</span>
                            <div className={`px-2 py-1 rounded ${getSegmentColor(doubles, maxHits)} text-white`}>
                              {doubles}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>T:</span>
                            <div className={`px-2 py-1 rounded ${getSegmentColor(triples, maxHits)} text-white`}>
                              {triples}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Bull */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="text-center font-semibold text-gray-900 mb-2">Bull</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span>Outer:</span>
                        <div className={`px-2 py-1 rounded ${getSegmentColor(heatMap['25-1'] || 0, maxHits)} text-white`}>
                          {heatMap['25-1'] || 0}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Inner:</span>
                        <div className={`px-2 py-1 rounded ${getSegmentColor(heatMap['25-2'] || 0, maxHits)} text-white`}>
                          {heatMap['25-2'] || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="mt-6 flex items-center justify-center space-x-4">
                  <span className="text-sm text-gray-600">Frequency:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-100 rounded"></div>
                    <span className="text-xs">0</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-400 rounded"></div>
                    <span className="text-xs">Low</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-yellow-600 rounded"></div>
                    <span className="text-xs">Medium</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-red-600 rounded"></div>
                    <span className="text-xs">High</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}