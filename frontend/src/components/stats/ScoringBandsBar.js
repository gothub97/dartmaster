"use client";

import "./ChartsRegistry";
import { Bar } from "react-chartjs-2";

export default function ScoringBandsBar({ bands }) {
  const labels = ["180", "140+", "100+", "60+", "26"];
  const data = {
    labels,
    datasets: [
      {
        label: "Turns",
        data: labels.map((l) => bands?.[l] || 0),
        backgroundColor: "rgba(59,130,246,0.5)",
        borderColor: "rgb(59,130,246)",
      },
    ],
  };
  const options = { responsive: true, plugins: { legend: { display: false } } };
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-gray-900 mb-3">Scoring Bands</h3>
      <Bar data={data} options={options} />
    </div>
  );
}

