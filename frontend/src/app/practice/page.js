"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { usePractice } from "@/contexts/PracticeContext";
import VirtualDartboard from "@/components/game/VirtualDartboard";

export default function PracticePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
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
            <h3 className="text-lg font-semibold text-white">Select Targets</h3>
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
                      ? "bg-red-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
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
                    ? "bg-red-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                Bull
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Focus on:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setModeSettings({ ...modeSettings, multiplierFocus: null })}
                  className={`px-4 py-2 rounded-lg ${!modeSettings.multiplierFocus ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  Any
                </button>
                <button
                  onClick={() => setModeSettings({ ...modeSettings, multiplierFocus: 1 })}
                  className={`px-4 py-2 rounded-lg ${modeSettings.multiplierFocus === 1 ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  Singles
                </button>
                <button
                  onClick={() => setModeSettings({ ...modeSettings, multiplierFocus: 2 })}
                  className={`px-4 py-2 rounded-lg ${modeSettings.multiplierFocus === 2 ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  Doubles
                </button>
                <button
                  onClick={() => setModeSettings({ ...modeSettings, multiplierFocus: 3 })}
                  className={`px-4 py-2 rounded-lg ${modeSettings.multiplierFocus === 3 ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}
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
            <h3 className="text-lg font-semibold text-white">Checkout Settings</h3>
            <div>
              <label className="text-sm text-slate-400">Starting Score:</label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {Object.keys(CHECKOUT_SUGGESTIONS).slice(0, 12).map(score => (
                  <button
                    key={score}
                    onClick={() => setModeSettings({ checkoutScore: parseInt(score) })}
                    className={`py-2 px-3 rounded-lg font-medium transition-all ${
                      modeSettings.checkoutScore === parseInt(score)
                        ? "bg-red-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {score}
                  </button>
                ))}
                <button
                  onClick={() => setModeSettings({ checkoutScore: null })}
                  className={`py-2 px-3 rounded-lg font-medium transition-all ${
                    !modeSettings.checkoutScore
                      ? "bg-green-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
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
            <h3 className="text-lg font-semibold text-white">Around the Clock Settings</h3>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Starting Number:</label>
              <input
                type="number"
                min="1"
                max="20"
                value={modeSettings.startingTarget || 1}
                onChange={(e) => setModeSettings({ startingTarget: parseInt(e.target.value) })}
                className="w-20 px-3 py-2 bg-slate-800 text-white rounded-lg"
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50">
          <div className="max-w-8xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <Link href="/dashboard" className="group flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="text-sm font-medium">Back</span>
                </Link>
                
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <h1 className="text-xl font-bold text-white">Practice Mode</h1>
                </div>
              </div>
              
              {currentSession && (
                <button
                  onClick={handleEndSession}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg font-medium transition-all border border-red-500/30"
                >
                  End Practice
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        {showModeSelection ? (
          <div className="max-w-6xl mx-auto px-6 py-12">
            {sessionStats && (
              <div className="mb-8 p-6 bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50">
                <h2 className="text-xl font-bold text-white mb-4">Session Complete!</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Total Throws</p>
                    <p className="text-2xl font-bold text-white">{sessionStats.totalThrows}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Accuracy</p>
                    <p className="text-2xl font-bold text-white">{sessionStats.accuracy?.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Average Score</p>
                    <p className="text-2xl font-bold text-white">{sessionStats.averageScore?.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Highest Score</p>
                    <p className="text-2xl font-bold text-white">{sessionStats.highestScore}</p>
                  </div>
                </div>
              </div>
            )}

            <h2 className="text-2xl font-bold text-white mb-6">Choose Practice Mode</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {Object.entries(PRACTICE_MODES).map(([key, mode]) => (
                <button
                  key={key}
                  onClick={() => setSelectedMode(key)}
                  className={`p-6 rounded-2xl border transition-all transform hover:scale-[1.02] ${
                    selectedMode === key
                      ? "bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-purple-500/50"
                      : "bg-slate-900/50 backdrop-blur-xl border-slate-800/50 hover:border-slate-700/50"
                  }`}
                >
                  <div className="text-4xl mb-3">{mode.icon}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">{mode.name}</h3>
                  <p className="text-sm text-slate-400">{mode.description}</p>
                </button>
              ))}
            </div>

            {selectedMode && (
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800/50">
                {renderModeSettings()}
                
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleStartPractice}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-purple-900/30"
                  >
                    Start Practice
                  </button>
                </div>
              </div>
            )}

            {/* Overall Practice Stats */}
            {practiceStats && practiceStats.totalSessions > 0 && (
              <div className="mt-12 bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800/50">
                <h3 className="text-xl font-bold text-white mb-4">Your Practice Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Total Sessions</p>
                    <p className="text-2xl font-bold text-white">{practiceStats.totalSessions}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Total Throws</p>
                    <p className="text-2xl font-bold text-white">{practiceStats.totalThrows}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Avg Accuracy</p>
                    <p className="text-2xl font-bold text-white">{practiceStats.averageAccuracy?.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Favorite Mode</p>
                    <p className="text-2xl font-bold text-white">
                      {practiceStats.favoriteMode ? PRACTICE_MODES[practiceStats.favoriteMode]?.icon : "-"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-[calc(100vh-80px)]">
            {/* Left Panel - Practice Info */}
            <div className="w-96 bg-slate-900/30 backdrop-blur-xl border-r border-slate-800/50 p-6 overflow-y-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-2">
                  {PRACTICE_MODES[currentSession?.mode]?.name}
                </h2>
                <p className="text-sm text-slate-400">
                  {PRACTICE_MODES[currentSession?.mode]?.description}
                </p>
              </div>

              {/* Mode-specific info */}
              {currentSession?.mode === "target" && (
                <div className="space-y-4">
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <p className="text-sm text-slate-400 mb-2">Targets:</p>
                    <div className="flex flex-wrap gap-2">
                      {modeSettings.targets?.map(target => (
                        <span key={`${target.segment}_${target.multiplier}`} className="px-3 py-1 bg-purple-600/30 text-purple-400 rounded-lg text-sm">
                          {target.segment === 25 ? "Bull" : target.segment}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentSession?.mode === "checkout" && currentSession.currentCheckout && (
                <div className="space-y-4">
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <p className="text-sm text-slate-400 mb-2">Current Checkout:</p>
                    <p className="text-3xl font-bold text-white">{currentSession.currentCheckout.remainingScore}</p>
                    {getCheckoutSuggestion(currentSession.currentCheckout.remainingScore) && (
                      <div className="mt-3">
                        <p className="text-xs text-slate-500 mb-1">Suggested:</p>
                        <div className="flex gap-2">
                          {getCheckoutSuggestion(currentSession.currentCheckout.remainingScore).map((dart, i) => (
                            <span key={i} className="px-2 py-1 bg-green-600/30 text-green-400 rounded text-sm">
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
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <p className="text-sm text-slate-400 mb-2">Current Target:</p>
                    <p className="text-4xl font-bold text-white">
                      {currentSession.currentTarget === 25 ? "Bull" : currentSession.currentTarget || 1}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <p className="text-sm text-slate-400 mb-2">Progress:</p>
                    <div className="flex flex-wrap gap-1">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i + 1}
                          className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium ${
                            currentSession.targetsHit?.includes(i + 1)
                              ? "bg-green-600/30 text-green-400"
                              : currentSession.currentTarget === i + 1
                              ? "bg-purple-600/30 text-purple-400 animate-pulse"
                              : "bg-slate-700/30 text-slate-500"
                          }`}
                        >
                          {i + 1}
                        </div>
                      ))}
                      <div
                        className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium ${
                          currentSession.targetsHit?.includes(25)
                            ? "bg-green-600/30 text-green-400"
                            : currentSession.currentTarget === 25
                            ? "bg-purple-600/30 text-purple-400 animate-pulse"
                            : "bg-slate-700/30 text-slate-500"
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
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Throws</span>
                    <span className="text-lg font-semibold text-white">
                      {currentSession?.stats?.totalThrows || 0}
                    </span>
                  </div>
                </div>
                
                {(currentSession?.mode === "target" || currentSession?.mode === "aroundTheClock" || currentSession?.mode === "cricket") && (
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Accuracy</span>
                      <span className="text-lg font-semibold text-white">
                        {currentSession?.stats?.accuracy?.toFixed(1) || 0}%
                      </span>
                    </div>
                  </div>
                )}
                
                {currentSession?.mode === "freePlay" && (
                  <>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Average</span>
                        <span className="text-lg font-semibold text-white">
                          {currentSession?.stats?.averageScore?.toFixed(1) || 0}
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Highest</span>
                        <span className="text-lg font-semibold text-white">
                          {currentSession?.stats?.highestScore || 0}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Center - Dartboard */}
            <div className="flex-1 flex items-center justify-center p-8">
              <VirtualDartboard
                onThrow={handleThrow}
                disabled={false}
              />
            </div>

            {/* Right Panel - Recent Throws */}
            <div className="w-96 bg-slate-900/30 backdrop-blur-xl border-l border-slate-800/50 p-6 overflow-hidden flex flex-col">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Throws</h3>
              
              <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                {currentSession?.throws?.length > 0 ? (
                  [...currentSession.throws].reverse().map((throwData, index) => (
                    <div
                      key={index}
                      className="bg-slate-800/30 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-slate-500">#{currentSession.throws.length - index}</span>
                          <span className={`font-semibold ${
                            throwData.multiplier === 3 ? "text-green-400" :
                            throwData.multiplier === 2 ? "text-red-400" :
                            "text-blue-400"
                          }`}>
                            {throwData.multiplier > 1 && (throwData.multiplier === 2 ? "D" : "T")}
                            {throwData.segment === 25 ? "Bull" : throwData.segment}
                          </span>
                        </div>
                        <span className="text-xl font-bold text-white">
                          {throwData.score}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <svg className="w-16 h-16 text-slate-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-slate-500">No throws yet</p>
                    <p className="text-xs text-slate-600 mt-1">Start throwing to see your history</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}