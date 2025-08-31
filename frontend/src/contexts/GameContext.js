"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { databases } from "@/lib/appwrite";
import { ID } from "appwrite";
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
    targets: [20, 19, 18, 17, 16, 15, 25], // 25 is bull
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
  const [currentGame, setCurrentGame] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize a new game
  const startNewGame = (mode = "501", players = []) => {
    const gameConfig = GAME_MODES[mode];
    
    const newGame = {
      id: ID.unique(),
      mode,
      config: gameConfig,
      players: players.map(player => ({
        id: player.id || ID.unique(),
        name: player.name,
        score: mode === "cricket" ? {} : gameConfig.startingScore,
        darts: [],
        stats: {
          dartsThrown: 0,
          totalScore: 0,
          doubles: 0,
          triples: 0,
          bullseyes: 0,
          highestCheckout: 0,
          averagePerDart: 0,
        },
        cricketMarks: mode === "cricket" ? {} : null,
        currentTarget: mode === "aroundTheClock" ? 1 : null,
      })),
      currentPlayerIndex: 0,
      currentRound: 1,
      currentDartInTurn: 0,
      winner: null,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      turns: [],
    };

    // Initialize cricket marks
    if (mode === "cricket") {
      gameConfig.targets.forEach(target => {
        newGame.players.forEach(player => {
          player.cricketMarks[target] = 0;
        });
      });
    }

    setCurrentGame(newGame);
    return newGame;
  };

  // Process a dart throw
  const throwDart = (segment, multiplier = 1) => {
    if (!currentGame || currentGame.winner) return;

    const game = { ...currentGame };
    const player = game.players[game.currentPlayerIndex];
    const score = segment === 25 ? (multiplier === 2 ? 50 : 25) : segment * multiplier;

    // Add dart to current turn
    const dart = { segment, multiplier, score };
    player.darts.push(dart);
    
    // Update stats
    player.stats.dartsThrown++;
    player.stats.totalScore += score;
    player.stats.averagePerDart = player.stats.totalScore / player.stats.dartsThrown;
    
    if (multiplier === 2) player.stats.doubles++;
    if (multiplier === 3) player.stats.triples++;
    if (segment === 25) player.stats.bullseyes++;

    // Game mode specific logic
    switch (game.mode) {
      case "501":
      case "301":
        handleStandardGame(game, player, score, segment, multiplier);
        break;
      case "cricket":
        handleCricketGame(game, player, segment, multiplier);
        break;
      case "aroundTheClock":
        handleAroundTheClock(game, player, segment);
        break;
    }

    // Move to next dart or player
    game.currentDartInTurn++;
    if (game.currentDartInTurn >= 3) {
      // Save turn to history
      const turn = {
        round: game.currentRound,
        player: player.name,
        darts: player.darts.slice(-3),
        totalScore: player.darts.slice(-3).reduce((sum, d) => sum + d.score, 0),
      };
      game.turns.push(turn);

      // Move to next player
      game.currentDartInTurn = 0;
      game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
      
      // New round if back to first player
      if (game.currentPlayerIndex === 0) {
        game.currentRound++;
      }
    }

    setCurrentGame(game);
    return game;
  };

  // Handle 501/301 game logic
  const handleStandardGame = (game, player, score, segment, multiplier) => {
    const newScore = player.score - score;
    const config = game.config;

    // Check for bust
    if (newScore < 0 || (newScore === 0 && config.requireDoubleOut && multiplier !== 2)) {
      // Bust - reset score
      const turnStart = player.darts.length - game.currentDartInTurn - 1;
      const turnDarts = player.darts.slice(turnStart);
      const turnScore = turnDarts.reduce((sum, d) => sum + d.score, 0);
      player.score += turnScore - score; // Reset to turn start
      game.currentDartInTurn = 3; // End turn
    } else if (newScore === 0 && (!config.requireDoubleOut || multiplier === 2)) {
      // Valid checkout
      player.score = 0;
      player.stats.highestCheckout = Math.max(player.stats.highestCheckout, player.score + score);
      game.winner = player;
      game.finishedAt = new Date().toISOString();
    } else {
      // Valid throw
      player.score = newScore;
    }
  };

  // Handle Cricket game logic
  const handleCricketGame = (game, player, segment, multiplier) => {
    const config = game.config;
    
    if (!config.targets.includes(segment)) return;

    const currentMarks = player.cricketMarks[segment];
    const newMarks = Math.min(currentMarks + multiplier, 3);
    player.cricketMarks[segment] = newMarks;

    // If segment is closed (3 marks) and opponents haven't closed it, score points
    if (newMarks === 3) {
      const extraHits = (currentMarks + multiplier) - 3;
      if (extraHits > 0) {
        const opponents = game.players.filter(p => p.id !== player.id);
        const canScore = opponents.some(opp => opp.cricketMarks[segment] < 3);
        
        if (canScore) {
          const points = segment === 25 ? 25 * extraHits : segment * extraHits;
          player.score = (player.score || 0) + points;
        }
      }
    }

    // Check for winner (all targets closed)
    const allClosed = config.targets.every(target => player.cricketMarks[target] === 3);
    if (allClosed) {
      // Winner is player with most points when someone closes all
      const scores = game.players.map(p => ({ player: p, score: p.score || 0 }));
      scores.sort((a, b) => b.score - a.score);
      
      if (scores[0].player.id === player.id) {
        game.winner = player;
        game.finishedAt = new Date().toISOString();
      }
    }
  };

  // Handle Around the Clock logic
  const handleAroundTheClock = (game, player, segment) => {
    if (segment === player.currentTarget) {
      player.currentTarget++;
      
      // Check for winner
      if (player.currentTarget > 20 && segment === 25) {
        game.winner = player;
        game.finishedAt = new Date().toISOString();
      } else if (player.currentTarget === 21) {
        player.currentTarget = 25; // Next target is bullseye
      }
    }
  };

  // Undo last dart
  const undoLastDart = () => {
    if (!currentGame || !currentGame.turns.length) return;

    const game = { ...currentGame };
    
    // Get the last turn
    const lastTurn = game.turns[game.turns.length - 1];
    const playerIndex = game.players.findIndex(p => p.name === lastTurn.player);
    const player = game.players[playerIndex];

    // Remove last dart
    const lastDart = player.darts.pop();
    if (!lastDart) return;

    // Revert stats
    player.stats.dartsThrown--;
    player.stats.totalScore -= lastDart.score;
    if (lastDart.multiplier === 2) player.stats.doubles--;
    if (lastDart.multiplier === 3) player.stats.triples--;
    if (lastDart.segment === 25) player.stats.bullseyes--;

    // Revert game-specific changes
    switch (game.mode) {
      case "501":
      case "301":
        player.score += lastDart.score;
        break;
      case "cricket":
        if (game.config.targets.includes(lastDart.segment)) {
          player.cricketMarks[lastDart.segment] = Math.max(0, 
            player.cricketMarks[lastDart.segment] - lastDart.multiplier);
        }
        break;
      case "aroundTheClock":
        if (lastDart.segment === player.currentTarget - 1) {
          player.currentTarget--;
        }
        break;
    }

    // Adjust turn tracking
    if (game.currentDartInTurn === 0) {
      // Need to go back to previous player
      game.currentPlayerIndex = (game.currentPlayerIndex - 1 + game.players.length) % game.players.length;
      game.currentDartInTurn = 2;
      if (game.currentPlayerIndex === game.players.length - 1) {
        game.currentRound--;
      }
    } else {
      game.currentDartInTurn--;
    }

    // Remove turn from history if it's now empty
    if (lastTurn.darts.length === 1) {
      game.turns.pop();
    } else {
      lastTurn.darts.pop();
      lastTurn.totalScore -= lastDart.score;
    }

    setCurrentGame(game);
  };

  // Save game to database
  const saveGame = async () => {
    if (!currentGame || !user) return;

    setIsLoading(true);
    try {
      const gameData = {
        userId: user.$id,
        mode: currentGame.mode,
        players: JSON.stringify(currentGame.players),
        winner: currentGame.winner?.name || null,
        startedAt: currentGame.startedAt,
        finishedAt: currentGame.finishedAt,
        turns: JSON.stringify(currentGame.turns),
        stats: JSON.stringify(currentGame.players.map(p => p.stats)),
      };

      const response = await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        "games",
        ID.unique(),
        gameData
      );

      return response;
    } catch (error) {
      console.error("Error saving game:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Load game history
  const loadGameHistory = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        "games",
        {
          queries: [`userId=${user.$id}`],
          orderBy: ["finishedAt DESC"],
          limit: 20,
        }
      );

      setGameHistory(response.documents);
      return response.documents;
    } catch (error) {
      console.error("Error loading game history:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    currentGame,
    gameHistory,
    isLoading,
    startNewGame,
    throwDart,
    undoLastDart,
    saveGame,
    loadGameHistory,
    GAME_MODES,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};