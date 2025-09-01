"use client";

import { useEffect, useMemo, useState } from "react";
import { client, databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { computeMatchMetrics, computePracticeMetrics, combineMetrics } from "@/utils/stats-calculators";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export function usePlayerStats({ userId, includeMatches = true, includePractice = true, filters = {} }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matches, setMatches] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      if (!userId) return;
      setLoading(true);
      setError(null);
      try {
        const reqs = [];
        if (includeMatches) {
          reqs.push(
            databases.listDocuments(
              DATABASE_ID,
              "matches",
              [
                Query.or([Query.equal("userId", userId), Query.search("players", userId)]),
                Query.orderDesc("$createdAt"),
                Query.limit(200),
              ]
            )
          );
        } else {
          reqs.push(Promise.resolve(null));
        }
        if (includePractice) {
          reqs.push(
            databases.listDocuments(
              DATABASE_ID,
              "practice_sessions",
              [Query.equal("userId", userId), Query.orderDesc("$createdAt"), Query.limit(200)]
            )
          );
        } else {
          reqs.push(Promise.resolve(null));
        }
        const [mRes, pRes] = await Promise.all(reqs);
        if (!mounted) return;
        setMatches(mRes?.documents || []);
        setSessions(pRes?.documents || []);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || "Failed to load stats data");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadAll();
    // Realtime subscription for live updates
    let unsub = null;
    if (userId) {
      try {
        unsub = client.subscribe(`databases.${DATABASE_ID}.collections.matches.documents`, (ev) => {
          const payload = ev?.payload;
          if (!payload) return;
          // If event concerns this user, refresh
          try {
            const players = typeof payload.players === "string" ? JSON.parse(payload.players) : payload.players || [];
            const isMine = payload.userId === userId || players.some((p) => p?.userId === userId);
            if (isMine) {
              // debounce small delay
              setTimeout(() => loadAll(), 300);
            }
          } catch (_) {}
        });
      } catch (_) {}
    }
    return () => {
      mounted = false;
      if (typeof unsub === "function") unsub();
    };
  }, [userId, includeMatches, includePractice]);

  const metrics = useMemo(() => {
    const matchM = includeMatches ? computeMatchMetrics(matches, userId, filters) : null;
    const practiceM = includePractice ? computePracticeMetrics(sessions, userId, filters) : null;
    return combineMetrics(matchM || {}, practiceM || {}, includeMatches, includePractice);
  }, [matches, sessions, userId, includeMatches, includePractice, filters]);

  return { loading, error, metrics };
}
