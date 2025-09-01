// Statistics calculators for matches and practice sessions

// Helpers
const isBogey = (score) => [169, 168, 166, 165, 163, 162, 159].includes(score);

export const timeFilterFn = (range, custom) => {
  const now = new Date();
  let from = null;
  switch (range) {
    case "last_match":
      return () => true; // handled by slicing later
    case "last_10":
      return () => true; // handled by slicing later
    case "30d":
      from = new Date(now.getTime() - 30 * 86400000);
      break;
    case "90d":
      from = new Date(now.getTime() - 90 * 86400000);
      break;
    case "custom":
      from = custom?.from ? new Date(custom.from) : null;
      break;
    default:
      return () => true;
  }
  return (d) => {
    const dt = new Date(d);
    return !from || dt >= from;
  };
};

export function computeMatchMetrics(matches, userId, { range = "90d", customRange = null, formats = [], opponentId = null, venue = null } = {}) {
  if (!Array.isArray(matches)) matches = [];
  const byRange = timeFilterFn(range, customRange);

  // Filter matches by time and meta
  let filtered = matches.filter((m) => {
    const finished = m.finishedAt || m.$updatedAt || m.$createdAt || m.startedAt;
    const okTime = byRange(finished);
    const okFormat = !formats?.length || formats.includes(m.mode || m.gameType || m.format);
    const okOpp = !opponentId || (Array.isArray(m.players) && m.players.some((p) => (p.userId || p.id) === opponentId && (p.userId || p.id) !== userId));
    const okVenue = !venue || (m.venue === venue);
    return okTime && okFormat && okOpp && okVenue;
  });

  if (range === "last_match" && filtered.length > 0) filtered = [filtered[0]];
  if (range === "last_10" && filtered.length > 10) filtered = filtered.slice(0, 10);

  // Accumulators
  const acc = {
    legs: 0,
    darts: 0,
    scoreTotal: 0,
    first9DartsTotal: 0,
    first9ScoreTotal: 0,
    bands: { "180": 0, "140+": 0, "100+": 0, "60+": 0, "26": 0 },
    checkoutAttempts: 0,
    checkouts: 0,
    highestCheckout: 0,
    finishingDoublesAttempts: 0,
    finishingDoublesHit: 0,
    total180s: 0,
    cricket: { mprTotal: 0, rounds: 0, points: 0, wins: 0 },
    around: { completions: 0, dartsTotal: 0, streakMax: 0 },
    heatmap: {}, // key -> {hits, tries, density}
    trend: [], // per match average
  };

  const ensureHeat = (key) => {
    if (!acc.heatmap[key]) acc.heatmap[key] = { hits: 0, tries: 0, density: 0 };
    return acc.heatmap[key];
  };

  filtered.forEach((doc) => {
    let state = doc.currentState || doc.gameState || null;
    try {
      if (typeof state === "string") state = JSON.parse(state);
    } catch (_) {
      state = null;
    }

    if (!state || !Array.isArray(state.players)) return;

    const player = state.players.find((p) => (p.userId || p.id) === userId || p.id === userId);
    if (!player) return;

    const mode = state.mode || doc.mode || doc.gameType;

    // Cricket handling
    if (mode === "cricket") {
      const marks = player?.cricketMarks || {};
      const marksCount = Object.values(marks).reduce((s, v) => s + (v || 0), 0);
      const rounds = Math.max(1, Math.ceil((player?.darts?.length || 0) / 3));
      acc.cricket.mprTotal += marksCount / rounds;
      acc.cricket.rounds += 1;
      acc.cricket.points += player?.score || 0;
      if (state.winner?.id === player.id) acc.cricket.wins += 1;
    }

    // Around the Clock handling
    if (mode === "aroundTheClock") {
      const dartsThrown = player?.darts?.length || 0;
      acc.around.completions += state?.winner?.id === player.id ? 1 : 0;
      acc.around.dartsTotal += dartsThrown;
      // streak approx: longest series of correct hits; needs target tracking which may be in player.currentTarget — skip complex logic here
    }

    // 501/301 and general per-turn stats
    let playerDarts = Array.isArray(player.darts) ? player.darts : [];
    // Per-dart scoring total
    const scoreSum = playerDarts.reduce((s, d) => s + (d.score || (d.segment === 25 ? (d.multiplier === 2 ? 50 : 25) : (d.segment || 0) * (d.multiplier || 1))), 0);
    const dartsCount = playerDarts.length;
    acc.darts += dartsCount;
    acc.scoreTotal += scoreSum;

    // Trend point: average per dart *3
    if (dartsCount > 0) acc.trend.push({
      date: doc.finishedAt || doc.$updatedAt || doc.$createdAt,
      threeDartAvg: (scoreSum / dartsCount) * 3,
    });

    // First 9 average: take first 9 darts (or fewer); bust darts count as 0 already reflected via scoring in state logic
    const first9 = playerDarts.slice(0, 9);
    const first9Score = first9.reduce((s, d) => s + (d.score || 0), 0);
    acc.first9DartsTotal += first9.length;
    acc.first9ScoreTotal += first9Score;

    // Scoring bands by turn
    for (let i = 0; i < playerDarts.length; i += 3) {
      const turn = playerDarts.slice(i, i + 3);
      const turnScore = turn.reduce((s, d) => s + (d.score || 0), 0);
      if (turn.length === 3) {
        if (turnScore === 180) acc.bands["180"] += 1;
        else if (turnScore >= 140) acc.bands["140+"] += 1;
        else if (turnScore >= 100) acc.bands["100+"] += 1;
        else if (turnScore >= 60) acc.bands["60+"] += 1;
        else if (turnScore <= 26) acc.bands["26"] += 1;
      }
    }

    // Checkout attempts (Option A: only actual dart at double, incl. inner bull)
    // Finishing doubles% counts only finishing doubles
    if (Array.isArray(state.turns)) {
      state.turns.forEach((t) => {
        if (!Array.isArray(t.darts)) return;
        // detect finishing dart: when player's score reached 0 in this turn -> last dart that caused win is finishing dart
        if (state.winner?.id === player.id) {
          // approximate: if this turn belongs to player and is near end
        }
      });
    }
    // If player has stats.highestCheckout already, use it
    if (player?.stats?.highestCheckout) acc.highestCheckout = Math.max(acc.highestCheckout, player.stats.highestCheckout);

    // Heatmap collection
    playerDarts.forEach((d) => {
      const actual = d.segment === 25 ? (d.multiplier === 2 ? "DBULL" : "BULL") : `${d.multiplier === 3 ? "T" : d.multiplier === 2 ? "D" : "S"}${d.segment}`;
      const actualCell = ensureHeat(actual);
      actualCell.density += 1; // density counts throws that landed on this segment

      // Aim-based tries/hits if aim present
      const aimRing = d.aimRing || d.aim?.ring;
      const aimNum = d.aimNumber || d.aim?.number;
      if (aimRing) {
        const aimKey = aimRing === "BULL" || aimRing === "DBULL" ? aimRing : `${aimRing}${aimNum}`;
        const aimCell = ensureHeat(aimKey);
        aimCell.tries += 1;
        if (aimKey === actual) aimCell.hits += 1;
      }
    });
  });

  // Derive averages
  const oneDartAvg = acc.darts > 0 ? acc.scoreTotal / acc.darts : 0;
  const threeDartAvg = oneDartAvg * 3;
  const first9Avg = acc.first9DartsTotal > 0 ? (acc.first9ScoreTotal / acc.first9DartsTotal) * 3 : 0;

  const cricket = {
    mpr: acc.cricket.rounds > 0 ? acc.cricket.mprTotal / acc.cricket.rounds : 0,
    points: acc.cricket.points,
    wins: acc.cricket.wins,
  };

  const around = {
    avgDarts: acc.around.completions > 0 ? acc.around.dartsTotal / acc.around.completions : 0,
    completions: acc.around.completions,
  };

  return {
    oneDartAvg,
    threeDartAvg,
    first9Avg,
    bands: acc.bands,
    checkoutAttempts: acc.checkoutAttempts,
    checkoutSuccess: acc.checkouts,
    highestCheckout: acc.highestCheckout,
    finishingDoublesAttempts: acc.finishingDoublesAttempts,
    finishingDoublesHit: acc.finishingDoublesHit,
    total180s: acc.bands["180"],
    cricket,
    around,
    heatmap: acc.heatmap,
    trend: acc.trend.sort((a, b) => new Date(a.date) - new Date(b.date)),
    totalMatches: filtered.length,
  };
}

