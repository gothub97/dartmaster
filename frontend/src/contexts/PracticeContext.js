"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { useAuth } from "./AuthContext";

const PracticeContext = createContext({});

export const usePractice = () => {
  const context = useContext(PracticeContext);
  if (!context) {
    throw new Error("usePractice must be used within a PracticeProvider");
  }
  return context;
};

// Practice modes configuration
const PRACTICE_MODES = {
  target: {
    name: "Target Practice",
    description: "Practice hitting specific numbers or segments",
    icon: "target",
  },
  checkout: {
    name: "Checkout Practice",
    description: "Practice finishing from specific scores",
    icon: "flag",
  },
  freePlay: {
    name: "Free Play",
    description: "Throw freely without constraints",
    icon: "sparkles",
  },
  aroundTheClock: {
    name: "Around the Clock",
    description: "Hit numbers in sequence from 1-20",
    icon: "clock",
  },
  cricket: {
    name: "Cricket Practice",
    description: "Practice cricket targets (20-15, Bull)",
    icon: "trophy",
  },
};

// Checkout suggestions for common scores
const CHECKOUT_SUGGESTIONS = {
  170: ["T20", "T20", "Bull"],
  167: ["T20", "T19", "Bull"],
  164: ["T20", "T18", "Bull"],
  161: ["T20", "T17", "Bull"],
  160: ["T20", "T20", "D20"],
  158: ["T20", "T20", "D19"],
  157: ["T20", "T19", "D20"],
  156: ["T20", "T20", "D18"],
  155: ["T20", "T19", "D19"],
  154: ["T20", "T18", "D20"],
  153: ["T20", "T19", "D18"],
  152: ["T20", "T20", "D16"],
  151: ["T20", "T17", "D20"],
  150: ["T20", "T18", "D18"],
  // Add more checkout combinations as needed
};

