"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import VirtualDartboard from "@/components/game/VirtualDartboard";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContextV2";

export default function PlayPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { 
    currentMatch, 
    startNewMatch, 
    throwDart, 
    undoLastDart,
    getSpectatorLink,
    clearCurrentMatch,
    endMatch,
    GAME_MODES 
  } = useGame();
  
  const [showGameSetup, setShowGameSetup] = useState(!currentMatch);
  const [selectedMode, setSelectedMode] = useState("501");
  const [playerName, setPlayerName] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [isSinglePlayer, setIsSinglePlayer] = useState(true);
  const [showTurnAnimation, setShowTurnAnimation] = useState(false);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && !playerName) {
      setPlayerName(user.name || "Player 1");
    }
  }, [user, playerName]);

  useEffect(() => {
    // If we have a current match (from resume), hide the setup screen
    if (currentMatch) {
      setShowGameSetup(false);
    }
  }, [currentMatch]);
  
  // Handle turn completion animation
  const currentDarts = currentMatch?.currentDarts || [];
  useEffect(() => {
    if (currentDarts.length === 3 || (currentDarts.length > 0 && currentMatch?.currentPlayerIndex !== currentMatch?.previousPlayerIndex)) {
      setShowTurnAnimation(true);
      const timer = setTimeout(() => {
        setShowTurnAnimation(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentDarts.length, currentMatch?.currentPlayerIndex]);

  const handleStartGame = async () => {
    const players = [{ name: playerName }];
    if (!isSinglePlayer && opponentName) {
      players.push({ name: opponentName });
    }
    
    await startNewMatch(selectedMode, players);
    setShowGameSetup(false);
  };

  const handleThrow = (throwData) => {
    if (throwData.undo) {
      undoLastDart();
    } else {
      // Convert value to segment (handle bulls separately)
      const segment = throwData.value === 'BULL' || throwData.value === 'OUTER_BULL' ? 25 : throwData.value;
      const multiplier = throwData.value === 'BULL' ? 2 : (throwData.value === 'OUTER_BULL' ? 1 : throwData.multiplier);
      console.log('Throw data:', throwData, 'Segment:', segment, 'Multiplier:', multiplier);
      throwDart(segment, multiplier);
    }
  };

  const handleEndGame = async () => {
    // Clear current match when ending
    clearCurrentMatch();
    setShowGameSetup(true);
  };

  const handleConfirmEndMatch = async () => {
    if (currentMatch) {
      await endMatch(currentMatch.id, "abandoned");
      router.push("/dashboard");
    }
  };

  const getCurrentPlayer = () => {
    if (!currentMatch) return null;
    return currentMatch.players[currentMatch.currentPlayerIndex];
  };

  const getCheckoutSuggestion = (score) => {
    const checkouts = {
      170: "T20 T20 Bull",
      167: "T20 T19 Bull",
      164: "T20 T18 Bull",
      161: "T20 T17 Bull",
      160: "T20 T20 D20",
      158: "T20 T20 D19",
      157: "T20 T19 D20",
      156: "T20 T20 D18",
      155: "T20 T19 D19",
      154: "T20 T18 D20",
      153: "T20 T19 D18",
      152: "T20 T20 D16",
      151: "T20 T17 D20",
      150: "T20 T18 D18",
      // Add more checkout combinations
      100: "T20 D20",
      80: "T20 D10",
      60: "S20 D20",
      40: "D20",
      32: "D16",
      20: "D10",
      16: "D8",
      12: "D6",
      10: "D5",
      8: "D4",
      6: "D3",
      4: "D2",
      2: "D1",
    };
    
    return checkouts[score] || null;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Game Setup Screen
  if (showGameSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-6">New Game</h2>
            
            {/* Game Mode Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">Game Mode</label>
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(GAME_MODES).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setSelectedMode(mode)}
                    className={`p-3 rounded-lg border transition-all ${
                      selectedMode === mode
                        ? "bg-red-600/30 border-red-500 text-white"
                        : "bg-white/5 border-white/20 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    {GAME_MODES[mode].name}
                  </button>
                ))}
              </div>
            </div>

            {/* Player Setup */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">Players</label>
              <div className="flex gap-3 mb-3">
                <button
                  onClick={() => setIsSinglePlayer(true)}
                  className={`flex-1 p-3 rounded-lg border transition-all ${
                    isSinglePlayer
                      ? "bg-blue-600/30 border-blue-500 text-white"
                      : "bg-white/5 border-white/20 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  Single Player
                </button>
                <button
                  onClick={() => setIsSinglePlayer(false)}
                  className={`flex-1 p-3 rounded-lg border transition-all ${
                    !isSinglePlayer
                      ? "bg-blue-600/30 border-blue-500 text-white"
                      : "bg-white/5 border-white/20 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  Two Players
                </button>
              </div>
              
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Player 1 Name"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition mb-3"
              />
              
              {!isSinglePlayer && (
                <input
                  type="text"
                  value={opponentName}
                  onChange={(e) => setOpponentName(e.target.value)}
                  placeholder="Player 2 Name"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                />
              )}
            </div>

            <div className="flex gap-3">
              <Link href="/dashboard" className="flex-1">
                <button className="w-full py-3 bg-gray-600/30 hover:bg-gray-600/40 text-white rounded-lg font-semibold transition border border-gray-500/30">
                  Cancel
                </button>
              </Link>
              <button
                onClick={handleStartGame}
                disabled={!playerName || (!isSinglePlayer && !opponentName)}
                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Game
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Game Play Screen
  const currentPlayer = getCurrentPlayer();
  const isGameOver = currentMatch?.winner !== null;
  
  // Calculate current turn score
  const currentTurnScore = currentDarts.reduce((sum, dart) => sum + (dart.score || 0), 0);
  
  // Get dart display info
  const getDartDisplay = (dart) => {
    if (!dart) return { notation: '-', score: '-', color: 'slate' };
    
    let notation = '';
    let color = 'blue'; // default for singles
    
    if (dart.segment === 25) {
      notation = dart.multiplier === 2 ? 'BULL' : '25';
      color = dart.multiplier === 2 ? 'red' : 'green';
    } else {
      if (dart.multiplier === 3) {
        notation = `T${dart.segment}`;
        color = 'green';
      } else if (dart.multiplier === 2) {
        notation = `D${dart.segment}`;
        color = 'red';
      } else {
        notation = `${dart.segment}`;
        color = 'blue';
      }
    }
    
    return { notation, score: dart.score || 0, color };
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Modern animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-green-900/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 w-full h-screen flex flex-col">
        {/* Sleek Game Header */}
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
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <h1 className="text-xl font-bold text-white">
                    {GAME_MODES[currentMatch?.mode || "501"].name}
                  </h1>
                  <div className="px-3 py-1 bg-slate-800/50 rounded-full">
                    <span className="text-sm text-slate-400">Round {currentMatch?.currentRound || 1}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {currentMatch && (
                  <>
                    <button
                      onClick={() => {
                        const link = getSpectatorLink(currentMatch.id);
                        navigator.clipboard.writeText(link);
                      }}
                      className="p-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white rounded-lg transition-all"
                      title="Copy spectator link"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 2.684a9.001 9.001 0 007.432 4.316m0 0a9.001 9.001 0 007.432-4.316" />
                      </svg>
                    </button>
                    {!isGameOver && (
                      <button
                        onClick={() => setShowEndConfirmation(true)}
                        className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg font-medium transition-all border border-red-500/30"
                      >
                        End Match
                      </button>
                    )}
                  </>
                )}
                {isGameOver && (
                  <button
                    onClick={handleEndGame}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium transition-all shadow-lg shadow-green-900/30"
                  >
                    New Game
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Current Throws Display - Fixed position at top */}
          <div className="flex justify-center py-4 bg-slate-900/30 backdrop-blur-sm border-b border-slate-800/50">
            <div className={`bg-slate-900/60 backdrop-blur-xl rounded-xl p-4 border border-slate-700/30 shadow-xl transition-all duration-300 ${
              showTurnAnimation ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
            }`}>
              <div className="flex items-center space-x-4">
                {/* Three dart slots */}
                <div className="flex space-x-2">
                  {[0, 1, 2].map((index) => {
                    const dart = currentDarts[index];
                    const display = getDartDisplay(dart);
                    const isLatest = index === currentDarts.length - 1 && dart;
                    
                    return (
                      <div
                        key={index}
                        className={`relative transition-all duration-300 ${
                          dart ? 'scale-100' : 'scale-95'
                        }`}
                      >
                        {isLatest && (
                          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg opacity-30 blur animate-pulse"></div>
                        )}
                        <div className={`relative w-28 h-16 rounded-lg border-2 transition-all ${
                          dart
                            ? display.color === 'red'
                              ? 'bg-red-500/10 border-red-500/50'
                              : display.color === 'green'
                              ? 'bg-green-500/10 border-green-500/50'
                              : 'bg-blue-500/10 border-blue-500/50'
                            : 'bg-slate-800/30 border-slate-700/30'
                        }`}>
                          <div className="flex flex-col items-center justify-center h-full">
                            <div className="text-[10px] font-medium text-slate-400">
                              #{index + 1}
                            </div>
                            <div className={`text-sm font-bold ${
                              dart
                                ? display.color === 'red'
                                  ? 'text-red-400'
                                  : display.color === 'green'
                                  ? 'text-green-400'
                                  : 'text-blue-400'
                                : 'text-slate-600'
                            }`}>
                              {display.notation}
                            </div>
                            <div className={`text-lg font-bold ${
                              dart ? 'text-white' : 'text-slate-600'
                            }`}>
                              {typeof display.score === 'number' ? display.score : '-'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Total Score */}
                <div className="pl-4 border-l-2 border-slate-700/50">
                  <div className="text-xs text-slate-400">Total</div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    {currentTurnScore}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main game area */}
          <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Players & Stats */}
          <div className="w-80 bg-slate-900/30 backdrop-blur-xl border-r border-slate-800/50 p-6 overflow-y-auto">
            <div className="space-y-4">
              {currentMatch?.players.map((player, index) => (
                <div
                  key={player.id}
                  className={`relative rounded-xl p-5 transition-all duration-300 ${
                    currentMatch.currentPlayerIndex === index
                      ? "bg-gradient-to-br from-red-600/20 to-orange-600/20 border-2 border-red-500/50 shadow-2xl shadow-red-500/20 scale-[1.02]"
                      : "bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/40"
                  }`}
                >
                  {currentMatch.currentPlayerIndex === index && !isGameOver && (
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl opacity-20 blur animate-pulse"></div>
                  )}
                  
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                          currentMatch.currentPlayerIndex === index
                            ? "bg-gradient-to-br from-red-500 to-orange-500 text-white"
                            : "bg-slate-700/50 text-slate-400"
                        }`}>
                          {index + 1}
                        </div>
                        <h3 className="text-lg font-semibold text-white">{player.name}</h3>
                      </div>
                      {currentMatch.currentPlayerIndex === index && !isGameOver && (
                        <span className="flex items-center space-x-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></span>
                          <span>Playing</span>
                        </span>
                      )}
                      {currentMatch.winner?.id === player.id && (
                        <span className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-yellow-500/20 to-green-500/20 text-green-400 text-xs rounded-full font-medium">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span>Winner</span>
                        </span>
                      )}
                    </div>
                    
                    {/* Score Display */}
                    <div className="mb-4">
                      {currentMatch.mode === "cricket" ? (
                        <div>
                          <div className="text-4xl font-bold text-white mb-3">
                            {player.score || 0}
                            <span className="text-sm font-normal text-slate-400 ml-2">pts</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5">
                            {GAME_MODES.cricket.targets.map(target => {
                              const marks = player.cricketMarks?.[target] || 0;
                              const closed = marks >= 3;
                              return (
                                <div key={target} className={`rounded-lg p-2 transition-all ${
                                  closed ? "bg-green-500/20 border border-green-500/30" : "bg-slate-700/30 border border-slate-600/20"
                                }`}>
                                  <div className={`text-xs font-medium mb-1 ${
                                    closed ? "text-green-400" : "text-slate-400"
                                  }`}>
                                    {target === 25 ? "B" : target}
                                  </div>
                                  <div className="flex space-x-0.5">
                                    {[1, 2, 3].map(i => (
                                      <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${
                                        i <= marks
                                          ? closed ? "bg-green-400" : "bg-red-400"
                                          : "bg-slate-600/50"
                                      }`} />
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : currentMatch.mode === "aroundTheClock" ? (
                        <div className="text-center">
                          <div className="text-sm text-slate-400 mb-1">Current Target</div>
                          <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            {player.currentTarget === 25 ? "Bull" : player.currentTarget}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-6xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                            {player.score || 0}
                          </div>
                          {player.score <= 170 && player.score > 0 && (
                            <div className="text-sm text-slate-500 mt-1">
                              {player.score === 1 ? "Last dart!" : `${player.score} to go`}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Player Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-700/20 rounded-lg p-2 text-center">
                        <div className="text-2xl font-bold text-white">
                          {(player.stats?.averagePerDart || 0).toFixed(1)}
                        </div>
                        <div className="text-xs text-slate-500">AVG</div>
                      </div>
                      <div className="bg-slate-700/20 rounded-lg p-2 text-center">
                        <div className="text-2xl font-bold text-white">
                          {player.stats?.dartsThrown || 0}
                        </div>
                        <div className="text-xs text-slate-500">DARTS</div>
                      </div>
                      <div className="bg-slate-700/20 rounded-lg p-2 text-center">
                        <div className="text-2xl font-bold text-white">
                          {player.stats?.highestScore || 0}
                        </div>
                        <div className="text-xs text-slate-500">HIGH</div>
                      </div>
                    </div>
                    
                    {/* Checkout Suggestion */}
                    {currentMatch.mode !== "cricket" && 
                     currentMatch.mode !== "aroundTheClock" &&
                     currentMatch.currentPlayerIndex === index &&
                     !isGameOver &&
                     getCheckoutSuggestion(player.score) && (
                      <div className="mt-3 p-3 bg-gradient-to-r from-green-600/10 to-emerald-600/10 border border-green-500/20 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <p className="text-xs text-green-400 font-medium">CHECKOUT</p>
                        </div>
                        <p className="text-lg font-bold text-white mt-1">
                          {getCheckoutSuggestion(player.score)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center - Dartboard */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-2xl w-full">
              <VirtualDartboard
                onThrow={handleThrow}
                disabled={isGameOver}
                currentTarget={
                  currentMatch?.mode === "aroundTheClock" 
                    ? currentPlayer?.currentTarget 
                    : null
                }
              />
              
              {/* Quick Actions */}
              <div className="flex items-center justify-center space-x-4 mt-6">
                <button
                  onClick={undoLastDart}
                  disabled={!currentDarts.length || isGameOver}
                  className="px-6 py-3 bg-slate-800/50 hover:bg-slate-700/50 disabled:bg-slate-800/20 disabled:text-slate-600 text-white rounded-lg font-medium transition-all flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <span>Undo</span>
                </button>
                
                {!isGameOver && (
                  <button
                    onClick={handleEndGame}
                    className="px-6 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium transition-all border border-red-500/30 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>End Game</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Turn History */}
          <div className="w-96 bg-slate-900/30 backdrop-blur-xl border-l border-slate-800/50 p-6 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Match History</h3>
              <span className="text-xs text-slate-500">
                {currentMatch?.turns.length || 0} turns
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
              {currentMatch?.turns.length > 0 ? (
                [...currentMatch.turns].reverse().map((turn, index) => {
                  const isLatest = index === 0;
                  return (
                    <div 
                      key={index} 
                      className={`rounded-lg p-3 transition-all ${
                        isLatest 
                          ? "bg-gradient-to-r from-slate-800/40 to-slate-700/40 border border-slate-600/30" 
                          : "bg-slate-800/20 hover:bg-slate-800/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium text-slate-500">
                            R{turn.round}
                          </span>
                          <span className="text-sm font-medium text-white">
                            {turn.player}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xl font-bold text-white">
                            {turn.totalScore || 0}
                          </span>
                          {turn.totalScore >= 100 && (
                            <span className="text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded font-medium">
                              TON{turn.totalScore >= 180 ? "+80" : turn.totalScore >= 140 ? "+40" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {turn.darts && turn.darts.map((dart, i) => (
                          <div 
                            key={i} 
                            className="flex-1 bg-slate-700/30 rounded px-2 py-1 text-center"
                          >
                            <span className="text-sm font-medium text-slate-300">
                              {dart.multiplier > 1 ? `${dart.multiplier === 2 ? "D" : "T"}` : ""}
                              {dart.segment === 25 ? "Bull" : dart.segment || 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <svg className="w-16 h-16 text-slate-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-slate-500">No turns yet</p>
                  <p className="text-xs text-slate-600 mt-1">Throw your first dart to begin</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* End Match Confirmation Modal */}
      {showEndConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full mx-4 border border-slate-700/50 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-3">End Match?</h3>
            <p className="text-slate-400 mb-6">
              Are you sure you want to end this match? The match will be marked as abandoned and you'll return to the dashboard.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowEndConfirmation(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEndMatch}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all"
              >
                End Match
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-out {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.9);
          }
        }
        
        .animate-fade-out {
          animation: fade-out 0.3s ease-out forwards;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.5);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(51, 65, 85, 0.8);
        }
      `}</style>
    </div>
  );
}