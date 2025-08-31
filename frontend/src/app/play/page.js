"use client";

import { useState, useEffect } from "react";
import VirtualDartboard from "@/components/game/VirtualDartboard";

export default function PlayPage() {
  const [throws, setThrows] = useState([]);
  const [currentScore, setCurrentScore] = useState(501);
  const [currentTurn, setCurrentTurn] = useState([]);
  const [turnHistory, setTurnHistory] = useState([]);
  const [gameMode, setGameMode] = useState('501');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [stats, setStats] = useState({
    totalThrows: 0,
    totalScore: 0,
    doubles: 0,
    triples: 0,
    bulls: 0,
    twenties: 0,
    bestTurn: 0,
    avg: 0
  });

  useEffect(() => {
    // Calculate average
    if (stats.totalThrows > 0) {
      const avg = (stats.totalScore / stats.totalThrows * 3).toFixed(1);
      setStats(prev => ({ ...prev, avg: parseFloat(avg) }));
    }
  }, [stats.totalThrows, stats.totalScore]);

  useEffect(() => {
    // Check for checkout possibility
    setShowCheckout(currentScore > 0 && currentScore <= 170 && gameMode !== 'practice');
  }, [currentScore, gameMode]);

  const handleThrow = (throwData) => {
    if (throwData.undo) {
      // Handle undo
      if (currentTurn.length > 0) {
        const lastThrow = currentTurn[currentTurn.length - 1];
        setCurrentTurn(prev => prev.slice(0, -1));
        
        if (gameMode !== 'practice') {
          setCurrentScore(prev => prev + lastThrow.total);
        }
        
        // Update stats for undo
        setStats(prev => ({
          ...prev,
          totalThrows: Math.max(0, prev.totalThrows - 1),
          totalScore: Math.max(0, prev.totalScore - lastThrow.total),
          doubles: prev.doubles - (lastThrow.multiplier === 2 ? 1 : 0),
          triples: prev.triples - (lastThrow.multiplier === 3 ? 1 : 0),
          bulls: prev.bulls - (lastThrow.value === 'BULL' ? 1 : 0),
          twenties: prev.twenties - (lastThrow.value === 20 ? 1 : 0)
        }));
      }
      return;
    }

    // Animate score change
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    // Add to current turn
    const newTurn = [...currentTurn, throwData];
    setCurrentTurn(newTurn);
    
    // Update score
    if (gameMode !== 'practice') {
      const newScore = currentScore - throwData.total;
      setCurrentScore(Math.max(0, newScore));
      
      // Check for game completion
      if (newScore === 0) {
        handleGameComplete();
      }
    }
    
    // Update throws history
    setThrows(prev => [...prev, throwData]);
    
    // Update statistics
    setStats(prev => {
      const turnTotal = newTurn.reduce((sum, t) => sum + t.total, 0);
      return {
        totalThrows: prev.totalThrows + 1,
        totalScore: prev.totalScore + throwData.total,
        doubles: prev.doubles + (throwData.multiplier === 2 ? 1 : 0),
        triples: prev.triples + (throwData.multiplier === 3 ? 1 : 0),
        bulls: prev.bulls + (throwData.value === 'BULL' ? 1 : 0),
        twenties: prev.twenties + (throwData.value === 20 ? 1 : 0),
        bestTurn: Math.max(prev.bestTurn, turnTotal)
      };
    });

    // Check for turn completion (3 darts)
    if (newTurn.length === 3) {
      completeTurn(newTurn);
    }
  };

  const completeTurn = (turn) => {
    const turnTotal = turn.reduce((sum, t) => sum + t.total, 0);
    setTurnHistory(prev => [...prev, { throws: turn, total: turnTotal, turnNumber: prev.length + 1 }]);
    setCurrentTurn([]);
  };

  const endTurn = () => {
    if (currentTurn.length > 0) {
      completeTurn(currentTurn);
    }
  };

  const handleGameComplete = () => {
    // Show celebration
    alert('🎯 Game Complete! Well done!');
  };

  const resetGame = () => {
    setThrows([]);
    setCurrentScore(gameMode === '501' ? 501 : gameMode === '301' ? 301 : 0);
    setCurrentTurn([]);
    setTurnHistory([]);
    setStats({
      totalThrows: 0,
      totalScore: 0,
      doubles: 0,
      triples: 0,
      bulls: 0,
      twenties: 0,
      bestTurn: 0,
      avg: 0
    });
  };

  // Get checkout suggestions
  const getCheckoutSuggestion = (score) => {
    const checkouts = {
      170: "T20 T20 Bull",
      167: "T20 T19 Bull",
      164: "T20 T18 Bull",
      161: "T20 T17 Bull",
      160: "T20 T20 D20",
      157: "T20 T19 D20",
      120: "T20 20 D20",
      100: "T20 D20",
      80: "T20 D10",
      60: "20 D20",
      40: "D20",
      32: "D16",
      20: "D10",
      16: "D8",
      12: "D6",
      8: "D4",
      4: "D2",
      2: "D1"
    };
    return checkouts[score] || null;
  };

  const checkoutSuggestion = getCheckoutSuggestion(currentScore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="bg-black/30 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-6">
                <a href="/" className="flex items-center space-x-2 group">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition">
                    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                  </div>
                  <span className="font-bold text-xl text-white">Dartmaster</span>
                </a>
                
                <div className="flex items-center space-x-4">
                  <select
                    value={gameMode}
                    onChange={(e) => {
                      setGameMode(e.target.value);
                      setCurrentScore(e.target.value === '501' ? 501 : e.target.value === '301' ? 301 : 0);
                      resetGame();
                    }}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 backdrop-blur"
                  >
                    <option value="501">501</option>
                    <option value="301">301</option>
                    <option value="practice">Practice</option>
                  </select>
                </div>
              </div>

              <button
                onClick={resetGame}
                className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition transform hover:scale-105 shadow-lg"
              >
                New Game
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Panel - Score Display */}
            <div className="lg:col-span-3 space-y-4">
              {/* Main Score */}
              {gameMode !== 'practice' && (
                <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
                      Remaining
                    </div>
                    <div className={`text-6xl font-bold ${isAnimating ? 'animate-bounce' : ''} ${
                      currentScore <= 50 ? 'text-yellow-400' : 'text-white'
                    }`}>
                      {currentScore}
                    </div>
                    
                    {showCheckout && checkoutSuggestion && (
                      <div className="mt-4 p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                        <div className="text-xs text-green-400 mb-1">Suggested Checkout</div>
                        <div className="text-white font-semibold">{checkoutSuggestion}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Current Turn */}
              <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-semibold">Current Turn</h3>
                  {currentTurn.length > 0 && currentTurn.length < 3 && (
                    <button
                      onClick={endTurn}
                      className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                    >
                      End Turn
                    </button>
                  )}
                </div>
                
                <div className="space-y-2">
                  {[0, 1, 2].map((index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg transition-all ${
                        currentTurn[index]
                          ? 'bg-gradient-to-r from-red-600/30 to-red-700/30 border border-red-500/50'
                          : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Dart {index + 1}</span>
                        <span className={`font-bold text-lg ${
                          currentTurn[index] ? 'text-white' : 'text-gray-600'
                        }`}>
                          {currentTurn[index] ? currentTurn[index].display : '–'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Turn Total</span>
                    <span className="text-2xl font-bold text-red-400">
                      {currentTurn.reduce((sum, t) => sum + t.total, 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="text-white font-semibold mb-4">Session Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-2xl font-bold text-white">{stats.avg}</div>
                    <div className="text-xs text-gray-400">Average</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-2xl font-bold text-white">{stats.bestTurn}</div>
                    <div className="text-xs text-gray-400">Best Turn</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-400">{stats.triples}</div>
                    <div className="text-xs text-gray-400">Triples</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-400">{stats.doubles}</div>
                    <div className="text-xs text-gray-400">Doubles</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Center - Dartboard */}
            <div className="lg:col-span-6 flex items-center justify-center">
              <VirtualDartboard
                onThrow={handleThrow}
                size={500}
                showLabels={true}
              />
            </div>

            {/* Right Panel - Turn History */}
            <div className="lg:col-span-3">
              <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 h-full">
                <h3 className="text-white font-semibold mb-4">Turn History</h3>
                <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {turnHistory.length === 0 ? (
                    <div className="text-gray-500 text-center py-12">
                      <div className="text-4xl mb-2">🎯</div>
                      <p>No turns completed yet</p>
                      <p className="text-sm mt-1">Start throwing!</p>
                    </div>
                  ) : (
                    [...turnHistory].reverse().map((turn, index) => (
                      <div
                        key={turn.turnNumber}
                        className={`p-4 rounded-lg transition-all ${
                          index === 0 
                            ? 'bg-gradient-to-r from-red-600/20 to-red-700/20 border border-red-500/30' 
                            : 'bg-white/5 border border-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-400">
                            Turn {turn.turnNumber}
                          </span>
                          <span className={`text-xl font-bold ${
                            turn.total === 180 ? 'text-yellow-400' :
                            turn.total >= 100 ? 'text-green-400' :
                            turn.total >= 60 ? 'text-blue-400' :
                            'text-white'
                          }`}>
                            {turn.total}
                            {turn.total === 180 && ' 🔥'}
                          </span>
                        </div>
                        <div className="flex space-x-1">
                          {turn.throws.map((t, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-white/10 rounded text-xs font-medium text-white"
                            >
                              {t.display}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Stats Bar */}
          <div className="mt-6 bg-black/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <div className="flex justify-around">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.totalThrows}</div>
                <div className="text-xs text-gray-400">Total Darts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.bulls}</div>
                <div className="text-xs text-gray-400">Bulls</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{stats.twenties}</div>
                <div className="text-xs text-gray-400">20s Hit</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {stats.doubles > 0 ? Math.round((stats.doubles / stats.totalThrows) * 100) : 0}%
                </div>
                <div className="text-xs text-gray-400">Double %</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {stats.triples > 0 ? Math.round((stats.triples / stats.totalThrows) * 100) : 0}%
                </div>
                <div className="text-xs text-gray-400">Triple %</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}