"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useUserProfile } from "@/contexts/UserProfileContext";
import StatsFilters from "@/components/stats/StatsFilters";
import OverviewCards from "@/components/stats/OverviewCards";
import AveragesTrend from "@/components/stats/AveragesTrend";
import ScoringBandsBar from "@/components/stats/ScoringBandsBar";
import CheckoutDoublesDonuts from "@/components/stats/CheckoutDoublesDonuts";
import DartboardHeatmap from "@/components/stats/DartboardHeatmap";
import { usePlayerStats } from "@/hooks/usePlayerStats";

export default function PublicPlayerStatsPage() {
  const params = useParams();
  const { loadProfileByUsername } = useUserProfile();
  const [profile, setProfile] = useState(null);
  const [filters, setFilters] = useState({
    range: "90d",
    formats: [],
    opponentId: "",
    venue: "",
    includeMatches: true,
    includePractice: true,
  });
  const [heatMode, setHeatMode] = useState("hitRate");

  useEffect(() => {
    (async () => {
      const p = await loadProfileByUsername(params.username);
      setProfile(p);
    })();
  }, [params.username, loadProfileByUsername]);

  const { loading, error, metrics } = usePlayerStats({
    userId: profile?.userId,
    includeMatches: filters.includeMatches,
    includePractice: filters.includePractice,
    filters,
  });

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 rounded-full animate-spin border-t-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link href={`/players/${profile.username}`} className="text-orange-600 hover:underline">@{profile.username}</Link>
            <span className="text-gray-400">/</span>
            <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>
          </div>
          <div className="text-sm text-gray-600">Public</div>
        </div>

        <StatsFilters value={filters} onChange={setFilters} />

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-2 border-gray-300 rounded-full animate-spin border-t-orange-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-600 mb-4">{error}</div>
        ) : (
          <>
            <OverviewCards metrics={metrics} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AveragesTrend metrics={metrics} />
              <ScoringBandsBar bands={metrics.bands} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CheckoutDoublesDonuts metrics={metrics} />
              <div>
                <div className="flex justify-end mb-2">
                  <div className="inline-flex items-center gap-2 text-sm">
                    <label className="flex items-center gap-1">
                      <input type="radio" name="heat" value="hitRate" checked={heatMode === "hitRate"} onChange={() => setHeatMode("hitRate")} className="accent-orange-500" />
                      Hit Rate
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="radio" name="heat" value="density" checked={heatMode === "density"} onChange={() => setHeatMode("density")} className="accent-orange-500" />
                      Density
                    </label>
                  </div>
                </div>
                <DartboardHeatmap heatmap={metrics.heatmap} mode={heatMode} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
