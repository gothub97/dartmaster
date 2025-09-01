"use client";

// Simplified heatmap grid by segment (highest granularity, textual grid)
// Key format: S20/D20/T20 ... BULL/DBULL

function cellColor(intensity) {
  // intensity 0..1
  const v = Math.max(0, Math.min(1, intensity));
  const r = 255;
  const g = Math.round(255 * (1 - v));
  const b = Math.round(128 * (1 - v));
  return `rgb(${r},${g},${b})`;
}

export default function HeatmapGrid({ heatmap }) {
  const numbers = Array.from({ length: 20 }, (_, i) => 20 - i);
  const rows = numbers.map((n) => {
    const s = heatmap[`S${n}`] || { hits: 0, tries: 0 };
    const d = heatmap[`D${n}`] || { hits: 0, tries: 0 };
    const t = heatmap[`T${n}`] || { hits: 0, tries: 0 };
    return { n, s, d, t };
  });
  const bull = heatmap["BULL"] || { hits: 0, tries: 0 };
  const dbull = heatmap["DBULL"] || { hits: 0, tries: 0 };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-gray-900 mb-3">Accuracy Heatmap</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="p-2">#</th>
              <th className="p-2">Single</th>
              <th className="p-2">Double</th>
              <th className="p-2">Triple</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const sI = r.s.tries ? r.s.hits / r.s.tries : 0;
              const dI = r.d.tries ? r.d.hits / r.d.tries : 0;
              const tI = r.t.tries ? r.t.hits / r.t.tries : 0;
              return (
                <tr key={r.n} className="border-t border-gray-100">
                  <td className="p-2 text-gray-700">{r.n}</td>
                  <td className="p-2">
                    <div className="rounded text-center text-gray-900" style={{ backgroundColor: cellColor(sI) }}>
                      {(sI * 100).toFixed(0)}%
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="rounded text-center text-gray-900" style={{ backgroundColor: cellColor(dI) }}>
                      {(dI * 100).toFixed(0)}%
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="rounded text-center text-gray-900" style={{ backgroundColor: cellColor(tI) }}>
                      {(tI * 100).toFixed(0)}%
                    </div>
                  </td>
                </tr>
              );
            })}
            <tr className="border-t border-gray-100">
              <td className="p-2 text-gray-700">Bull</td>
              <td className="p-2" colSpan={2}>
                <div className="rounded text-center text-gray-900" style={{ backgroundColor: cellColor(bull.tries ? bull.hits / bull.tries : 0) }}>
                  {bull.tries ? Math.round((bull.hits / bull.tries) * 100) : 0}% Single Bull
                </div>
              </td>
              <td className="p-2">
                <div className="rounded text-center text-gray-900" style={{ backgroundColor: cellColor(dbull.tries ? dbull.hits / dbull.tries : 0) }}>
                  {dbull.tries ? Math.round((dbull.hits / dbull.tries) * 100) : 0}% Double Bull
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

