"use client";

import { useEffect, useState } from "react";

export default function AimPicker({ value, onChange }) {
  const [ring, setRing] = useState(value?.ring || "S");
  const [number, setNumber] = useState(value?.number || 20);

  useEffect(() => {
    onChange?.(ring === "BULL" || ring === "DBULL" ? { ring } : { ring, number: Number(number) });
  }, [ring, number]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
      <div className="text-sm text-gray-700">Aim:</div>
      <select className="px-2 py-1 border border-gray-300 rounded" value={ring} onChange={(e) => setRing(e.target.value)}>
        <option value="S">Single</option>
        <option value="D">Double</option>
        <option value="T">Triple</option>
        <option value="BULL">Bull</option>
        <option value="DBULL">Double Bull</option>
      </select>
      {ring !== "BULL" && ring !== "DBULL" && (
        <select className="px-2 py-1 border border-gray-300 rounded" value={number} onChange={(e) => setNumber(e.target.value)}>
          {Array.from({ length: 20 }, (_, i) => 20 - i).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      )}
      <button
        type="button"
        onClick={() => onChange?.(null)}
        className="ml-auto px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-200"
      >
        Clear
      </button>
    </div>
  );
}