export const PracticeProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentSession, setCurrentSession] = useState(null);
  const [practiceHistory, setPracticeHistory] = useState([]);
  const [practiceStats, setPracticeStats] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

  // Start a new practice session
  const startPracticeSession = async (mode, settings = {}) => {
    if (!user) return null;

    const session = {
      id: ID.unique(),
      mode,
      settings,
      startedAt: new Date().toISOString(),
      throws: [],
      stats: {
        totalThrows: 0,
        hits: 0,
        misses: 0,
        accuracy: 0,
        averageScore: 0,
        highestScore: 0,
        targetHits: {},
      },
      currentTarget: settings.startingTarget || null,
      targetsHit: [],
      checkoutAttempts: [],
    };

    setCurrentSession(session);
    return session;
  };

  // Record a practice throw
  const recordThrow = async (segment, multiplier = 1) => {
    if (!currentSession) return;

    const score = segment === 25 ? (multiplier === 2 ? 50 : 25) : segment * multiplier;
    const throwData = {
      segment,
      multiplier,
      score,
      timestamp: new Date().toISOString(),
    };

    const updatedSession = { ...currentSession };
    updatedSession.throws.push(throwData);
    updatedSession.stats.totalThrows++;

    // Update statistics based on practice mode
    switch (currentSession.mode) {
      case "target":
        handleTargetPractice(updatedSession, throwData);
        break;
      case "checkout":
        handleCheckoutPractice(updatedSession, throwData);
        break;
      case "freePlay":
        handleFreePlay(updatedSession, throwData);
        break;
      case "aroundTheClock":
        handleAroundTheClock(updatedSession, throwData);
        break;
      case "cricket":
        handleCricketPractice(updatedSession, throwData);
        break;
    }

    // Update general statistics
    updateGeneralStats(updatedSession);
    
    setCurrentSession(updatedSession);
    
    // Auto-save session periodically
    if (updatedSession.throws.length % 10 === 0) {
      await saveSession(updatedSession);
    }

    return updatedSession;
  };

  // Handle target practice mode
  const handleTargetPractice = (session, throwData) => {
    const targets = session.settings.targets || [];
    const isHit = targets.some(target => {
      if (target.segment === throwData.segment) {
        if (target.multiplier) {
          return target.multiplier === throwData.multiplier;
        }
        return true;
      }
      return false;
    });

    if (isHit) {
      session.stats.hits++;
      const key = `${throwData.segment}_${throwData.multiplier}`;
      session.stats.targetHits[key] = (session.stats.targetHits[key] || 0) + 1;
    } else {
      session.stats.misses++;
    }

    session.stats.accuracy = (session.stats.hits / session.stats.totalThrows) * 100;
  };

  // Handle checkout practice mode
  const handleCheckoutPractice = (session, throwData) => {
    if (!session.currentCheckout) {
      // Start a new checkout attempt
      const checkoutScore = session.settings.checkoutScore || generateRandomCheckout();
      session.currentCheckout = {
        startingScore: checkoutScore,
        remainingScore: checkoutScore,
        throws: [],
        completed: false,
      };
    }

    session.currentCheckout.throws.push(throwData);
    session.currentCheckout.remainingScore -= throwData.score;

    // Check if checkout is successful
    if (session.currentCheckout.remainingScore === 0 && throwData.multiplier === 2) {
      session.currentCheckout.completed = true;
      session.stats.hits++;
      session.checkoutAttempts.push(session.currentCheckout);
      session.currentCheckout = null;
    } else if (session.currentCheckout.remainingScore < 0 || 
               (session.currentCheckout.remainingScore === 0 && throwData.multiplier !== 2) ||
               session.currentCheckout.throws.length >= 3) {
      // Bust or failed attempt
      session.stats.misses++;
      session.checkoutAttempts.push(session.currentCheckout);
      session.currentCheckout = null;
    }
  };

  // Handle free play mode
  const handleFreePlay = (session, throwData) => {
    // Just track throws and calculate averages
    const totalScore = session.throws.reduce((sum, t) => sum + t.score, 0);
    session.stats.averageScore = totalScore / session.stats.totalThrows;
    
    if (throwData.score > session.stats.highestScore) {
      session.stats.highestScore = throwData.score;
    }
  };

  // Handle around the clock mode
  const handleAroundTheClock = (session, throwData) => {
    const currentTarget = session.currentTarget || 1;
    
    if (throwData.segment === currentTarget) {
      session.stats.hits++;
      session.targetsHit.push(currentTarget);
      
      // Move to next target
      if (currentTarget === 20) {
        session.currentTarget = 25; // Bull is next
      } else if (currentTarget === 25) {
        // Completed!
        session.completed = true;
        session.completedAt = new Date().toISOString();
      } else {
        session.currentTarget = currentTarget + 1;
      }
    } else {
      session.stats.misses++;
    }
    
    session.stats.accuracy = (session.stats.hits / session.stats.totalThrows) * 100;
  };

  // Handle cricket practice mode
  const handleCricketPractice = (session, throwData) => {
    const cricketTargets = [20, 19, 18, 17, 16, 15, 25];
    const isValidTarget = cricketTargets.includes(throwData.segment);
    
    if (isValidTarget) {
      session.stats.hits++;
      const key = `${throwData.segment}_${throwData.multiplier}`;
      session.stats.targetHits[key] = (session.stats.targetHits[key] || 0) + 1;
    } else {
      session.stats.misses++;
    }
    
    session.stats.accuracy = (session.stats.hits / session.stats.totalThrows) * 100;
  };

  // Update general statistics
  const updateGeneralStats = (session) => {
    const totalScore = session.throws.reduce((sum, t) => sum + t.score, 0);
    session.stats.averageScore = totalScore / session.stats.totalThrows;
    
    const lastThrow = session.throws[session.throws.length - 1];
    if (lastThrow.score > session.stats.highestScore) {
      session.stats.highestScore = lastThrow.score;
    }
  };

  // Generate random checkout score
  const generateRandomCheckout = () => {
    const checkoutScores = Object.keys(CHECKOUT_SUGGESTIONS).map(Number);
    return checkoutScores[Math.floor(Math.random() * checkoutScores.length)];
  };

  // Get checkout suggestion for a score
  const getCheckoutSuggestion = (score) => {
    return CHECKOUT_SUGGESTIONS[score] || null;
  };

  // Save practice session to database
  const saveSession = async (session) => {
    if (!user || !session) return;

    try {
      const sessionData = {
        userId: user.$id,
        mode: session.mode,
        settings: JSON.stringify(session.settings),
        throws: JSON.stringify(session.throws),
        stats: JSON.stringify(session.stats),
        startedAt: session.startedAt,
        endedAt: session.endedAt || new Date().toISOString(),
        completed: session.completed || false,
      };

      if (session.dbId) {
        // Update existing session
        await databases.updateDocument(
          DATABASE_ID,
          "practice_sessions",
          session.dbId,
          sessionData
        );
      } else {
        // Create new session
        const doc = await databases.createDocument(
          DATABASE_ID,
          "practice_sessions",
          ID.unique(),
          sessionData
        );
        session.dbId = doc.$id;
      }

      return session;
    } catch (error) {
      console.error("Error saving practice session:", error);
    }
  };

  // End current practice session
  const endSession = async () => {
    if (!currentSession) return;

    const endedSession = {
      ...currentSession,
      endedAt: new Date().toISOString(),
    };

    await saveSession(endedSession);
    setCurrentSession(null);
    
    // Reload practice history
    await loadPracticeHistory();
    
    return endedSession;
  };

  // Load practice history
  const loadPracticeHistory = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        "practice_sessions",
        [
          Query.equal("userId", user.$id),
          Query.orderDesc("$createdAt"),
          Query.limit(50),
        ]
      );

      const sessions = response.documents.map(doc => ({
        id: doc.$id,
        mode: doc.mode,
        settings: JSON.parse(doc.settings || "{}"),
        throws: JSON.parse(doc.throws || "[]"),
        stats: JSON.parse(doc.stats || "{}"),
        startedAt: doc.startedAt,
        endedAt: doc.endedAt,
        completed: doc.completed,
      }));

      setPracticeHistory(sessions);
      
      // Calculate aggregate statistics
      calculatePracticeStats(sessions);
      
      return sessions;
    } catch (error) {
      console.error("Error loading practice history:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate aggregate practice statistics
  const calculatePracticeStats = (sessions) => {
    const stats = {
      totalSessions: sessions.length,
      totalThrows: 0,
      averageAccuracy: 0,
      favoriteMode: null,
      targetAccuracy: {},
      checkoutSuccess: 0,
      totalPracticeTime: 0,
    };

    const modeCounts = {};
    let totalAccuracy = 0;
    let accuracyCount = 0;

    sessions.forEach(session => {
      stats.totalThrows += session.stats.totalThrows || 0;
      
      if (session.stats.accuracy) {
        totalAccuracy += session.stats.accuracy;
        accuracyCount++;
      }

      // Count mode usage
      modeCounts[session.mode] = (modeCounts[session.mode] || 0) + 1;

      // Calculate practice time
      if (session.startedAt && session.endedAt) {
        const duration = new Date(session.endedAt) - new Date(session.startedAt);
        stats.totalPracticeTime += duration;
      }
    });

    stats.averageAccuracy = accuracyCount > 0 ? totalAccuracy / accuracyCount : 0;
    stats.favoriteMode = Object.keys(modeCounts).reduce((a, b) => 
      modeCounts[a] > modeCounts[b] ? a : b, null);

    setPracticeStats(stats);
  };

  // Load practice history on mount
  useEffect(() => {
    if (user) {
      loadPracticeHistory();
    }
  }, [user]);

  const value = {
    currentSession,
    practiceHistory,
    practiceStats,
    isLoading,
    PRACTICE_MODES,
    CHECKOUT_SUGGESTIONS,
    startPracticeSession,
    recordThrow,
    endSession,
    loadPracticeHistory,
    getCheckoutSuggestion,
  };

  return (
    <PracticeContext.Provider value={value}>
      {children}
    </PracticeContext.Provider>
  );
};