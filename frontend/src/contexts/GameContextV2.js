"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { client, databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { useAuth } from "./AuthContext";

const GameContext = createContext({});

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};

// Game modes configuration
const GAME_MODES = {
  "501": {
    name: "501",
    startingScore: 501,
    requireDoubleOut: true,
    requireDoubleIn: false,
  },
  "301": {
    name: "301", 
    startingScore: 301,
    requireDoubleOut: true,
    requireDoubleIn: true,
  },
  cricket: {
    name: "Cricket",
    targets: [20, 19, 18, 17, 16, 15, 25],
    requireClose: true,
  },
  aroundTheClock: {
    name: "Around the Clock",
    targets: Array.from({ length: 20 }, (_, i) => i + 1).concat([25]),
    sequential: true,
  },
};

export const GameProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentMatch, setCurrentMatch] = useState(null);
  const [activeMatches, setActiveMatches] = useState([]);
  const [matchHistory, setMatchHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);
  const [subscription, setSubscription] = useState(null);

  const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

  // Initialize a new match and save to Appwrite
  const startNewMatch = async (mode = "501", players = []) => {
    if (!user) return null;

    const gameConfig = GAME_MODES[mode];
    
    const matchState = {
      mode,
      config: gameConfig,
      players: players.map((player, index) => ({
        id: player.id || ID.unique(),
        name: player.name,
        userId: index === 0 ? user.$id : null,
        score: mode === "cricket" || mode === "aroundTheClock" ? 0 : (gameConfig.startingScore || 501),
        darts: [],
        stats: {
          dartsThrown: 0,
          totalScore: 0,
          doubles: 0,
          triples: 0,
          bullseyes: 0,
          highestCheckout: 0,
          averagePerDart: 0,
          averagePerRound: 0,
          highestScore: 0,
        },
        cricketMarks: mode === "cricket" ? {} : null,
        currentTarget: mode === "aroundTheClock" ? 1 : null,
      })),
      currentPlayerIndex: 0,
      currentRound: 1,
      currentDartInTurn: 0,
      currentDarts: [], // Track current turn's darts
      winner: null,
      turns: [],
      spectators: [],
    };

    // Initialize cricket marks
    if (mode === "cricket") {
      gameConfig.targets.forEach(target => {
        matchState.players.forEach(player => {
          player.cricketMarks[target] = 0;
        });
      });
    }

    try {
      setIsLoading(true);
      
      // Create match document in Appwrite
      const matchDoc = await databases.createDocument(
        DATABASE_ID,
        "matches",
        ID.unique(),
        {
          userId: user.$id,
          mode,
          status: "active",
          players: JSON.stringify(players.map(p => ({ name: p.name, userId: p.userId }))),
          currentState: JSON.stringify(matchState),
          startedAt: new Date().toISOString(),
        }
      );

      const match = {
        id: matchDoc.$id,
        ...matchState,
        startedAt: matchDoc.startedAt,
      };

      setCurrentMatch(match);
      subscribeToMatch(matchDoc.$id);
      
      return match;
    } catch (error) {
      console.error("Error creating match:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to real-time match updates
  const subscribeToMatch = (matchId) => {
    if (subscription) {
      subscription();
    }

    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.matches.documents.${matchId}`,
      (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.update')) {
          const updatedMatch = response.payload;
          const state = JSON.parse(updatedMatch.currentState);
          setCurrentMatch(prev => ({
            ...prev,
            ...state,
            id: updatedMatch.$id,
          }));
        }
      }
    );

    setSubscription(() => unsubscribe);
  };

  // Auto-save match state
  const saveMatchState = useCallback(async (match) => {
    if (!match || !match.id) return;

    try {
      const matchState = { ...match };
      delete matchState.id;
      delete matchState.startedAt;

      await databases.updateDocument(
        DATABASE_ID,
        "matches",
        match.id,
        {
          currentState: JSON.stringify(matchState),
          status: match.winner ? "completed" : "active",
          finishedAt: match.winner ? new Date().toISOString() : null,
        }
      );
    } catch (error) {
      console.error("Error saving match state:", error);
    }
  }, [DATABASE_ID]);

  // Process a dart throw with auto-save
  const throwDart = async (segment, multiplier = 1) => {
    if (!currentMatch || currentMatch.winner) return;

    const match = { ...currentMatch };
    const player = match.players[match.currentPlayerIndex];
    const score = segment === 25 ? (multiplier === 2 ? 50 : 25) : segment * multiplier;

    // Initialize currentDarts if it doesn't exist (for existing matches)
    if (!match.currentDarts) {
      match.currentDarts = [];
    }

    // Add dart to current turn
    const dart = { segment, multiplier, score, timestamp: new Date().toISOString() };
    player.darts.push(dart);
    match.currentDarts.push(dart); // Add to current darts array
    
    // Update stats
    player.stats.dartsThrown++;
    player.stats.totalScore += score;
    player.stats.averagePerDart = player.stats.totalScore / player.stats.dartsThrown;
    if (score > player.stats.highestScore) player.stats.highestScore = score;
    
    if (multiplier === 2) player.stats.doubles++;
    if (multiplier === 3) player.stats.triples++;
    if (segment === 25) player.stats.bullseyes++;

    // Game mode specific logic
    switch (match.mode) {
      case "501":
      case "301":
        handleStandardGame(match, player, score, segment, multiplier);
        break;
      case "cricket":
        handleCricketGame(match, player, segment, multiplier);
        break;
      case "aroundTheClock":
        handleAroundTheClock(match, player, segment);
        break;
    }

    // Move to next dart or player
    match.currentDartInTurn++;
    
    // If turn is complete (3 darts thrown), save turn to history
    if (match.currentDartInTurn >= 3 || match.winner) {
      // Save turn to history
      const turnDarts = match.currentDarts.length > 0 ? [...match.currentDarts] : player.darts.slice(-3);
      const turn = {
        round: match.currentRound,
        player: player.name,
        playerId: player.id,
        darts: turnDarts,
        totalScore: turnDarts.reduce((sum, d) => {
          // Calculate score if not present
          const dartScore = d.score || (d.segment === 25 ? (d.multiplier === 2 ? 50 : 25) : d.segment * d.multiplier);
          return sum + dartScore;
        }, 0),
        timestamp: new Date().toISOString(),
      };
      match.turns.push(turn);

      // Calculate round average
      const rounds = Math.ceil(player.darts.length / 3);
      player.stats.averagePerRound = player.stats.totalScore / rounds;
    }

    setCurrentMatch(match);
    
    // If turn is complete (3 darts thrown or winner), schedule the transition to next player
    if (match.currentDartInTurn >= 3 || match.winner) {
      setTimeout(() => {
        setCurrentMatch(prev => {
          if (!prev) return prev;
          // Only transition if we still have 3 darts thrown (prevents clearing if user undid)
          if (prev.currentDartInTurn < 3 && !prev.winner) return prev;
          
          const updatedMatch = { ...prev };
          updatedMatch.currentDartInTurn = 0;
          updatedMatch.currentDarts = []; // Clear current darts for next turn
          updatedMatch.currentPlayerIndex = (updatedMatch.currentPlayerIndex + 1) % updatedMatch.players.length;
          updatedMatch.turnComplete = false;
          
          // New round if back to first player
          if (updatedMatch.currentPlayerIndex === 0) {
            updatedMatch.currentRound++;
          }
          
          // Auto-save the state
          saveMatchState(updatedMatch);
          
          return updatedMatch;
        });
      }, 2000); // Show complete turn for 2 seconds
    }
    
    // Auto-save with debounce
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    const timer = setTimeout(() => saveMatchState(match), 1000);
    setAutoSaveTimer(timer);

    return match;
  };

  // Handle 501/301 game logic
  const handleStandardGame = (match, player, score, segment, multiplier) => {
    const newScore = player.score - score;
    const config = match.config;

    // Check for bust
    if (newScore < 0 || (newScore === 0 && config.requireDoubleOut && multiplier !== 2)) {
      // Bust - reset score to turn start
      const turnStart = Math.max(0, player.darts.length - match.currentDartInTurn - 1);
      const turnDarts = player.darts.slice(turnStart);
      const turnScore = turnDarts.reduce((sum, d) => sum + d.score, 0);
      player.score += turnScore - score;
      match.currentDartInTurn = 3; // End turn
    } else if (newScore === 0 && (!config.requireDoubleOut || multiplier === 2)) {
      // Valid checkout
      player.score = 0;
      const checkoutScore = player.score + score;
      player.stats.highestCheckout = Math.max(player.stats.highestCheckout, checkoutScore);
      match.winner = player;
    } else {
      // Valid throw
      player.score = newScore;
    }
  };

  // Handle Cricket game logic
  const handleCricketGame = (match, player, segment, multiplier) => {
    const config = match.config;
    
    if (!config.targets.includes(segment)) return;

    const currentMarks = player.cricketMarks[segment] || 0;
    const newMarks = Math.min(currentMarks + multiplier, 3);
    player.cricketMarks[segment] = newMarks;

    // If segment is closed and opponents haven't closed it, score points
    if (newMarks === 3) {
      const extraHits = (currentMarks + multiplier) - 3;
      if (extraHits > 0) {
        const opponents = match.players.filter(p => p.id !== player.id);
        const canScore = opponents.some(opp => (opp.cricketMarks[segment] || 0) < 3);
        
        if (canScore) {
          const points = segment === 25 ? 25 * extraHits : segment * extraHits;
          player.score = (player.score || 0) + points;
        }
      }
    }

    // Check for winner
    const allClosed = config.targets.every(target => player.cricketMarks[target] === 3);
    if (allClosed) {
      const scores = match.players.map(p => ({ player: p, score: p.score || 0 }));
      scores.sort((a, b) => b.score - a.score);
      
      if (scores[0].player.id === player.id || match.players.length === 1) {
        match.winner = player;
      }
    }
  };

  // Handle Around the Clock logic
  const handleAroundTheClock = (match, player, segment) => {
    if (segment === player.currentTarget) {
      if (player.currentTarget === 20) {
        player.currentTarget = 25; // Next is bullseye
      } else if (segment === 25) {
        // Winner!
        match.winner = player;
      } else {
        player.currentTarget++;
      }
    }
  };

  // Undo last dart
  const undoLastDart = async () => {
    if (!currentMatch) return;

    const match = { ...currentMatch };
    const player = match.players[match.currentPlayerIndex];

    // Initialize currentDarts if it doesn't exist
    if (!match.currentDarts) {
      match.currentDarts = [];
    }

    // Check if there are darts to undo in current turn
    if (match.currentDarts.length === 0) {
      // No darts in current turn, can't undo from previous turn
      return;
    }

    // Remove last dart from both arrays
    const removedDart = player.darts.pop();
    match.currentDarts.pop();
    match.currentDartInTurn--;
    
    if (!removedDart) return;
    const score = removedDart.score || 0;

    // Remove the last dart
    const lastDart = player.darts.pop();
    if (!lastDart) return;

    // Revert stats
    player.stats.dartsThrown--;
    player.stats.totalScore -= lastDart.score;
    if (player.stats.dartsThrown > 0) {
      player.stats.averagePerDart = player.stats.totalScore / player.stats.dartsThrown;
    }
    
    if (lastDart.multiplier === 2) player.stats.doubles--;
    if (lastDart.multiplier === 3) player.stats.triples--;
    if (lastDart.segment === 25) player.stats.bullseyes--;

    // Revert game-specific changes
    switch (match.mode) {
      case "501":
      case "301":
        player.score += lastDart.score;
        break;
      case "cricket":
        if (match.config.targets.includes(lastDart.segment)) {
          player.cricketMarks[lastDart.segment] = Math.max(0, 
            (player.cricketMarks[lastDart.segment] || 0) - lastDart.multiplier);
        }
        break;
      case "aroundTheClock":
        // Complex undo for around the clock
        if (player.currentTarget === 25 && lastDart.segment === 20) {
          player.currentTarget = 20;
        } else if (player.currentTarget === lastDart.segment + 1) {
          player.currentTarget = lastDart.segment;
        }
        break;
    }

    // Remove from turn history if needed
    const lastTurn = match.turns[match.turns.length - 1];
    if (lastTurn && lastTurn.playerId === player.id) {
      const dartIndex = lastTurn.darts.findIndex(d => 
        d.segment === lastDart.segment && 
        d.multiplier === lastDart.multiplier
      );
      if (dartIndex >= 0) {
        lastTurn.darts.splice(dartIndex, 1);
        lastTurn.totalScore -= lastDart.score;
      }
      if (lastTurn.darts.length === 0) {
        match.turns.pop();
      }
    }

    // Clear winner if it was just set
    if (match.winner?.id === player.id) {
      match.winner = null;
    }

    setCurrentMatch(match);
    await saveMatchState(match);
  };

  // Load active matches
  const loadActiveMatches = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        "matches",
        [
          Query.equal("userId", user.$id),
          Query.equal("status", "active"),
          Query.orderDesc("$createdAt"),
          Query.limit(10),
        ]
      );

      const matches = response.documents.map(doc => ({
        id: doc.$id,
        ...JSON.parse(doc.currentState),
        startedAt: doc.startedAt,
      }));

      setActiveMatches(matches);
      return matches;
    } catch (error) {
      console.error("Error loading active matches:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Resume a match
  const resumeMatch = async (matchId) => {
    setIsLoading(true);
    try {
      const doc = await databases.getDocument(
        DATABASE_ID,
        "matches",
        matchId
      );

      const parsedState = JSON.parse(doc.currentState);
      
      // Initialize currentDarts if it doesn't exist (for older matches)
      if (!parsedState.currentDarts) {
        parsedState.currentDarts = [];
      }
      
      // Ensure all players have proper stats structure
      if (parsedState.players) {
        parsedState.players = parsedState.players.map(player => ({
          ...player,
          score: player.score ?? 0,
          stats: {
            dartsThrown: player.stats?.dartsThrown || 0,
            totalScore: player.stats?.totalScore || 0,
            doubles: player.stats?.doubles || 0,
            triples: player.stats?.triples || 0,
            bullseyes: player.stats?.bullseyes || 0,
            highestCheckout: player.stats?.highestCheckout || 0,
            averagePerDart: player.stats?.averagePerDart || 0,
            averagePerRound: player.stats?.averagePerRound || 0,
          },
          darts: (player.darts || []).map(d => ({
            ...d,
            score: d.score || (d.segment === 25 ? (d.multiplier === 2 ? 50 : 25) : (d.segment || 0) * (d.multiplier || 1))
          })),
          cricketMarks: player.cricketMarks || null,
          currentTarget: player.currentTarget || null,
        }));
      }

      const match = {
        id: doc.$id,
        ...parsedState,
        startedAt: doc.startedAt,
      };

      setCurrentMatch(match);
      subscribeToMatch(matchId);
      return match;
    } catch (error) {
      console.error("Error resuming match:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Get shareable match link for spectators
  const getSpectatorLink = (matchId) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/spectate/${matchId}`;
  };

  // Cleanup subscriptions
  useEffect(() => {
    return () => {
      if (subscription) {
        subscription();
      }
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [subscription, autoSaveTimer]);

  // Load active matches on mount
  useEffect(() => {
    if (user) {
      loadActiveMatches();
    }
  }, [user]);

  // Clear current match
  const clearCurrentMatch = () => {
    if (subscription) {
      subscription();
      setSubscription(null);
    }
    setCurrentMatch(null);
  };

  // End/abandon a match
  const endMatch = async (matchId = null, status = "abandoned") => {
    const targetMatchId = matchId || currentMatch?.id;
    if (!targetMatchId) return;

    try {
      setIsLoading(true);
      
      // Update match status in database
      await databases.updateDocument(
        DATABASE_ID,
        "matches",
        targetMatchId,
        {
          status: status,
          finishedAt: new Date().toISOString(),
        }
      );

      // If it's the current match, clear it
      if (currentMatch?.id === targetMatchId) {
        clearCurrentMatch();
      }

      // Reload active matches
      await loadActiveMatches();

      return { success: true };
    } catch (error) {
      console.error("Error ending match:", error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a match permanently
  const deleteMatch = async (matchId) => {
    if (!matchId) return;

    try {
      setIsLoading(true);
      
      // Delete match document from database
      await databases.deleteDocument(
        DATABASE_ID,
        "matches",
        matchId
      );

      // If it's the current match, clear it
      if (currentMatch?.id === matchId) {
        clearCurrentMatch();
      }

      // Reload active matches
      await loadActiveMatches();

      return { success: true };
    } catch (error) {
      console.error("Error deleting match:", error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    currentMatch,
    activeMatches,
    matchHistory,
    isLoading,
    startNewMatch,
    throwDart,
    undoLastDart,
    resumeMatch,
    loadActiveMatches,
    getSpectatorLink,
    clearCurrentMatch,
    endMatch,
    deleteMatch,
    GAME_MODES,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};