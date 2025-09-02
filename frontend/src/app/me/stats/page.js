"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useEffect, useMemo, useState } from "react";
import StatsFilters from "@/components/stats/StatsFilters";
import OverviewCards from "@/components/stats/OverviewCards";
import AveragesTrend from "@/components/stats/AveragesTrend";
import ScoringBandsBar from "@/components/stats/ScoringBandsBar";
import CheckoutDoublesDonuts from "@/components/stats/CheckoutDoublesDonuts";
import DartboardHeatmap from "@/components/stats/DartboardHeatmap";
import { usePlayerStats } from "@/hooks/usePlayerStats";
import Link from "next/link";
import SharedNavigation from "@/components/layout/SharedNavigation";
import { useRouter } from "next/navigation";

export default function MyStatsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [filters, setFilters] = useState({
    range: "90d",
    formats: [],
    opponentId: "",
    venue: "",
    includeMatches: true,
    includePractice: true,
  });
  const [heatMode, setHeatMode] = useState("hitRate");

  const { loading, error, metrics } = usePlayerStats({
    userId: user?.$id,
    includeMatches: filters.includeMatches,
    includePractice: filters.includePractice,
    filters,
  });


  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-700 mb-4">Sign in to view your statistics</div>
          <Link href="/auth/login" className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNavigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">My Statistics</h1>
            <div className="text-sm text-gray-500">Live updates during matches</div>
          </div>
          <p className="text-gray-500">Track your performance and progress over time</p>
        </div>

        <StatsFilters value={filters} onChange={setFilters} />

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-2 border-gray-300 rounded-full animate-spin border-t-orange-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 mb-4">{error}</div>
        ) : (
          <div className="space-y-6">
            <OverviewCards metrics={metrics} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AveragesTrend metrics={metrics} />
              <ScoringBandsBar bands={metrics.bands} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CheckoutDoublesDonuts metrics={metrics} />
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Dartboard Heatmap</h3>
                  <div className="inline-flex items-center gap-2 text-sm">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="heat" 
                        value="hitRate" 
                        checked={heatMode === "hitRate"} 
                        onChange={() => setHeatMode("hitRate")} 
                        className="accent-orange-500" 
                      />
                      <span className="text-gray-600">Hit Rate</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="heat" 
                        value="density" 
                        checked={heatMode === "density"} 
                        onChange={() => setHeatMode("density")} 
                        className="accent-orange-500" 
                      />
                      <span className="text-gray-600">Density</span>
                    </label>
                  </div>
                </div>
                <DartboardHeatmap heatmap={metrics.heatmap} mode={heatMode} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
