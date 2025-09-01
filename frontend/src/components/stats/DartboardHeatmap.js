"use client";

// Full SVG dartboard heatmap with segment-level coloring
// Props:
// - heatmap: { [key]: { hits, tries, density } }
// - mode: 'hitRate' | 'density'

const SEGMENTS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5, 20];
const RINGS = {
  DOUBLE_OUTER: 100,
  DOUBLE_INNER: 92,
  TRIPLE_OUTER: 62,
  TRIPLE_INNER: 54,
  SINGLE_OUTER: 92,
  SINGLE_INNER: 54,
  BULL_OUTER: 16,
  BULL_INNER: 6.5,
};

function toRadians(a) { return (a * Math.PI) / 180; }

function segmentPath(index, innerRadius, outerRadius) {
  const angle = 360 / 20;
  const start = -90 - angle / 2 + index * angle;
  const end = start + angle;
  const x1 = Math.cos(toRadians(start)) * innerRadius;
  const y1 = Math.sin(toRadians(start)) * innerRadius;
  const x2 = Math.cos(toRadians(end)) * innerRadius;
  const y2 = Math.sin(toRadians(end)) * innerRadius;
  const x3 = Math.cos(toRadians(end)) * outerRadius;
  const y3 = Math.sin(toRadians(end)) * outerRadius;
  const x4 = Math.cos(toRadians(start)) * outerRadius;
  const y4 = Math.sin(toRadians(start)) * outerRadius;
  const largeArcFlag = angle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
}

function colorFrom(value) {
  // value expected 0..1
  const v = Math.max(0, Math.min(1, value || 0));
  const r = 255;
  const g = Math.round(255 * (1 - v));
  const b = Math.round(128 * (1 - v));
  return `rgb(${r},${g},${b})`;
}

export default function DartboardHeatmap({ heatmap = {}, mode = "hitRate" }) {
  // Find max density for normalization
  const densities = Object.values(heatmap).map((c) => c?.density || 0);
  const maxDensity = Math.max(1, ...densities);

  const getValue = (key) => {
    const c = heatmap[key] || { hits: 0, tries: 0, density: 0 };
    if (mode === "density") return c.density / maxDensity;
    return c.tries ? c.hits / c.tries : 0;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Heatmap</h3>
        <div className="text-xs text-gray-600">{mode === 'hitRate' ? 'Hit Rate' : 'Throw Density'}</div>
      </div>
      <div className="flex items-center justify-center">
        <svg width={360} height={360} viewBox="-110 -110 220 220">
          {/* Double ring */}
          {SEGMENTS.slice(0, 20).map((v, i) => (
            <path key={`D-${i}`} d={segmentPath(i, RINGS.DOUBLE_INNER, RINGS.DOUBLE_OUTER)} fill={colorFrom(getValue(`D${v}`))} stroke="#eee" strokeWidth="0.2" />
          ))}
          {/* Outer singles */}
          {SEGMENTS.slice(0, 20).map((v, i) => (
            <path key={`Sout-${i}`} d={segmentPath(i, RINGS.TRIPLE_OUTER, RINGS.SINGLE_OUTER)} fill={colorFrom(getValue(`S${v}`))} stroke="#eee" strokeWidth="0.15" />
          ))}
          {/* Triples */}
          {SEGMENTS.slice(0, 20).map((v, i) => (
            <path key={`T-${i}`} d={segmentPath(i, RINGS.TRIPLE_INNER, RINGS.TRIPLE_OUTER)} fill={colorFrom(getValue(`T${v}`))} stroke="#eee" strokeWidth="0.2" />
          ))}
          {/* Inner singles */}
          {SEGMENTS.slice(0, 20).map((v, i) => (
            <path key={`Sin-${i}`} d={segmentPath(i, RINGS.BULL_OUTER, RINGS.SINGLE_INNER)} fill={colorFrom(getValue(`S${v}`))} stroke="#eee" strokeWidth="0.15" />
          ))}
          {/* Bulls */}
          <circle cx="0" cy="0" r={RINGS.BULL_OUTER} fill={colorFrom(getValue("BULL"))} stroke="#eee" strokeWidth="0.5" />
          <circle cx="0" cy="0" r={RINGS.BULL_INNER} fill={colorFrom(getValue("DBULL"))} stroke="#eee" strokeWidth="0.5" />
        </svg>
      </div>
      <div className="text-xs text-gray-500 text-center mt-2">Redder = higher intensity</div>
    </div>
  );
}

