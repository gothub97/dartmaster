"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { usePractice } from "@/contexts/PracticeContext";
import VirtualDartboard from "@/components/game/VirtualDartboard";
import ProfileButton from "@/components/layout/ProfileButton";
import NotificationBell from "@/components/notifications/NotificationBell";
import { PracticeIcon } from "@/components/icons/PracticeIcons";

export default function PracticePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const {
    currentSession,
    practiceStats,
    PRACTICE_MODES,
    CHECKOUT_SUGGESTIONS,
    startPracticeSession,
    recordThrow,
    endSession,
    getCheckoutSuggestion,
  } = usePractice();

  const [selectedMode, setSelectedMode] = useState(null);
  const [modeSettings, setModeSettings] = useState({});
  const [showModeSelection, setShowModeSelection] = useState(true);
  const [sessionStats, setSessionStats] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  const handleStartPractice = async () => {
    if (!selectedMode) return;
    
    await startPracticeSession(selectedMode, modeSettings);
    setShowModeSelection(false);
  };

  const handleThrow = async (throwData) => {
    if (!currentSession) return;
    
    const segment = throwData.value === 'BULL' || throwData.value === 'OUTER_BULL' ? 25 : throwData.value;
    const multiplier = throwData.value === 'BULL' ? 2 : (throwData.value === 'OUTER_BULL' ? 1 : throwData.multiplier);
    
    await recordThrow(segment, multiplier);
  };

  const handleEndSession = async () => {
    const endedSession = await endSession();
    setSessionStats(endedSession?.stats);
    setShowModeSelection(true);
    setSelectedMode(null);
    setModeSettings({});
  };

  const renderModeSettings = () => {
    switch (selectedMode) {
      case "target":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Select Targets</h3>
            <div className="grid grid-cols-5 gap-2">
              {[...Array(20)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => {
                    const targets = modeSettings.targets || [];
                    const segment = i + 1;
                    const exists = targets.find(t => t.segment === segment);
                    
                    if (exists) {
                      setModeSettings({
                        ...modeSettings,
                        targets: targets.filter(t => t.segment !== segment)
                      });
                    } else {
                      setModeSettings({
                        ...modeSettings,
                        targets: [...targets, { segment }]
                      });
                    }
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-all ${
                    modeSettings.targets?.find(t => t.segment === i + 1)
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => {
                  const targets = modeSettings.targets || [];
                  const exists = targets.find(t => t.segment === 25);
                  
                  if (exists) {
                    setModeSettings({
                      ...modeSettings,
                      targets: targets.filter(t => t.segment !== 25)
                    });
                  } else {
                    setModeSettings({
                      ...modeSettings,
                      targets: [...targets, { segment: 25 }]
                    });
                  }
                }}
                className={`py-2 px-3 rounded-lg font-medium transition-all ${
                  modeSettings.targets?.find(t => t.segment === 25)
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Bull
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-600">Focus on:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setModeSettings({ ...modeSettings, multiplierFocus: null })}
                  className={`px-4 py-2 rounded-lg transition-colors ${!modeSettings.multiplierFocus ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Any
                </button>
                <button
                  onClick={() => setModeSettings({ ...modeSettings, multiplierFocus: 1 })}
                  className={`px-4 py-2 rounded-lg transition-colors ${modeSettings.multiplierFocus === 1 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Singles
                </button>
                <button
                  onClick={() => setModeSettings({ ...modeSettings, multiplierFocus: 2 })}
                  className={`px-4 py-2 rounded-lg transition-colors ${modeSettings.multiplierFocus === 2 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Doubles
                </button>
                <button
                  onClick={() => setModeSettings({ ...modeSettings, multiplierFocus: 3 })}
                  className={`px-4 py-2 rounded-lg transition-colors ${modeSettings.multiplierFocus === 3 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Triples
                </button>
              </div>
            </div>
          </div>
        );
      
      case "checkout":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Checkout Settings</h3>
            <div>
              <label className="text-sm text-gray-600">Starting Score:</label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {Object.keys(CHECKOUT_SUGGESTIONS).slice(0, 12).map(score => (
                  <button
                    key={score}
                    onClick={() => setModeSettings({ checkoutScore: parseInt(score) })}
                    className={`py-2 px-3 rounded-lg font-medium transition-all ${
                      modeSettings.checkoutScore === parseInt(score)
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {score}
                  </button>
                ))}
                <button
                  onClick={() => setModeSettings({ checkoutScore: null })}
                  className={`py-2 px-3 rounded-lg font-medium transition-all ${
                    !modeSettings.checkoutScore
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Random
                </button>
              </div>
            </div>
          </div>
        );
      
      case "aroundTheClock":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Around the Clock Settings</h3>
            <div className="space-y-2">
              <label className="text-sm text-gray-600">Starting Number:</label>
              <input
                type="number"
                min="1"
                max="20"
                value={modeSettings.startingTarget || 1}
                onChange={(e) => setModeSettings({ startingTarget: parseInt(e.target.value) })}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const loading = authLoading || profileLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 rounded-full animate-spin border-t-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="font-semibold text-gray-900 text-lg">Dartmaster</span>
              </Link>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/play" className="text-sm font-medium text-gray-500 hover:text-gray-900">
                Play
              </Link>
              <Link href="/practice" className="text-sm font-medium text-gray-900 border-b-2 border-orange-500 pb-1">
                Training
              </Link>
              <Link href="/activities" className="text-sm font-medium text-gray-500 hover:text-gray-900">
                Activities
              </Link>
              <Link href="/friends" className="text-sm font-medium text-gray-500 hover:text-gray-900">
                Friends
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <NotificationBell />
              <ProfileButton />
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {showModeSelection ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Session Complete Stats */}
          {sessionStats && (
            <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Session Complete! 🎯</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Throws</p>
                  <p className="text-2xl font-bold text-gray-900">{sessionStats.totalThrows}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Accuracy</p>
                  <p className="text-2xl font-bold text-gray-900">{sessionStats.accuracy?.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">{sessionStats.averageScore?.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Highest Score</p>
                  <p className="text-2xl font-bold text-gray-900">{sessionStats.highestScore}</p>
                </div>
              </div>
            </div>
          )}

          {/* Practice Mode Selection */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Practice Mode</h2>
            <p className="text-gray-600">Select a training mode to improve your skills</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {Object.entries(PRACTICE_MODES).map(([key, mode]) => (
              <button
                key={key}
                onClick={() => setSelectedMode(key)}
                className={`p-6 rounded-lg border-2 transition-all transform hover:scale-[1.02] ${
                  selectedMode === key
                    ? "bg-orange-50 border-orange-500"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="mb-3 text-orange-500">
                  <PracticeIcon type={mode.icon} className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{mode.name}</h3>
                <p className="text-sm text-gray-600">{mode.description}</p>
              </button>
            ))}
          </div>

          {/* Mode Settings */}
          {selectedMode && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {renderModeSettings()}
              
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleStartPractice}
                  disabled={selectedMode === 'target' && (!modeSettings.targets || modeSettings.targets.length === 0)}
                  className="px-8 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                >
                  Start Practice
                </button>
              </div>
            </div>
          )}

          {/* Overall Practice Stats */}
          {practiceStats && practiceStats.totalSessions > 0 && (
            <div className="mt-12 bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Your Practice Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{practiceStats.totalSessions}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Total Throws</p>
                  <p className="text-2xl font-bold text-gray-900">{practiceStats.totalThrows}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Avg Accuracy</p>
                  <p className="text-2xl font-bold text-gray-900">{practiceStats.averageAccuracy?.toFixed(1)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Favorite Mode</p>
                  <div className="flex justify-center">
                    {practiceStats.favoriteMode ? (
                      <div className="text-orange-500">
                        <PracticeIcon type={PRACTICE_MODES[practiceStats.favoriteMode]?.icon} className="w-8 h-8" />
                      </div>
                    ) : (
                      <p className="text-2xl font-bold text-gray-900">-</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Left Panel - Practice Info */}
          <div className="w-96 bg-white border-r border-gray-200 p-6 overflow-y-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {PRACTICE_MODES[currentSession?.mode]?.name}
                </h2>
                <button
                  onClick={handleEndSession}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                >
                  End Practice
                </button>
              </div>
              <p className="text-sm text-gray-600">
                {PRACTICE_MODES[currentSession?.mode]?.description}
              </p>
            </div>

            {/* Mode-specific info */}
            {currentSession?.mode === "target" && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Targets:</p>
                  <div className="flex flex-wrap gap-2">
                    {modeSettings.targets?.map(target => (
                      <span key={`${target.segment}_${target.multiplier}`} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium">
                        {target.segment === 25 ? "Bull" : target.segment}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentSession?.mode === "checkout" && currentSession.currentCheckout && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Current Checkout:</p>
                  <p className="text-3xl font-bold text-gray-900">{currentSession.currentCheckout.remainingScore}</p>
                  {getCheckoutSuggestion(currentSession.currentCheckout.remainingScore) && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">Suggested:</p>
                      <div className="flex gap-2">
                        {getCheckoutSuggestion(currentSession.currentCheckout.remainingScore).map((dart, i) => (
                          <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                            {dart}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentSession?.mode === "aroundTheClock" && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Current Target:</p>
                  <p className="text-4xl font-bold text-gray-900">
                    {currentSession.currentTarget === 25 ? "Bull" : currentSession.currentTarget || 1}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Progress:</p>
                  <div className="flex flex-wrap gap-1">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i + 1}
                        className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium ${
                          currentSession.targetsHit?.includes(i + 1)
                            ? "bg-green-500 text-white"
                            : currentSession.currentTarget === i + 1
                            ? "bg-orange-500 text-white animate-pulse"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {i + 1}
                      </div>
                    ))}
                    <div
                      className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium ${
                        currentSession.targetsHit?.includes(25)
                          ? "bg-green-500 text-white"
                          : currentSession.currentTarget === 25
                          ? "bg-orange-500 text-white animate-pulse"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      B
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Session Stats */}
            <div className="mt-6 space-y-3">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Throws</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {currentSession?.stats?.totalThrows || 0}
                  </span>
                </div>
              </div>
              
              {(currentSession?.mode === "target" || currentSession?.mode === "aroundTheClock" || currentSession?.mode === "cricket") && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Accuracy</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {currentSession?.stats?.accuracy?.toFixed(1) || 0}%
                    </span>
                  </div>
                </div>
              )}
              
              {currentSession?.mode === "freePlay" && (
                <>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Average</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {currentSession?.stats?.averageScore?.toFixed(1) || 0}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Highest</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {currentSession?.stats?.highestScore || 0}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Center - Dartboard */}
          <div className="flex-1 bg-gray-50 flex items-center justify-center p-8">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <VirtualDartboard
                onThrow={handleThrow}
                disabled={false}
              />
            </div>
          </div>

          {/* Right Panel - Recent Throws */}
          <div className="w-96 bg-white border-l border-gray-200 p-6 overflow-hidden flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Throws</h3>
            
            <div className="flex-1 overflow-y-auto space-y-2">
              {currentSession?.throws?.length > 0 ? (
                [...currentSession.throws].reverse().map((throwData, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-gray-500">#{currentSession.throws.length - index}</span>
                        <span className={`font-semibold ${
                          throwData.multiplier === 3 ? "text-green-600" :
                          throwData.multiplier === 2 ? "text-red-600" :
                          "text-blue-600"
                        }`}>
                          {throwData.multiplier > 1 && (throwData.multiplier === 2 ? "D" : "T")}
                          {throwData.segment === 25 ? "Bull" : throwData.segment}
                        </span>
                      </div>
                      <span className="text-xl font-bold text-gray-900">
                        {throwData.score}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <svg className="w-16 h-16 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500">No throws yet</p>
                  <p className="text-xs text-gray-400 mt-1">Start throwing to see your history</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}