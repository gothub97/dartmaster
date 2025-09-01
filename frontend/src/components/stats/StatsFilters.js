"use client";

import { useState, useEffect } from "react";

export default function StatsFilters({
  value,
  onChange,
  showPracticeToggle = true,
}) {
  const [local, setLocal] = useState(value);

  useEffect(() => setLocal(value), [value]);

  const update = (patch) => {
    const next = { ...local, ...patch };
    setLocal(next);
    onChange?.(next);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
      <select
        className="px-3 py-2 border border-gray-300 rounded"
        value={local.range}
        onChange={(e) => update({ range: e.target.value })}
      >
        <option value="last_match">Last Match</option>
        <option value="last_10">Last 10</option>
        <option value="30d">Last 30 days</option>
        <option value="90d">Last 90 days</option>
        <option value="all">All Time</option>
      </select>

      <select
        multiple
        className="px-3 py-2 border border-gray-300 rounded h-10 md:h-auto"
        value={local.formats}
        onChange={(e) => update({ formats: Array.from(e.target.selectedOptions).map((o) => o.value) })}
      >
        <option value="501">501</option>
        <option value="301">301</option>
        <option value="cricket">Cricket</option>
        <option value="aroundTheClock">Around The Clock</option>
      </select>

      <input
        className="px-3 py-2 border border-gray-300 rounded"
        placeholder="Opponent ID (optional)"
        value={local.opponentId || ""}
        onChange={(e) => update({ opponentId: e.target.value })}
      />

      <div className="flex items-center gap-4 justify-between">
        {showPracticeToggle && (
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="accent-orange-500"
              checked={local.includePractice}
              onChange={(e) => update({ includePractice: e.target.checked })}
            />
            <span className="text-sm text-gray-700">Include Practice</span>
          </label>
        )}
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            className="accent-orange-500"
            checked={local.includeMatches}
            onChange={(e) => update({ includeMatches: e.target.checked })}
          />
          <span className="text-sm text-gray-700">Include Matches</span>
        </label>
      </div>
    </div>
  );
}

