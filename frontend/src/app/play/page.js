"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import VirtualDartboard from "@/components/game/VirtualDartboard";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContextV2";
import NotificationBell from "@/components/notifications/NotificationBell";
import ProfileButton from "@/components/layout/ProfileButton";
import AimPicker from "@/components/game/AimPicker";

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
    GAME_MODES,
    currentAim,
    setAim 
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
    if (currentMatch) {
      setShowGameSetup(false);
    }
  }, [currentMatch]);
  
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
      const segment = throwData.value === 'BULL' || throwData.value === 'OUTER_BULL' ? 25 : throwData.value;
      const multiplier = throwData.value === 'BULL' ? 2 : (throwData.value === 'OUTER_BULL' ? 1 : throwData.multiplier);
      throwDart(segment, multiplier);
    }
  };

  const handleEndGame = async () => {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 rounded-full animate-spin border-t-orange-500"></div>
      </div>
    );
  }

  // Game Setup Screen
  if (showGameSetup) {
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
                <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                  Dashboard
                </Link>
                <Link href="/play" className="text-sm font-medium text-gray-900 border-b-2 border-orange-500 pb-1">
                  Play
                </Link>
                <Link href="/practice" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                  Training
                </Link>
                <Link href="/activities" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                  Activities
                </Link>
                <Link href="/me/stats" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                  Stats
                </Link>
                <Link href="/players" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                  Players
                </Link>
                <Link href="/profile" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                  Profile
                </Link>
              </nav>

              <div className="flex items-center space-x-4">
                <NotificationBell />
                <ProfileButton />
              </div>
            </div>
          </div>
        </header>

        {/* Game Setup */}
        <div className="flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-2xl">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Start New Game</h2>
              
              {/* Game Mode Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Game Mode</label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.keys(GAME_MODES).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setSelectedMode(mode)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedMode === mode
                          ? "bg-orange-50 border-orange-500 text-orange-700"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-semibold">{GAME_MODES[mode].name}</div>
                      <div className="text-xs mt-1 opacity-75">{GAME_MODES[mode].description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Player Setup */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Players</label>
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={() => setIsSinglePlayer(true)}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      isSinglePlayer
                        ? "bg-orange-50 border-orange-500 text-orange-700"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Single Player
                  </button>
                  <button
                    onClick={() => setIsSinglePlayer(false)}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      !isSinglePlayer
                        ? "bg-orange-50 border-orange-500 text-orange-700"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition mb-3"
                />
                
                {!isSinglePlayer && (
                  <input
                    type="text"
                    value={opponentName}
                    onChange={(e) => setOpponentName(e.target.value)}
                    placeholder="Player 2 Name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  />
                )}
              </div>

              <div className="flex gap-3">
                <Link href="/dashboard" className="flex-1">
                  <button className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition">
                    Cancel
                  </button>
                </Link>
                <button
                  onClick={handleStartGame}
                  disabled={!playerName || (!isSinglePlayer && !opponentName)}
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg font-semibold transition disabled:cursor-not-allowed"
                >
                  Start Game
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Game Play Screen
  const currentPlayer = getCurrentPlayer();
  const isGameOver = currentMatch?.winner !== null;
  const currentTurnScore = currentDarts.reduce((sum, dart) => sum + (dart.score || 0), 0);
  
  const getDartDisplay = (dart) => {
    if (!dart) return { notation: '-', score: '-', color: 'gray' };
    
    let notation = '';
    let color = 'blue';
    
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-6">
              <Link href="/dashboard" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="font-semibold text-gray-900 text-lg">Dartmaster</span>
              </Link>
              
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {GAME_MODES[currentMatch?.mode || "501"].name}
                </h1>
                <span className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-600">
                  Round {currentMatch?.currentRound || 1}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {currentMatch && !isGameOver && (
                <button
                  onClick={() => setShowEndConfirmation(true)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
                >
                  End Match
                </button>
              )}
              {isGameOver && (
                <button
                  onClick={handleEndGame}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
                >
                  New Game
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Current Throws Display */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-sm font-medium text-gray-700">Current Turn</h3>
              <div className="flex space-x-2">
                {[0, 1, 2].map((index) => {
                  const dart = currentDarts[index];
                  const display = getDartDisplay(dart);
                  
                  return (
                    <div key={index} className={`px-4 py-2 rounded-lg border-2 ${
                      dart
                        ? display.color === 'red'
                          ? 'bg-red-50 border-red-300'
                          : display.color === 'green'
                          ? 'bg-green-50 border-green-300'
                          : 'bg-blue-50 border-blue-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="text-xs text-gray-500 mb-1">Dart {index + 1}</div>
                      <div className="font-semibold text-gray-900">{display.notation}</div>
                      <div className="text-sm text-gray-600">{typeof display.score === 'number' ? display.score : '-'}</div>
                    </div>
                  );
                })}
              </div>
              <div className="pl-4 border-l border-gray-200">
                <div className="text-xs text-gray-500">Total</div>
                <div className="text-2xl font-bold text-gray-900">{currentTurnScore}</div>
              </div>
            </div>
            
            <button
              onClick={undoLastDart}
              disabled={!currentDarts.length || isGameOver}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg text-sm font-medium transition flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span>Undo</span>
            </button>
          </div>
          {/* Aim Picker */}
          <div className="mt-4">
            <AimPicker value={currentAim || undefined} onChange={setAim} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Players Panel */}
          <div className="lg:col-span-3 space-y-4">
            {currentMatch?.players.map((player, index) => (
              <div
                key={player.id}
                className={`bg-white rounded-lg border-2 p-5 transition-all ${
                  currentMatch.currentPlayerIndex === index
                    ? "border-orange-500 shadow-lg"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{player.name}</h3>
                  {currentMatch.currentPlayerIndex === index && !isGameOver && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                      Playing
                    </span>
                  )}
                  {currentMatch.winner?.id === player.id && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      Winner
                    </span>
                  )}
                </div>
                
                {/* Score Display */}
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-gray-900">
                    {player.score || 0}
                  </div>
                  {player.score <= 170 && player.score > 0 && currentMatch.mode !== "cricket" && (
                    <div className="text-sm text-gray-500 mt-1">
                      {player.score === 1 ? "Last dart!" : `${player.score} to go`}
                    </div>
                  )}
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-lg font-semibold text-gray-900">
                      {(player.stats?.averagePerDart || 0).toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">AVG</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-lg font-semibold text-gray-900">
                      {player.stats?.dartsThrown || 0}
                    </div>
                    <div className="text-xs text-gray-500">DARTS</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-lg font-semibold text-gray-900">
                      {player.stats?.highestScore || 0}
                    </div>
                    <div className="text-xs text-gray-500">HIGH</div>
                  </div>
                </div>
                
                {/* Checkout Suggestion */}
                {currentMatch.currentPlayerIndex === index &&
                 !isGameOver &&
                 getCheckoutSuggestion(player.score) && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-xs font-medium text-green-700 mb-1">CHECKOUT</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {getCheckoutSuggestion(player.score)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Dartboard */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <div className="w-full max-w-lg">
              <VirtualDartboard
                onThrow={handleThrow}
                disabled={isGameOver}
                currentTarget={
                  currentMatch?.mode === "aroundTheClock" 
                    ? currentPlayer?.currentTarget 
                    : null
                }
              />
            </div>
          </div>

          {/* History Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 p-5 h-[600px] flex flex-col">
              <h3 className="font-semibold text-gray-900 mb-3">Match History</h3>
              
              <div className="flex-1 overflow-y-auto space-y-2">
                {currentMatch?.turns.length > 0 ? (
                  [...currentMatch.turns].reverse().map((turn, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{turn.player}</span>
                        <span className="text-sm text-gray-500">R{turn.round}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          {turn.darts?.map((dart, i) => (
                            <span key={i} className="text-xs bg-white px-2 py-1 rounded text-gray-700">
                              {dart.multiplier > 1 ? `${dart.multiplier === 2 ? "D" : "T"}` : ""}
                              {dart.segment === 25 ? "Bull" : dart.segment || 0}
                            </span>
                          ))}
                        </div>
                        <span className="font-semibold text-gray-900">{turn.totalScore || 0}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p>No turns yet</p>
                    <p className="text-sm mt-1">Throw your first dart to begin</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* End Match Confirmation Modal */}
      {showEndConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 border border-gray-200 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">End Match?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to end this match? The match will be marked as abandoned.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowEndConfirmation(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEndMatch}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
              >
                End Match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
