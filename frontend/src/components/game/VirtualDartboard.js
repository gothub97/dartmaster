"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// Dartboard segment values in correct order
const SEGMENTS = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5, 20
];

// Multiplier regions
const MULTIPLIERS = {
  OUTER_SINGLE: 1,
  TRIPLE: 3,
  INNER_SINGLE: 1,
  DOUBLE: 2,
  OUTER_BULL: 25,
  INNER_BULL: 50
};

// Ring radii (as percentages of board radius)
const RINGS = {
  WIRE: 102,
  DOUBLE_OUTER: 100,
  DOUBLE_INNER: 92,
  SINGLE_OUTER: 92,
  TRIPLE_OUTER: 62,
  TRIPLE_INNER: 54,
  SINGLE_INNER: 54,
  BULL_OUTER: 16,
  BULL_INNER: 6.5
};

export default function VirtualDartboard({ 
  onThrow = () => {}, 
  disabled = false,
  showLabels = true,
  size = 450,
  highlightSegment = null 
}) {
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [lastThrows, setLastThrows] = useState([]);
  const [animatingThrow, setAnimatingThrow] = useState(null);
  const [dartPositions, setDartPositions] = useState([]);
  const svgRef = useRef(null);

  // Calculate angle for each segment
  const segmentAngle = 360 / 20; // 18 degrees per segment
  const startAngle = -90 - segmentAngle / 2; // Start at top

  // Generate path for a segment
  const generateSegmentPath = (index, innerRadius, outerRadius) => {
    const angleStart = startAngle + index * segmentAngle;
    const angleEnd = angleStart + segmentAngle;
    
    const toRadians = (angle) => (angle * Math.PI) / 180;
    
    const x1 = Math.cos(toRadians(angleStart)) * innerRadius;
    const y1 = Math.sin(toRadians(angleStart)) * innerRadius;
    const x2 = Math.cos(toRadians(angleEnd)) * innerRadius;
    const y2 = Math.sin(toRadians(angleEnd)) * innerRadius;
    const x3 = Math.cos(toRadians(angleEnd)) * outerRadius;
    const y3 = Math.sin(toRadians(angleEnd)) * outerRadius;
    const x4 = Math.cos(toRadians(angleStart)) * outerRadius;
    const y4 = Math.sin(toRadians(angleStart)) * outerRadius;

    const largeArcFlag = segmentAngle > 180 ? 1 : 0;

    return `
      M ${x1} ${y1}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}
      Z
    `;
  };

  // Handle segment click with dart animation
  const handleSegmentClick = (value, multiplier, segmentId, event) => {
    if (disabled) return;

    // Get click position relative to SVG
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left - rect.width / 2) / rect.width) * 220;
    const y = ((event.clientY - rect.top - rect.height / 2) / rect.height) * 220;

    const throwData = {
      value,
      multiplier,
      total: value === 'BULL' ? 50 : value === 'OUTER_BULL' ? 25 : value * multiplier,
      display: getDisplayValue(value, multiplier),
      timestamp: Date.now(),
      segmentId,
      position: { x, y }
    };

    // Add dart animation at click position
    setDartPositions(prev => [...prev, { x, y, id: Date.now() }]);
    setTimeout(() => {
      setDartPositions(prev => prev.slice(1));
    }, 2000);

    // Add animation
    setAnimatingThrow(segmentId);
    setTimeout(() => setAnimatingThrow(null), 400);

    // Add to last throws
    setLastThrows(prev => [throwData, ...prev].slice(0, 3));

    // Callback to parent
    onThrow(throwData);

    // Haptic feedback on mobile
    if (window.navigator.vibrate) {
      window.navigator.vibrate(30);
    }
  };

  // Get display value for a throw
  const getDisplayValue = (value, multiplier) => {
    if (value === 'BULL') return 'BULL';
    if (value === 'OUTER_BULL') return '25';
    if (multiplier === 3) return `T${value}`;
    if (multiplier === 2) return `D${value}`;
    return `${value}`;
  };

  // Get segment color
  const getSegmentColor = (index, type = 'single') => {
    const isEvenSegment = index % 2 === 0;
    
    if (type === 'triple' || type === 'double') {
      return isEvenSegment ? '#DC2626' : '#16A34A'; // Red or Green
    }
    
    return isEvenSegment ? '#0F172A' : '#F5F5DC'; // Black or Cream
  };

  // Undo last throw
  const undoLastThrow = () => {
    if (lastThrows.length > 0) {
      const [removed, ...rest] = lastThrows;
      setLastThrows(rest);
      onThrow({ ...removed, undo: true });
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Main dartboard container */}
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent rounded-3xl"></div>
        
        {/* Dartboard SVG */}
        <div className="relative">
          <svg
            ref={svgRef}
            width={size}
            height={size}
            viewBox="-110 -110 220 220"
            className={`transform transition-transform ${disabled ? 'opacity-50' : 'cursor-crosshair'} drop-shadow-2xl`}
            style={{ touchAction: 'none' }}
          >
            {/* Definitions for gradients and filters */}
            <defs>
              <radialGradient id="boardGradient">
                <stop offset="0%" stopColor="#8B4513" stopOpacity="1"/>
                <stop offset="100%" stopColor="#654321" stopOpacity="1"/>
              </radialGradient>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                <feOffset dx="0" dy="2" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.5"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <radialGradient id="bullGradient">
                <stop offset="0%" stopColor="#EF4444"/>
                <stop offset="100%" stopColor="#DC2626"/>
              </radialGradient>
              <radialGradient id="outerBullGradient">
                <stop offset="0%" stopColor="#22C55E"/>
                <stop offset="100%" stopColor="#16A34A"/>
              </radialGradient>
            </defs>

            {/* Outer board and wire effect */}
            <circle
              cx="0"
              cy="0"
              r="105"
              fill="url(#boardGradient)"
              stroke="#4A4A4A"
              strokeWidth="2.5"
              filter="url(#shadow)"
            />
            
            {/* Wire ring */}
            <circle
              cx="0"
              cy="0"
              r={RINGS.WIRE}
              fill="none"
              stroke="#C0C0C0"
              strokeWidth="0.8"
              opacity="0.6"
            />

            {/* Double ring segments */}
            {SEGMENTS.slice(0, 20).map((value, index) => (
              <g key={`double-${index}`}>
                <path
                  d={generateSegmentPath(index, RINGS.DOUBLE_INNER, RINGS.DOUBLE_OUTER)}
                  fill={getSegmentColor(index, 'double')}
                  stroke="#C0C0C0"
                  strokeWidth="0.3"
                  className={`transition-all duration-200 ${
                    !disabled && 'hover:brightness-125 hover:filter hover:drop-shadow-lg'
                  } ${animatingThrow === `double-${index}` ? 'animate-pulse scale-105' : ''}`}
                  style={{ transformOrigin: 'center' }}
                  onClick={(e) => handleSegmentClick(value, MULTIPLIERS.DOUBLE, `double-${index}`, e)}
                  onMouseEnter={() => setHoveredSegment(`D${value}`)}
                  onMouseLeave={() => setHoveredSegment(null)}
                  opacity={hoveredSegment && hoveredSegment !== `D${value}` ? 0.7 : 1}
                />
              </g>
            ))}

            {/* Outer single segments */}
            {SEGMENTS.slice(0, 20).map((value, index) => (
              <g key={`outer-single-${index}`}>
                <path
                  d={generateSegmentPath(index, RINGS.TRIPLE_OUTER, RINGS.SINGLE_OUTER)}
                  fill={getSegmentColor(index, 'single')}
                  stroke="#999"
                  strokeWidth="0.2"
                  className={`transition-all duration-200 ${
                    !disabled && 'hover:brightness-110'
                  } ${animatingThrow === `outer-single-${index}` ? 'animate-pulse' : ''}`}
                  onClick={(e) => handleSegmentClick(value, MULTIPLIERS.OUTER_SINGLE, `outer-single-${index}`, e)}
                  onMouseEnter={() => setHoveredSegment(`${value}`)}
                  onMouseLeave={() => setHoveredSegment(null)}
                  opacity={hoveredSegment && hoveredSegment !== `${value}` ? 0.7 : 1}
                />
              </g>
            ))}

            {/* Triple ring segments */}
            {SEGMENTS.slice(0, 20).map((value, index) => (
              <g key={`triple-${index}`}>
                <path
                  d={generateSegmentPath(index, RINGS.TRIPLE_INNER, RINGS.TRIPLE_OUTER)}
                  fill={getSegmentColor(index, 'triple')}
                  stroke="#C0C0C0"
                  strokeWidth="0.3"
                  className={`transition-all duration-200 ${
                    !disabled && 'hover:brightness-125 hover:filter hover:drop-shadow-lg'
                  } ${animatingThrow === `triple-${index}` ? 'animate-pulse scale-105' : ''}`}
                  style={{ transformOrigin: 'center' }}
                  onClick={(e) => handleSegmentClick(value, MULTIPLIERS.TRIPLE, `triple-${index}`, e)}
                  onMouseEnter={() => setHoveredSegment(`T${value}`)}
                  onMouseLeave={() => setHoveredSegment(null)}
                  opacity={hoveredSegment && hoveredSegment !== `T${value}` ? 0.7 : 1}
                />
              </g>
            ))}

            {/* Inner single segments */}
            {SEGMENTS.slice(0, 20).map((value, index) => (
              <g key={`inner-single-${index}`}>
                <path
                  d={generateSegmentPath(index, RINGS.BULL_OUTER, RINGS.SINGLE_INNER)}
                  fill={getSegmentColor(index, 'single')}
                  stroke="#999"
                  strokeWidth="0.2"
                  className={`transition-all duration-200 ${
                    !disabled && 'hover:brightness-110'
                  } ${animatingThrow === `inner-single-${index}` ? 'animate-pulse' : ''}`}
                  onClick={(e) => handleSegmentClick(value, MULTIPLIERS.INNER_SINGLE, `inner-single-${index}`, e)}
                  onMouseEnter={() => setHoveredSegment(`${value}`)}
                  onMouseLeave={() => setHoveredSegment(null)}
                  opacity={hoveredSegment && hoveredSegment !== `${value}` ? 0.7 : 1}
                />
              </g>
            ))}

            {/* Outer bull (25) */}
            <circle
              cx="0"
              cy="0"
              r={RINGS.BULL_OUTER}
              fill="url(#outerBullGradient)"
              stroke="#C0C0C0"
              strokeWidth="0.5"
              className={`transition-all duration-200 ${
                !disabled && 'hover:brightness-125 hover:filter hover:drop-shadow-lg'
              } ${animatingThrow === 'outer-bull' ? 'animate-pulse scale-110' : ''}`}
              style={{ transformOrigin: 'center' }}
              onClick={(e) => handleSegmentClick('OUTER_BULL', 1, 'outer-bull', e)}
              onMouseEnter={() => setHoveredSegment('25')}
              onMouseLeave={() => setHoveredSegment(null)}
              opacity={hoveredSegment && hoveredSegment !== '25' ? 0.7 : 1}
            />

            {/* Inner bull (50) */}
            <circle
              cx="0"
              cy="0"
              r={RINGS.BULL_INNER}
              fill="url(#bullGradient)"
              stroke="#C0C0C0"
              strokeWidth="0.5"
              className={`transition-all duration-200 ${
                !disabled && 'hover:brightness-125 hover:filter hover:drop-shadow-lg'
              } ${animatingThrow === 'inner-bull' ? 'animate-pulse scale-110' : ''}`}
              style={{ transformOrigin: 'center' }}
              onClick={(e) => handleSegmentClick('BULL', 1, 'inner-bull', e)}
              onMouseEnter={() => setHoveredSegment('BULL')}
              onMouseLeave={() => setHoveredSegment(null)}
              opacity={hoveredSegment && hoveredSegment !== 'BULL' ? 0.7 : 1}
            />

            {/* Wire separators */}
            {SEGMENTS.slice(0, 20).map((_, index) => {
              const angle = startAngle + index * segmentAngle;
              const toRadians = (angle) => (angle * Math.PI) / 180;
              const x1 = Math.cos(toRadians(angle)) * RINGS.BULL_OUTER;
              const y1 = Math.sin(toRadians(angle)) * RINGS.BULL_OUTER;
              const x2 = Math.cos(toRadians(angle)) * RINGS.DOUBLE_OUTER;
              const y2 = Math.sin(toRadians(angle)) * RINGS.DOUBLE_OUTER;
              
              return (
                <line
                  key={`wire-${index}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#C0C0C0"
                  strokeWidth="0.4"
                  opacity="0.6"
                  pointerEvents="none"
                />
              );
            })}

            {/* Number labels */}
            {showLabels && SEGMENTS.slice(0, 20).map((value, index) => {
              const angle = startAngle + index * segmentAngle + segmentAngle / 2;
              const radius = 88;
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;
              
              return (
                <text
                  key={`label-${index}`}
                  x={x}
                  y={y}
                  fill="#FFF"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  pointerEvents="none"
                  style={{ 
                    userSelect: 'none',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                  }}
                >
                  {value}
                </text>
              );
            })}

            {/* Dart markers */}
            {dartPositions.map((dart) => (
              <g key={dart.id} className="animate-fade-in-scale">
                <circle
                  cx={dart.x}
                  cy={dart.y}
                  r="3"
                  fill="#FFD700"
                  stroke="#333"
                  strokeWidth="1"
                  className="animate-pulse"
                />
                <circle
                  cx={dart.x}
                  cy={dart.y}
                  r="1.5"
                  fill="#FF0000"
                />
              </g>
            ))}
          </svg>

          {/* Hover tooltip */}
          {hoveredSegment && (
            <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-gray-900/95 backdrop-blur text-white px-4 py-2 rounded-xl text-lg font-bold pointer-events-none z-10 shadow-xl animate-fade-in">
              <div className="text-center">{hoveredSegment}</div>
              <div className="absolute left-1/2 transform -translate-x-1/2 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900/95"></div>
            </div>
          )}
        </div>
      </div>

      {/* Last throws display */}
      {lastThrows.length > 0 && (
        <div className="flex items-center justify-center space-x-4">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 shadow-xl">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-400">Recent:</span>
              <div className="flex space-x-2">
                {lastThrows.map((throwData, index) => (
                  <div
                    key={throwData.timestamp}
                    className={`px-4 py-2 rounded-xl font-bold transition-all transform ${
                      index === 0 
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white scale-110 shadow-lg animate-bounce-in' 
                        : 'bg-gray-700/50 text-gray-300 scale-95'
                    }`}
                  >
                    {throwData.display}
                  </div>
                ))}
              </div>
              
              {/* Undo button */}
              <button
                onClick={undoLastThrow}
                className="p-3 rounded-xl bg-gray-700/50 hover:bg-gray-600/50 transition-all transform hover:scale-105 group"
                title="Undo last throw"
              >
                <svg className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in-scale {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes bounce-in {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1.1);
            opacity: 1;
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-scale {
          animation: fade-in-scale 0.3s ease-out;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.3s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}