export function computePracticeMetrics(sessions, userId, { range = "90d", customRange = null, drillTypes = [] } = {}) {
  if (!Array.isArray(sessions)) sessions = [];
  const byRange = timeFilterFn(range, customRange);
  const filtered = sessions.filter((s) => byRange(s.finishedAt || s.$updatedAt || s.$createdAt || s.startedAt) && (!drillTypes?.length || drillTypes.includes(s.mode || s.type)) && s.userId === userId);

  const acc = {
    accuracyMax: 0,
    doublesHitRateMax: 0,
    triplesHitRateMax: 0,
    bullseyes: 0,
    total180s: 0,
    heatmap: {},
  };
  const ensureHeat = (key) => {
    if (!acc.heatmap[key]) acc.heatmap[key] = { hits: 0, tries: 0, density: 0 };
    return acc.heatmap[key];
  };

  filtered.forEach((doc) => {
    let stats = doc.stats;
    try { if (typeof stats === "string") stats = JSON.parse(stats); } catch (_) {}
    if (!stats) return;
    acc.accuracyMax = Math.max(acc.accuracyMax, stats.accuracy || 0);
    acc.doublesHitRateMax = Math.max(acc.doublesHitRateMax, stats.doublesHitRate || 0);
    acc.triplesHitRateMax = Math.max(acc.triplesHitRateMax, stats.triplesHitRate || 0);
    acc.bullseyes += stats.bullseyes || 0;
    acc.total180s += stats.total180s || 0;
    if (Array.isArray(doc.throws)) {
      doc.throws.forEach((d) => {
        const actual = d.segment === 25 ? (d.multiplier === 2 ? "DBULL" : "BULL") : `${d.multiplier === 3 ? "T" : d.multiplier === 2 ? "D" : "S"}${d.segment}`;
        const actCell = ensureHeat(actual);
        actCell.density += 1;
        const aimRing = d.aimRing || d.aim?.ring;
        const aimNum = d.aimNumber || d.aim?.number;
        if (aimRing) {
          const aimKey = aimRing === "BULL" || aimRing === "DBULL" ? aimRing : `${aimRing}${aimNum}`;
          const cell = ensureHeat(aimKey);
          cell.tries += 1;
          if (aimKey === actual) cell.hits += 1;
        }
      });
    }
  });

  return acc;
}

export function combineMetrics(matchM, practiceM, includeMatches = true, includePractice = true) {
  const out = { ...matchM };
  if (!includePractice) return out;
  if (!practiceM) return out;

  // Simple merge for heatmap and counts
  out.total180s += practiceM.total180s || 0;
  out.heatmap = { ...out.heatmap };
  Object.entries(practiceM.heatmap || {}).forEach(([k, v]) => {
    if (!out.heatmap[k]) out.heatmap[k] = { hits: 0, tries: 0 };
    out.heatmap[k].hits += v.hits;
    out.heatmap[k].tries += v.tries;
  });
  // Keep averages from matches; expose practice maxima separately
  out.practice = {
    accuracyMax: practiceM.accuracyMax,
    doublesHitRateMax: practiceM.doublesHitRateMax,
    triplesHitRateMax: practiceM.triplesHitRateMax,
  };
  return out;
}
