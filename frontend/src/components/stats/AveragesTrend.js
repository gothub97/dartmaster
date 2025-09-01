"use client";

import "./ChartsRegistry"; // registers ChartJS
import { Line } from "react-chartjs-2";

export default function AveragesTrend({ metrics }) {
  const labels = (metrics.trend || []).map((p) => new Date(p.date).toLocaleDateString());
  const data = {
    labels,
    datasets: [
      {
        label: "3-Dart Avg",
        data: (metrics.trend || []).map((p) => p.threeDartAvg),
        borderColor: "rgb(249,115,22)",
        backgroundColor: "rgba(249,115,22,0.2)",
        tension: 0.3,
        fill: true,
      },
    ],
  };
  const options = { responsive: true, plugins: { legend: { position: "bottom" } } };
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-gray-900 mb-3">Trend</h3>
      <Line data={data} options={options} />
    </div>
  );
}

