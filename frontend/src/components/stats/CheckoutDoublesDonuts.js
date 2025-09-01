"use client";

import "./ChartsRegistry";
import { Doughnut } from "react-chartjs-2";

function Donut({ label, hit, att, colors }) {
  const data = {
    labels: ["Success", "Miss"],
    datasets: [
      {
        data: [hit || 0, Math.max(0, (att || 0) - (hit || 0))],
        backgroundColor: colors,
      },
    ],
  };
  return (
    <div className="flex flex-col items-center">
      <div className="w-40 h-40">
        <Doughnut data={data} options={{ cutout: "70%" }} />
      </div>
      <div className="mt-2 text-sm text-gray-700">{label}: {att ? Math.round(((hit || 0) / att) * 100) : 0}%</div>
    </div>
  );
}

export default function CheckoutDoublesDonuts({ metrics }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-gray-900 mb-3">Checkout & Doubles</h3>
      <div className="grid grid-cols-2 gap-6">
        <Donut label="Checkout" hit={metrics.checkoutSuccess} att={metrics.checkoutAttempts} colors={["#16a34a", "#ef4444"]} />
        <Donut label="Finishing Doubles" hit={metrics.finishingDoublesHit} att={metrics.finishingDoublesAttempts} colors={["#f59e0b", "#cbd5e1"]} />
      </div>
    </div>
  );
}

