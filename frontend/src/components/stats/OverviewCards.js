"use client";

export default function OverviewCards({ metrics }) {
  const cards = [
    { label: "3-Dart Avg", value: metrics.threeDartAvg?.toFixed(1) || "0.0" },
    { label: "1-Dart Avg", value: metrics.oneDartAvg?.toFixed(2) || "0.00" },
    { label: "First 9 Avg", value: metrics.first9Avg?.toFixed(1) || "0.0" },
    { label: "Highest CO", value: metrics.highestCheckout || 0 },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((c) => (
        <div key={c.label} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{c.value}</div>
          <div className="text-sm text-gray-600">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

